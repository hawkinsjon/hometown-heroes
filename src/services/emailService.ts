import { FormDataType } from '../hooks/useFormState';
import { sendEmail as resendEmail } from '../api/send-email';

// Real implementation that uses the Resend API
export const sendConfirmationEmail = async (formData: FormDataType, submissionId: string): Promise<void> => {
  try {
    console.log(`Sending confirmation email to ${formData.sponsorEmail} for submission ${submissionId}`);
    
    // Format email content
    const subject = `Banner Application Confirmation - ${submissionId}`;
    const text = `
      Thank you for your Hometown Heroes Banner Application!
      
      Your submission (ID: ${submissionId}) for ${formData.veteranName} has been received.
      
      Please verify your email by clicking the link below:
      https://berkeleyheights-veterans.org/verify?token=${submissionId}&email=${encodeURIComponent(formData.sponsorEmail)}
      
      Your submission will not be complete until you verify your email.
      
      Thank you for honoring our veterans!
      Berkeley Heights Veterans Committee
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #003366;">Thank You for Your Banner Application!</h2>
        <p>Your submission (ID: <strong>${submissionId}</strong>) for <strong>${formData.veteranName}</strong> has been received.</p>
        
        <div style="background-color: #f0f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Important:</strong> Please verify your email by clicking the button below:</p>
          <a href="https://berkeleyheights-veterans.org/verify?token=${submissionId}&email=${encodeURIComponent(formData.sponsorEmail)}" 
             style="display: inline-block; background-color: #003366; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">
            Verify My Email
          </a>
        </div>
        
        <p>Your submission will not be complete until you verify your email.</p>
        <p>Thank you for honoring our veterans!</p>
        <p><em>Berkeley Heights Veterans Committee</em></p>
      </div>
    `;
    
    // Use the Resend API directly
    await resendEmail({
      to: formData.sponsorEmail,
      subject,
      text,
      html,
      from: 'Hometown Heroes <noreply@berkeleyheights-veterans.org>'
    });
    
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
};