import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import crypto from 'crypto';

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import formidable from 'formidable';
import fs from 'fs/promises';

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (built by Vite)
app.use(express.static(path.join(__dirname, '../dist')));

// Signed action link helpers
function encodeBase64Url(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64url');
}

function decodeBase64Url(str) {
  return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
}

function signData(dataString, secret) {
  return crypto.createHmac('sha256', secret).update(dataString).digest('base64url');
}

function verifySignature(dataString, signature, secret) {
  try {
    const expected = signData(dataString, secret);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parseEmailsFromEnv(envValue) {
  if (!envValue) return [];
  return envValue.split(',').map(e => e.trim()).filter(Boolean);
}

function createActionLink(baseUrl, action, actor, payload, secret) {
  const data = encodeBase64Url(payload);
  const sig = signData(data, secret);
  return `${baseUrl}/review?action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}&data=${encodeURIComponent(data)}&sig=${encodeURIComponent(sig)}`;
}

// Event window calculation helpers
function getMemorialDayDateForYear(year) {
  // Memorial Day: last Monday of May
  const date = new Date(Date.UTC(year, 4, 31)); // May is month 4 (0-indexed). Start at May 31 UTC
  // Move back to Monday
  const day = date.getUTCDay(); // 0 Sun - 6 Sat
  const offset = (day + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - offset);
  return date; // still UTC date
}

function getVeteransDayDateForYear(year) {
  // Veterans Day: November 11
  return new Date(Date.UTC(year, 10, 11)); // November is 10
}

function toEasternMidnight(date) {
  // Convert a JS Date to New York local date at midnight for comparisons
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const y = Number(parts.find(p => p.type === 'year').value);
  const m = Number(parts.find(p => p.type === 'month').value);
  const d = Number(parts.find(p => p.type === 'day').value);
  // Create a date at 00:00 ET by interpreting components in ET then approximating via toLocale string
  const local = new Date(`${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y} 00:00:00 GMT-0500`);
  // The above may be off during DST; instead, construct from formatter again:
  return new Date(new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00`).toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function daysUntilInEastern(now, target) {
  const nowET = toEasternMidnight(now);
  const targetET = toEasternMidnight(target);
  const diffMs = targetET.getTime() - nowET.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getEventPhraseForWindow(now = new Date()) {
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(now);
  const y = Number(year);
  const mdThis = getMemorialDayDateForYear(y);
  const mdNext = getMemorialDayDateForYear(y + 1);
  const vdThis = getVeteransDayDateForYear(y);
  const vdNext = getVeteransDayDateForYear(y + 1);

  // Choose next dates >= today
  const dMd = daysUntilInEastern(now, mdThis) >= 0 ? daysUntilInEastern(now, mdThis) : daysUntilInEastern(now, mdNext);
  const dVd = daysUntilInEastern(now, vdThis) >= 0 ? daysUntilInEastern(now, vdThis) : daysUntilInEastern(now, vdNext);

  if (dMd >= 0 && dMd <= 14) return 'ahead of Memorial Day';
  if (dVd >= 0 && dVd <= 14) return 'ahead of Veterans Day';
  return null;
}
// Always choose the next event name, regardless of window
function getNextEventPhrase(now = new Date()) {
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(now);
  const y = Number(year);
  const mdThis = getMemorialDayDateForYear(y);
  const mdNext = getMemorialDayDateForYear(y + 1);
  const vdThis = getVeteransDayDateForYear(y);
  const vdNext = getVeteransDayDateForYear(y + 1);

  const dMd = daysUntilInEastern(now, mdThis) >= 0 ? daysUntilInEastern(now, mdThis) : daysUntilInEastern(now, mdNext);
  const dVd = daysUntilInEastern(now, vdThis) >= 0 ? daysUntilInEastern(now, vdThis) : daysUntilInEastern(now, vdNext);

  return dMd <= dVd ? 'ahead of Memorial Day' : 'ahead of Veterans Day';
}
// Suggest event with a cutoff: if we're within `cutoffDays` of the next event,
// choose the following event instead (we likely missed the print window).
function getSuggestedEventPhrase(now = new Date(), cutoffDays = 21) {
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(now);
  const y = Number(year);
  const mdThis = getMemorialDayDateForYear(y);
  const mdNext = getMemorialDayDateForYear(y + 1);
  const vdThis = getVeteransDayDateForYear(y);
  const vdNext = getVeteransDayDateForYear(y + 1);

  const dMdRaw = daysUntilInEastern(now, mdThis);
  const dVdRaw = daysUntilInEastern(now, vdThis);
  const dMd = dMdRaw >= 0 ? dMdRaw : daysUntilInEastern(now, mdNext);
  const dVd = dVdRaw >= 0 ? dVdRaw : daysUntilInEastern(now, vdNext);

  const isMemorialNext = dMd <= dVd;

  if (isMemorialNext && dMd <= cutoffDays) return 'ahead of Veterans Day';
  if (!isMemorialNext && dVd <= cutoffDays) return 'ahead of Memorial Day';
  return isMemorialNext ? 'ahead of Memorial Day' : 'ahead of Veterans Day';
}
// --- END EVENT WINDOW HELPERS ---

/**
 * Generate a pre-signed PUT URL for DigitalOcean Spaces
 */
app.post('/api/upload-image', async (req, res) => {
  const {
    DO_SPACES_BUCKET_NAME: bucketName,
    DO_SPACES_ENDPOINT: spacesEndpoint,
    DO_SPACES_REGION: spacesRegion,
    DO_SPACES_ACCESS_KEY: accessKeyId,
    DO_SPACES_SECRET_KEY: secretAccessKey,
  } = process.env;

  if (!bucketName || !spacesEndpoint || !spacesRegion || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Spaces credentials or configuration.' });
  }

  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'Missing filename or contentType in request.' });
  }

  // Sanitize filename & create unique key
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectKey = `uploads/${uuidv4()}-${safeFilename}`;

  const s3Client = new S3Client({
    endpoint: `https://${spacesEndpoint}`,
    region: spacesRegion,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
    ACL: 'public-read',
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${bucketName}.${spacesRegion}.digitaloceanspaces.com/${objectKey}`;
    return res.status(200).json({ uploadUrl: signedUrl, objectKey, publicUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate pre-signed URL.', details: error.message });
  }
});

// Review UI and action endpoints
app.get('/review', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { action, actor, data, sig } = req.query;
    const ACTION_LINK_SECRET = process.env.ACTION_LINK_SECRET;
    if (!action || !actor || !data || !sig || !ACTION_LINK_SECRET) {
      return res.status(400).send('Invalid or missing parameters.');
    }
    const ok = verifySignature(String(data), String(sig), ACTION_LINK_SECRET);
    if (!ok) {
      return res.status(400).send('Invalid signature.');
    }
    const payload = decodeBase64Url(String(data));

    const ADMIN_EMAIL_RECIPIENTS = parseEmailsFromEnv(process.env.ADMIN_EMAIL_RECIPIENTS);
    const TOWN_EMAIL_RECIPIENTS = parseEmailsFromEnv(process.env.TOWN_EMAIL_RECIPIENTS);
    const isAdmin = String(actor) === 'admin';
    const alertGroup = isAdmin ? TOWN_EMAIL_RECIPIENTS : ADMIN_EMAIL_RECIPIENTS;
    const actorEmail = payload.recipientEmail || '';
    const adminPrimaryEmail = (ADMIN_EMAIL_RECIPIENTS[0] || '').toString();

    const eventPhrase = getSuggestedEventPhrase(new Date(), 21);
    const defaultApproveMsg = `Hello ${payload.sponsorName},\n\nYour Hometown Hero banner for ${payload.veteranName} has been approved. It looks good and will be printed ${eventPhrase}.\n\nThank you!`;
    const defaultIssueMsg = `Hello ${payload.sponsorName},\n\nThank you for your Hometown Hero banner submission for ${payload.veteranName}. We took a look and need a small update before we can approve it. Could you please send a clearer photo of the veteran?\n\nIf you have any questions, please use the Reply button below${adminPrimaryEmail ? ` or email ${adminPrimaryEmail}` : ''} and we will be happy to help.\n\nThank you!\nThe Berkeley Heights Veterans Affairs Committee`;

    // Quick reasons removed to keep the form simple and focused

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const submitUrl = `${baseUrl}/api/send-review-action`;

    const approved = String(action) === 'approve';
    const defaultBody = approved ? defaultApproveMsg : defaultIssueMsg;

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hometown Heroes Review</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 720px; margin: 24px auto; padding: 0 16px;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #0f3d6e; color: #fff; padding: 16px 20px;">
            <h2 style="margin: 0; font-size: 18px;">${approved ? 'Approve Submission' : 'Flag Submission for Update'}</h2>
          </div>
          <div style="padding: 20px;">
            <p style="margin-top: 0;">Hi ${actorEmail ? `<strong>${actorEmail}</strong>` : (isAdmin ? 'Admin' : 'Town Clerk')}, you are composing a message to the banner applicant <strong>${payload.sponsorName}</strong> about the banner for <strong>${payload.veteranName}</strong>.</p>

            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0 0 4px 0; font-weight: 600;">Notice</p>
              <p style="margin: 0; font-size: 14px;">When you send this message, it will go to <strong>${payload.sponsorName} &lt;${payload.sponsorEmail}&gt;</strong> and a copy will be sent to <strong>${(alertGroup || []).join(', ') || (isAdmin ? 'the Town Clerk group' : 'the Admin group')}</strong>.</p>
            </div>

            

            <form method="POST" action="${submitUrl}">
              <input type="hidden" name="action" value="${approved ? 'approve' : 'issue'}" />
              <input type="hidden" name="actor" value="${isAdmin ? 'admin' : 'town'}" />
              <input type="hidden" name="data" value="${String(data)}" />
              <input type="hidden" name="sig" value="${String(sig)}" />

              <label for="subject" style="display:block; margin-bottom: 6px; font-weight: 600;">Subject</label>
              <input id="subject" name="subject" value="${approved ? `Your Hometown Hero banner for ${payload.veteranName} has been approved` : `Update needed for your Hometown Hero banner`}" style="width:100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px;" />

              <label for="body" style="display:block; margin-bottom: 6px; font-weight: 600;">Message</label>
              <textarea id="body" name="body" rows="10" style="width:100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">${defaultBody}</textarea>

              <div style="margin-top: 12px;">
                <button type="submit" style="background: #0f3d6e; color: #fff; padding: 10px 16px; border: 0; border-radius: 6px; cursor: pointer;">Send</button>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `;

    const renderMs = Date.now() - startedAt;
    console.log('[review] render complete', { renderMs, actor, action: String(action) });
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Render-Time-ms', String(renderMs));
    res.send(html);
  } catch (e) {
    console.error('Error rendering review page', e);
    res.status(500).send('Failed to render review page');
  }
});

app.post('/api/send-review-action', async (req, res) => {
  try {
    const { action, actor, data, sig, subject, body } = req.body;
    const ACTION_LINK_SECRET = process.env.ACTION_LINK_SECRET;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!action || !actor || !data || !sig || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!ACTION_LINK_SECRET || !RESEND_API_KEY) {
      return res.status(500).json({ error: 'Server missing configuration' });
    }
    const valid = verifySignature(String(data), String(sig), ACTION_LINK_SECRET);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    const payload = decodeBase64Url(String(data));
    const resend = new Resend(RESEND_API_KEY);

    const ADMIN_EMAILS = parseEmailsFromEnv(process.env.ADMIN_EMAIL_RECIPIENTS);
    const TOWN_EMAILS = parseEmailsFromEnv(process.env.TOWN_EMAIL_RECIPIENTS);
    const isAdmin = String(actor) === 'admin';

    // Explicit sends only: do not CC or BCC to improve reliability
    const cc = [];
    const senderEmail = (payload.recipientEmail || '').toString().trim();
    const adminPrimary = (ADMIN_EMAILS[0] || '').toString().trim();

    const to = [String(payload.sponsorEmail || '').trim()].filter(Boolean);
    if (to.length === 0) {
      return res.status(400).json({ error: 'Missing sponsor email in payload' });
    }

    console.log('[review-action] Sending applicant email', {
      to,
      subject,
      veteran: payload.veteranName,
      sponsor: payload.sponsorEmail,
    });

    const replyToAddress = (adminPrimary || senderEmail || '').trim() || undefined;
    const replyMailto = replyToAddress ? `mailto:${encodeURIComponent(replyToAddress)}?subject=${encodeURIComponent('Re: ' + String(subject))}` : '';
    const allowReplyCTA = String(action) !== 'approve';
    const applicantHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:16px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;color:#111;">
          <div style="padding:16px 20px;">
            <div style="white-space: pre-wrap; line-height:1.55;">${String(body).replace(/</g, '&lt;')}</div>
            ${allowReplyCTA && replyMailto ? `
            <div style="margin-top:16px;">
              <a href="${replyMailto}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700;box-shadow:0 6px 16px rgba(37,99,235,0.35);border:1px solid #1e40af;">Reply to the Berkeley Heights Veterans Affairs Committee</a>
              <p style="margin:8px 0 0 0; color:#4b5563; font-size:12px;">If the button does not work, email ${replyToAddress}.</p>
            </div>` : ''}
          </div>
        </div>
      </div>
    `;

    const { error: applicantError } = await resend.emails.send({
      from: 'Hometown Heroes BH <noreply@banners.bhmemorialpark.com>',
      to,
      subject: String(subject),
      html: applicantHtml,
      reply_to: replyToAddress,
    });

    if (applicantError) {
      console.error('[review-action] Applicant email failed', applicantError);
    }

    // Notify the other group separately that an action was taken
    const bothGroups = Array.from(new Set([...ADMIN_EMAILS, ...TOWN_EMAILS].filter(Boolean)));
    if (bothGroups.length > 0) {
      const actorLabel = isAdmin ? 'Admin' : 'Town Clerk';
      const actorIdentity = senderEmail || actorLabel;
      const fyiSubject = `[FYI] Copy of message sent to ${payload.sponsorName} • ${payload.veteranName}`;
      console.log('[review-action] Notifying groups', { to: bothGroups, actor: actorIdentity, subject: fyiSubject });

      const quoted = `${String(body).replace(/</g, '&lt;')}`;
      const fyiHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#0b1220;padding:20px;">
          <div style="max-width:680px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;">
            <div style="padding:16px 20px;border-bottom:1px solid #1f2937;">
              <h2 style="margin:0;font-size:16px;line-height:22px;color:#f3f4f6;">FYI: Message sent to ${payload.sponsorName}</h2>
              <p style="margin:6px 0 0 0;color:#9ca3af;font-size:13px;">No action needed. You are receiving this for awareness.</p>
            </div>
            <div style="padding:16px 20px;">
              <p style="margin:0 0 8px 0;color:#d1d5db;font-size:14px;">
                <strong style="color:#e5e7eb;">To:</strong> ${payload.sponsorName} &lt;${payload.sponsorEmail}&gt;<br/>
                <strong style="color:#e5e7eb;">Regarding:</strong> ${payload.veteranName}<br/>
                <strong style="color:#e5e7eb;">Sent by:</strong> ${actorIdentity}<br/>
                <strong style="color:#e5e7eb;">Subject:</strong> ${String(subject).replace(/</g, '&lt;')}
              </p>

              <div style="margin-top:12px;background:#0b1220;border:1px solid #1f2937;border-left:4px solid #2563eb;border-radius:8px;">
                <div style="padding:12px 14px;">
                  <div style="white-space:pre-wrap;color:#e5e7eb;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:20px;">${quoted}</div>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      const { error: notifyError } = await resend.emails.send({
        from: 'Hometown Heroes BH <noreply@banners.bhmemorialpark.com>',
        to: bothGroups,
        subject: fyiSubject,
        html: fyiHtml,
        reply_to: actorIdentity,
      });
      if (notifyError) {
        console.error('[review-action] Group notify email failed', notifyError);
      }
    }

    const recipientsHtml = `
      <ul style="margin:8px 0 0 0; padding-left:16px; color:#9ca3af;">
        <li><strong style="color:#e5e7eb;">Applicant</strong>: ${to.join(', ')}</li>
        ${senderEmail ? `<li><strong style="color:#e5e7eb;">Sender</strong>: ${senderEmail}</li>` : ''}
        ${bothGroups && bothGroups.length ? `<li><strong style="color:#e5e7eb;">Groups Notified</strong>: ${bothGroups.join(', ')}</li>` : ''}
      </ul>
    `;

    const successHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Message Sent</title>
        </head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background:#0b1220; padding:24px 16px;">
          <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;">
            <div style="padding:16px 20px;border-bottom:1px solid #1f2937;">
              <h2 style="margin:0;font-size:18px;line-height:24px;color:#f3f4f6;">Message sent</h2>
            </div>
            <div style="padding:20px;">
              <p style="margin:0 0 8px 0;color:#d1d5db;">Your message has been sent successfully.</p>
              ${recipientsHtml}
              <div style="margin-top:16px;">
                <a href="/" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:600;">Back to site</a>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(successHtml);
  } catch (e) {
    console.error('Error sending review action email', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * Send transactional email via Resend.
 */
app.post('/api/send-email', async (req, res) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing Resend API key.' });
  }

  const { to, subject, text, html, from } = req.body || {};
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields (to, subject and either text or html).' });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: from || 'Hometown Heroes <noreply@berkeleyheights-veterans.org>',
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ error: error.message || 'Failed to send email.' });
    }

    return res.status(200).json({ message: 'Email sent successfully.' });
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
});

app.post('/api/submit-banner', async (req, res) => {
  const {
    DO_SPACES_BUCKET_NAME: bucketName,
    DO_SPACES_ENDPOINT: spacesEndpoint,
    DO_SPACES_REGION: spacesRegion,
    DO_SPACES_ACCESS_KEY: accessKeyId,
    DO_SPACES_SECRET_KEY: secretAccessKey,
  } = process.env;

  if (!bucketName || !spacesEndpoint || !spacesRegion || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Spaces credentials.' });
  }

  const s3Client = new S3Client({
    endpoint: `https://${spacesEndpoint}`,
    region: spacesRegion,
    credentials: { accessKeyId, secretAccessKey },
  });

  const form = formidable({ multiples: true, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(400).json({ error: 'Failed to parse form data.', details: err.message });
    }

    try {
      const {
        sponsorName, sponsorEmail, relationshipToVeteran,
        veteranName, veteranAddress, veteranYearsInBH, veteranBHConnection,
        serviceBranch, isReserve, servicePeriodOrConflict,
        consentGiven, unknownBranchInfo, unknownBranchAudio, photosMetadata // photosMetadata is expected as a JSON string
      } = fields;

      let parsedPhotosMeta = [];
      let photosMetadataString = photosMetadata;

      if (Array.isArray(photosMetadata) && photosMetadata.length > 0 && typeof photosMetadata[0] === 'string') {
        console.log('photosMetadata is an array, taking the first element as the JSON string.');
        photosMetadataString = photosMetadata[0];
      }

      if (typeof photosMetadataString === 'string') {
        try {
          parsedPhotosMeta = JSON.parse(photosMetadataString);
          console.log('Parsed photosMetadata:', JSON.stringify(parsedPhotosMeta, null, 2));
        } catch (e) {
          console.error("Failed to parse photosMetadata string:", photosMetadataString, "Error:", e);
          // Keep parsedPhotosMeta as empty array, don't return early, let PDF generation continue with placeholder
        }
      } else {
        console.log('photosMetadata was not a string or a recognized array format, or was missing:', photosMetadata);
      }

      const signatureFile = files.signatureImage?.[0]; // formidable wraps single files in an array
      console.log('Signature file details from formidable:', signatureFile ? { filepath: signatureFile.filepath, originalFilename: signatureFile.originalFilename, mimetype: signatureFile.mimetype, size: signatureFile.size } : 'No signature file received');

      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // US Letter size
      const { width, height } = page.getSize();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Keep for main title
      
      let yPosition = height - 50;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const usableWidth = width - leftMargin * 2;
      const bodyLineHeight = 15; // Increased slightly
      const headingLineHeight = 20;
      const sectionSpacing = bodyLineHeight * 1.5; // Space after a section

      const drawText = (text, x, y, options = {}) => {
        page.drawText(text, {
          x,
          y,
          font: options.font || timesRomanFont, // Default to TimesRoman
          size: options.size || 10, // Default body text size
          color: options.color || rgb(0, 0, 0),
          lineHeight: options.lineHeight || bodyLineHeight, // Default line height
        });
      };
      
      const drawWrappedText = (text, x, y, maxWidth, options = {}) => {
        const currentFont = options.font || timesRomanFont;
        const currentSize = options.size || 10;
        const currentLineHeight = options.lineHeight || bodyLineHeight; 
        let currentY = y;
        
        const words = text.split(/\s+/).filter(Boolean);
        let line = '';

        if (words.length === 0) {
            return currentY;
        }

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

            if (testWidth > maxWidth && line !== '') {
                drawText(line, x, currentY, {font: currentFont, size: currentSize, color: options.color, lineHeight: currentLineHeight});
                line = word;
                currentY -= currentLineHeight;
            } else {
                line = testLine;
            }
        }
        drawText(line, x, currentY, {font: currentFont, size: currentSize, color: options.color, lineHeight: currentLineHeight});
        return currentY - currentLineHeight;
      };


      // --- PDF Content ---
      // Main Title
      drawText('Hometown Hero Banner Program - Submission Contract', leftMargin, yPosition, { font: helveticaBoldFont, size: 18, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight * 1.5; // Extra space after main title

      drawText(`Submission Date: ${new Date().toLocaleDateString()}`, leftMargin, yPosition, {size: 10});
      yPosition -= bodyLineHeight * 1.5;

      // Applicant (Sponsor) Information
      drawText('Applicant (Sponsor) Information:', leftMargin, yPosition, { font: timesRomanBoldFont, size: 13, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight;
      drawText(`Name: ${sponsorName || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      drawText(`Email: ${sponsorEmail || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      drawText(`Relationship to Veteran: ${relationshipToVeteran || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= sectionSpacing;

      // Veteran Information
      drawText('Veteran Information:', leftMargin, yPosition, { font: timesRomanBoldFont, size: 13, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight;
      drawText(`Name: ${veteranName || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      drawText(`Berkeley Heights Address: ${veteranAddress || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      drawText(`Years in Berkeley Heights: ${veteranYearsInBH || 'N/A'}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      if (veteranBHConnection) {
        yPosition = drawWrappedText(
          `Berkeley Heights Connection: ${veteranBHConnection.toString()}`,
          leftMargin + 10,
          yPosition,
          usableWidth - 10,
          { size: 10, font: timesRomanFont, lineHeight: bodyLineHeight }
        );
        yPosition -= bodyLineHeight;
      }
      drawText(`Branch of Service: ${serviceBranch || 'N/A'}${isReserve === 'true' ? ' (Reserve)' : ''}`, leftMargin + 10, yPosition);
      yPosition -= bodyLineHeight;
      drawText(`Period of Service / Conflict: ${servicePeriodOrConflict || 'N/A'}`, leftMargin + 10, yPosition);
      if (unknownBranchInfo) {
        yPosition -= bodyLineHeight; // Move to a new line for this field
        yPosition = drawWrappedText(
          `Additional Branch Info: ${unknownBranchInfo.toString()}`,
          leftMargin + 10, // Indent like other veteran info values
          yPosition,
          usableWidth - 10, // Max width considering the x-indentation of 10 points
          { size: 10, font: timesRomanFont, lineHeight: bodyLineHeight } // Ensure font and line height match other values
        );
      }
      yPosition -= sectionSpacing;

      // Horizontal Line before T&C
      page.drawLine({
        start: { x: leftMargin, y: yPosition + bodyLineHeight / 2 },
        end: { x: rightMargin, y: yPosition + bodyLineHeight / 2 },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75), // Light gray line
      });
      yPosition -= bodyLineHeight; // Space for the line itself

      // Terms & Conditions
      drawText('Terms & Conditions:', leftMargin, yPosition, { font: timesRomanBoldFont, size: 13, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight; 
      
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // !!! IMPORTANT: REPLACE THIS WITH YOUR ACTUAL FULL T&C TEXT !!!
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      const termsAndConditionsParagraphs = [ // This is now an array of strings (paragraphs)
        "ELIGIBILITY REQUIREMENT: This program is exclusively for veterans who actually lived in Berkeley Heights, NJ. Veterans who never resided in our town are not eligible for hometown hero banners.",
        "1. Residency Verification: All applications are reviewed to verify the veteran's genuine connection to Berkeley Heights. Applications for veterans who did not live in Berkeley Heights will be rejected.",
        "2. I will receive an email once my submission has been approved.",
        "3. New banner submissions are sent to the printers 2 weeks before Memorial Day (mid-May) and 2 weeks before Veterans Day (late October). Once the banners arrive, they will be hung on one of the main streets of Berkeley Heights.",
        "4. The location of banners cannot be controlled; placement is determined by the Department of Public Works (DPW), who works hard to put them up, take them down, and maintain the banners.",
        "5. To locate a specific banner, you will need to drive around Berkeley Heights and look on Springfield Avenue, Plainfield Avenue, Snyder Avenue, and Park Avenue.",
        "6. Each veteran can only have one banner; multiple submissions for the same veteran will be rejected.",
        "7. Once printed, the town will continue to display the banner each Memorial Day and Veterans Day. The banners are reusable, heavy-duty, and designed for long-term use.",
        "8. The banners are paid for by the Berkeley Heights Veterans Affairs Committee and are at no cost to you or the veteran.",
        "9. I, " + (fields.sponsorName || "[Sponsor Name]") + ", approve and authorize the usage of my or my family member\'s photograph and name to be used on printed Hometown Hero Banners in Berkeley Heights."
      ];
      
      for (const paragraph of termsAndConditionsParagraphs) {
        const sanitizedParagraph = paragraph.replace(/\n/g, ' '); 
        yPosition = drawWrappedText(sanitizedParagraph, leftMargin, yPosition, usableWidth, { size: 9, lineHeight: 12 }); // T&C text smaller, tighter leading
        yPosition -= (bodyLineHeight / 2.5); // Adjust space between T&C paragraphs
      }
      yPosition -= sectionSpacing;

      // Submitted Photos
      drawText('Submitted Photos (Thumbnails):', leftMargin, yPosition, { font: timesRomanBoldFont, size: 13, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight;

      let photoX = leftMargin;
      const photoThumbSize = 80;
      const photoSpacing = 10;

      if (parsedPhotosMeta && parsedPhotosMeta.length > 0) {
        for (let i = 0; i < Math.min(parsedPhotosMeta.length, 3); i++) {
          const photoMeta = parsedPhotosMeta[i];
          console.log(`Processing photo ${i+1}/${parsedPhotosMeta.length}:`, JSON.stringify(photoMeta, null, 2));
          if (photoMeta.publicUrl && photoMeta.contentType) {
            try {
              console.log(`Fetching photo from: ${photoMeta.publicUrl}`);
              const photoRes = await fetch(photoMeta.publicUrl);
              if (!photoRes.ok) {
                console.error(`Failed to fetch photo ${photoMeta.publicUrl}: ${photoRes.status} ${photoRes.statusText}`);
                throw new Error(`Failed to fetch photo: ${photoRes.statusText}`);
              }
              const photoBytes = await photoRes.arrayBuffer();
              console.log(`Fetched ${photoBytes.byteLength} bytes for ${photoMeta.publicUrl}`);
              let photoImage;
              if (photoMeta.contentType.startsWith('image/jpeg') || photoMeta.contentType.startsWith('image/jpg')) {
                console.log(`Attempting to embed JPG: ${photoMeta.filename}`);
                photoImage = await pdfDoc.embedJpg(photoBytes);
                console.log(`Successfully embedded JPG: ${photoMeta.filename}`);
              } else if (photoMeta.contentType.startsWith('image/png')) {
                console.log(`Attempting to embed PNG: ${photoMeta.filename}`);
                photoImage = await pdfDoc.embedPng(photoBytes);
                console.log(`Successfully embedded PNG: ${photoMeta.filename}`);
              } else {
                console.warn(`Unsupported photo contentType: ${photoMeta.contentType} for ${photoMeta.filename}`);
              }
              
              if (photoImage) {
                const { width: iw, height: ih } = photoImage.scale(1);
                const scale = Math.min(photoThumbSize / iw, photoThumbSize / ih);
                page.drawImage(photoImage, {
                  x: photoX,
                  y: yPosition - photoThumbSize,
                  width: iw * scale,
                  height: ih * scale,
                });
                photoX += photoThumbSize + photoSpacing;
              }
            } catch (photoFetchError) {
              console.error(`Failed to embed photo ${photoMeta.publicUrl || photoMeta.filename}:`, photoFetchError);
              // Optionally draw a placeholder if a photo fails to load
            }
          } else {
            console.warn('Skipping photo due to missing publicUrl or contentType:', JSON.stringify(photoMeta, null, 2));
          }
        }
      } else {
         console.log('No parsed photo metadata available or empty array, drawing placeholder text.');
         drawText('No photos submitted or metadata missing.', leftMargin, yPosition - photoThumbSize / 2, {size: 10});
      }
      yPosition -= (photoThumbSize + sectionSpacing); // Ensure enough space after photos or placeholder

      // Horizontal Line before Signature
      page.drawLine({
        start: { x: leftMargin, y: yPosition + bodyLineHeight / 2 },
        end: { x: rightMargin, y: yPosition + bodyLineHeight / 2 },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75), // Light gray line
      });
      yPosition -= bodyLineHeight; // Space for the line itself

      // Authorization Signature
      drawText('Authorization Signature:', leftMargin, yPosition, { font: timesRomanBoldFont, size: 13, lineHeight: headingLineHeight });
      yPosition -= headingLineHeight;

      if (signatureFile && signatureFile.filepath) {
        console.log(`Attempting to read signature file from: ${signatureFile.filepath}`);
        try {
          const signatureBytes = await fs.readFile(signatureFile.filepath);
          console.log(`Read ${signatureBytes.byteLength} bytes for signature. Mimetype: ${signatureFile.mimetype}. Attempting to embed as PNG.`);
          const signatureImage = await pdfDoc.embedPng(signatureBytes); // Assuming signature is PNG
          console.log(`Successfully embedded signature image. Original Dims: ${signatureImage.width}w x ${signatureImage.height}h`);
          const sigScale = Math.min(200 / signatureImage.width, 80 / signatureImage.height);
          const sigWidth = signatureImage.width * sigScale;
          const sigHeight = signatureImage.height * sigScale;
          const sigY = yPosition - sigHeight;
          console.log(`Calculated signature display: scale=${sigScale.toFixed(4)}, width=${sigWidth.toFixed(2)}, height=${sigHeight.toFixed(2)}, x=${leftMargin}, y=${sigY.toFixed(2)} (current yPosition=${yPosition.toFixed(2)})`);
          
          // --- PERMANENT BACKGROUND FOR SIGNATURE ---
          const sigBgColor = rgb(0.95, 0.95, 0.95); // Very light gray
          page.drawRectangle({
            x: leftMargin, 
            y: sigY - ( (80 - sigHeight)/2 ), // Center the box vertically if sigHeight is less than 80 (max height)
            width: 200, // Fixed width for signature box
            height: 80, // Fixed max height for signature box
            color: sigBgColor,
          });

          page.drawImage(signatureImage, {
            x: leftMargin + ( (200 - sigWidth)/2 ), // Center signature horizontally in the box
            y: sigY - ( (80 - sigHeight)/2 ) + ( (80 - sigHeight)/2 ), // Center signature vertically in the box
            width: sigWidth,
            height: sigHeight,
          });
          // Adjust yPosition based on the fixed signature box height
          yPosition -= (80 + bodyLineHeight); 

          drawText(`Signed by: ${sponsorName || 'N/A'}`, leftMargin, yPosition, {size: 10});
           yPosition -= bodyLineHeight;
          drawText(`Date: ${new Date().toLocaleString()}`, leftMargin, yPosition, {size: 10});
        } catch (sigError) {
          console.error('Error embedding signature:', sigError);
          drawText('Signature could not be embedded.', leftMargin, yPosition - 20, {size: 10});
          yPosition -= (80 + bodyLineHeight); // Account for placeholder space similar to signature box
        }
      } else {
        console.log('No signature file or filepath, drawing placeholder text.');
        drawText('No signature provided.', leftMargin, yPosition - 20, {size: 10});
        yPosition -= (80 + bodyLineHeight); // Account for placeholder space similar to signature box
      }

      const pdfBytes = await pdfDoc.save();
      console.log('PDF generated, size:', pdfBytes.byteLength, 'bytes.');

      // Save PDF to Spaces
      const safeVeteranName = (veteranName || 'unknown-veteran').toString().replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueSuffix = uuidv4().substring(0, 8);
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      
      const pdfFolder = `contracts/${safeVeteranName}-${uniqueSuffix}`;
      const pdfFilename = `banner-contract-${safeVeteranName}-${month}-${year}.pdf`;
      const pdfKey = `${pdfFolder}/${pdfFilename}`;

      // Save PDF to the contract folder
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: pdfKey,
        Body: Buffer.from(pdfBytes),
        ContentType: 'application/pdf',
        ACL: 'public-read',
      }));

      const contractUrl = `https://${bucketName}.${spacesRegion}.digitaloceanspaces.com/${pdfKey}`;

      // Copy all uploaded photos to the contract folder
      const copiedPhotos = [];
      if (parsedPhotosMeta && parsedPhotosMeta.length > 0) {
        console.log(`Copying ${parsedPhotosMeta.length} photos to contract folder: ${pdfFolder}`);
        
        for (let i = 0; i < parsedPhotosMeta.length; i++) {
          const photoMeta = parsedPhotosMeta[i];
          if (photoMeta.publicUrl && photoMeta.filename) {
            try {
              console.log(`Copying photo ${i+1}: ${photoMeta.filename}`);
              
              // Fetch the original photo
              const photoResponse = await fetch(photoMeta.publicUrl);
              if (!photoResponse.ok) {
                console.error(`Failed to fetch photo for copying: ${photoMeta.publicUrl}`);
                continue;
              }
              
              const photoBuffer = await photoResponse.arrayBuffer();
              
              // Create safe filename and copy to contract folder
              const safePhotoFilename = photoMeta.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
              const photoKey = `${pdfFolder}/photo-${i+1}-${safePhotoFilename}`;
              
              await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: photoKey,
                Body: Buffer.from(photoBuffer),
                ContentType: photoMeta.contentType || 'image/jpeg',
                ACL: 'public-read',
              }));
              
              const copiedPhotoUrl = `https://${bucketName}.${spacesRegion}.digitaloceanspaces.com/${photoKey}`;
              copiedPhotos.push({
                originalUrl: photoMeta.publicUrl,
                copiedUrl: copiedPhotoUrl,
                filename: safePhotoFilename,
                contentType: photoMeta.contentType
              });
              
              console.log(`Successfully copied photo to: ${photoKey}`);
              
            } catch (copyError) {
              console.error(`Failed to copy photo ${photoMeta.filename}:`, copyError);
              // Continue with other photos even if one fails
            }
          }
        }
        
        console.log(`Successfully copied ${copiedPhotos.length} out of ${parsedPhotosMeta.length} photos to contract folder`);
      }

      // --- BEGIN EMAIL SENDING LOGIC ---
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        const pdfAttachment = {
          filename: pdfFilename,
          content: Buffer.from(pdfBytes), // Convert Uint8Array to Buffer
        };

        // Check if this is a test submission
        const TEST_EMAIL_ADDRESSES = process.env.TEST_EMAIL_ADDRESSES;
        const testEmails = TEST_EMAIL_ADDRESSES ? 
          TEST_EMAIL_ADDRESSES.split(',').map(email => email.trim().toLowerCase()).filter(email => email) : 
          [];
        const isTestSubmission = testEmails.includes((sponsorEmail || '').toString().toLowerCase());
        
        const SKIP_TOWN_FOR_TEST_SUBMISSIONS = String(process.env.SKIP_TOWN_FOR_TEST_SUBMISSIONS || 'false').toLowerCase() === 'true';
        if (isTestSubmission) {
          console.log('Test submission detected');
        }

        // Create the submission email content with a simple template and CTA buttons
        const ACTION_LINK_SECRET = process.env.ACTION_LINK_SECRET;
        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

        const buildSubmissionEmailHtml = (actorForThisEmail, recipientEmail) => {
          const payload = {
            actor: actorForThisEmail,
            veteranName: veteranName || 'N/A',
            sponsorName: sponsorName || 'Applicant',
            sponsorEmail: sponsorEmail || '',
            contractUrl,
            recipientEmail: recipientEmail || '',
          };
          const approveLink = ACTION_LINK_SECRET ? createActionLink(baseUrl, 'approve', actorForThisEmail, payload, ACTION_LINK_SECRET) : '#';
          const issueLink = ACTION_LINK_SECRET ? createActionLink(baseUrl, 'issue', actorForThisEmail, payload, ACTION_LINK_SECRET) : '#';

          const photosList = copiedPhotos.length > 0 ? `
            <ul style="padding-left: 16px; margin: 8px 0 0 0;">
              ${copiedPhotos.map((photo, index) => `
                <li style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Photo ${index + 1}:</strong> <a href="${photo.copiedUrl}" style="color:#93c5fd; text-decoration:none;">${photo.filename}</a></li>
              `).join('')}
            </ul>
          ` : '<p style="margin: 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Photos:</strong> No photos submitted</p>';

          return `
            <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background:#0b1220; padding:24px 16px;">
              <div style="max-width: 680px; margin: 0 auto; background:#111827; border:1px solid #1f2937; border-radius:12px; color:#e5e7eb;">
                <div style="padding: 16px 20px; border-bottom:1px solid #1f2937;">
                  <h2 style="margin: 0; font-size: 18px; line-height:24px; color:#f3f4f6;">New Hometown Hero Banner Submission</h2>
                </div>
                <div style="padding: 20px;">
                  <div style="background:#0b1220; border:1px solid #1f2937; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color:#d1d5db;">Quick Actions</p>
                    <div>
                      <a href="${approveLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px; font-weight: 600; margin-right: 8px;">Approve & Notify Applicant</a>
                      <a href="${issueLink}" style="display: inline-block; background: #374151; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px; font-weight: 600; border:1px solid #4b5563;">Needs Attention</a>
                    </div>
                  </div>

                  <h3 style="margin: 12px 0 8px 0; font-size: 14px; color:#d1d5db; text-transform:uppercase; letter-spacing:.02em;">Applicant Information</h3>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Name:</strong> ${sponsorName || 'N/A'}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Email:</strong> ${sponsorEmail || 'N/A'}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Relationship to Veteran:</strong> ${relationshipToVeteran || 'N/A'}</p>

                  <h3 style="margin: 16px 0 8px 0; font-size: 14px; color:#d1d5db; text-transform:uppercase; letter-spacing:.02em;">Veteran Information</h3>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Name:</strong> ${veteranName || 'N/A'}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Berkeley Heights Address:</strong> ${veteranAddress || 'N/A'}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Years in Berkeley Heights:</strong> ${veteranYearsInBH || 'N/A'}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Service Branch:</strong> ${serviceBranch || 'N/A'}${isReserve === 'true' ? ' (Reserve)' : ''}</p>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Conflict/Service Period:</strong> ${servicePeriodOrConflict || 'N/A'}</p>

                  <h3 style="margin: 16px 0 8px 0; font-size: 14px; color:#d1d5db; text-transform:uppercase; letter-spacing:.02em;">Attachments & Links</h3>
                  <p style="margin: 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Contract URL:</strong> <a href="${contractUrl}" style="color:#93c5fd; text-decoration:none;">${contractUrl}</a></p>
                  <p style="margin: 4px 0; color:#9ca3af;">The contract PDF is attached to this email.</p>
                  <div style="margin-top: 8px;">
                    <p style="margin: 0 0 4px 0; color:#9ca3af;"><strong style="color:#e5e7eb;">Submitted Photos (copied to contract folder):</strong></p>
                    ${photosList}
                  </div>

                  <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Submitted on ${new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          `;
        };

        // 1. Send Admin Notification Email
        const ADMIN_EMAIL_RECIPIENTS = process.env.ADMIN_EMAIL_RECIPIENTS;
        if (ADMIN_EMAIL_RECIPIENTS) {
          const adminEmails = ADMIN_EMAIL_RECIPIENTS.split(',').map(email => email.trim()).filter(email => email);
          if (adminEmails.length > 0) {
            try {
              for (const adminEmail of adminEmails) {
                await resend.emails.send({
                  from: 'Hometown Heroes BH <noreply@banners.bhmemorialpark.com>',
                  to: [adminEmail],
                  subject: `New Hometown Hero Banner Submission: ${veteranName || 'N/A'}`,
                  html: buildSubmissionEmailHtml('admin', adminEmail),
                  attachments: [pdfAttachment],
                });
              }
              console.log('Admin notification email sent successfully to:', adminEmails.join(', '));
            } catch (emailError) {
              console.error('Failed to send admin notification email:', emailError);
            }
          } else {
            console.warn('ADMIN_EMAIL_RECIPIENTS was set but contained no valid email addresses after trimming.');
          }
        } else {
          console.warn('ADMIN_EMAIL_RECIPIENTS environment variable not set. Admin email not sent.');
        }

        // 2. Send Town Clerk Notification Email (skip for test submissions)
        const TOWN_EMAIL_RECIPIENTS = process.env.TOWN_EMAIL_RECIPIENTS;
        const skipTown = isTestSubmission && SKIP_TOWN_FOR_TEST_SUBMISSIONS;
        if (TOWN_EMAIL_RECIPIENTS && !skipTown) {
          const townEmails = TOWN_EMAIL_RECIPIENTS.split(',').map(email => email.trim()).filter(email => email);
          if (townEmails.length > 0) {
            try {
              for (const townEmail of townEmails) {
                await resend.emails.send({
                  from: 'Hometown Heroes BH <noreply@banners.bhmemorialpark.com>',
                  to: [townEmail],
                  subject: `New Hometown Hero Banner Submission: ${veteranName || 'N/A'}`,
                  html: buildSubmissionEmailHtml('town', townEmail),
                  attachments: [pdfAttachment],
                });
              }
              console.log('Town notification email sent successfully to:', townEmails.join(', '));
            } catch (emailError) {
              console.error('Failed to send town notification email:', emailError);
            }
          } else {
            console.warn('TOWN_EMAIL_RECIPIENTS was set but contained no valid email addresses after trimming.');
          }
        } else if (TOWN_EMAIL_RECIPIENTS && skipTown) {
          console.log('Skipping town email notification due to SKIP_TOWN_FOR_TEST_SUBMISSIONS=true and test submission');
        } else {
          console.warn('TOWN_EMAIL_RECIPIENTS environment variable not set. Town email not sent.');
        }

        // 3. Send User (Sponsor) Confirmation Email
        if (sponsorEmail) {
          try {
            await resend.emails.send({
              from: 'Hometown Heroes BH <noreply@banners.bhmemorialpark.com>',
              to: [sponsorEmail.toString()],
              subject: `Your Hometown Hero Banner Submission for ${veteranName || 'N/A'} Received`,
              html: `
                <p>Dear ${sponsorName || 'Applicant'},</p>
                <p>Thank you for submitting a Hometown Hero banner application for <strong>${veteranName || 'the veteran'}</strong>.</p>
                <p>Your submission (attached) is now under review. You will receive another email if your banner is approved, or a member of the Berkeley Heights Veterans Affairs Committee may contact you if further information is required.</p>
                <p>Application Details:</p>
                <ul>
                  <li><strong>Veteran Name:</strong> ${veteranName || 'N/A'}</li>
                  <li><strong>Berkeley Heights Address:</strong> ${veteranAddress || 'N/A'}</li>
                  <li><strong>Years in Berkeley Heights:</strong> ${veteranYearsInBH || 'N/A'}</li>
                  <li><strong>Service Branch:</strong> ${serviceBranch || 'N/A'}${isReserve === 'true' ? ' (Reserve)' : ''}</li>
                  <li><strong>Conflict/Service Period:</strong> ${servicePeriodOrConflict || 'N/A'}</li>
                </ul>
                <p>For your records, a copy of the submission contract is attached to this email. You can also access it here: <a href="${contractUrl}">${contractUrl}</a></p>
                <p>Sincerely,</p>
                <p>The Berkeley Heights Hometown Heroes Program</p>
              `,
              attachments: [pdfAttachment],
            });
            console.log('User confirmation email sent successfully to:', sponsorEmail);
          } catch (emailError) {
            console.error('Failed to send user confirmation email:', emailError);
          }
        } else {
          console.warn('Sponsor email not provided. User confirmation email not sent.');
        }
      } else {
        console.warn('RESEND_API_KEY not set. Emails not sent.');
      }

      // Clean up temporary uploaded files by formidable
      if (signatureFile && signatureFile.filepath) {
        console.log(`Attempting to delete temporary signature file: ${signatureFile.filepath}`);
        await fs.unlink(signatureFile.filepath).catch(e => console.error("Error deleting temp signature file:", e));
        console.log(`Successfully deleted temporary signature file: ${signatureFile.filepath}`);
      }
      // Note: formidable doesn't directly expose 'photo' files in `files` if they aren't explicitly named in form.
      // If 'photos[]' were being sent as actual files to this endpoint, they'd also need cleanup.
      // However, the current plan is to send photo *metadata* and fetch them from existing uploads for the PDF.

      res.status(200).json({
        message: 'Submission processed and contract generated.',
        contractUrl,
        contractFolder: pdfFolder,
        copiedPhotos: copiedPhotos,
        totalPhotos: parsedPhotosMeta ? parsedPhotosMeta.length : 0,
        photosCopied: copiedPhotos.length
      });

    } catch (e) {
      console.error('Error processing submission:', e);
      // Clean up temp files in case of error too
      if (files.signatureImage?.[0]?.filepath) {
        console.log(`Attempting to delete temporary signature file on error: ${files.signatureImage[0].filepath}`);
        await fs.unlink(files.signatureImage[0].filepath).catch(err => console.error("Error deleting temp signature file on error:", err));
        console.log(`Successfully deleted temporary signature file on error: ${files.signatureImage[0].filepath}`);
      }
      res.status(500).json({ error: 'Failed to process submission.', details: e.message });
    }
    });
});

// SPA fallback – always return index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 