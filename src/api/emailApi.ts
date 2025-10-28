interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

interface EmailResponse {
  id?: string;
  message?: string;
  error?: string;
}

// Replace this with your DigitalOcean Function URL when deployed
// It will look something like: https://faas-nyc1-xxxxx.doserverless.co/api/v1/web/fn-xxxxx/email-service/send
const FUNCTION_URL = import.meta.env.VITE_EMAIL_FUNCTION_URL || '';

/**
 * Send an email using the serverless function
 * 
 * @param params Email parameters
 * @returns Response from the email service
 */
export async function sendEmail(params: EmailParams): Promise<EmailResponse> {
  try {
    if (!FUNCTION_URL) {
      throw new Error('Email function URL not configured. Set VITE_EMAIL_FUNCTION_URL in your environment.');
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.body?.message || 'Failed to send email');
    }
    
    return data.body || {};
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { 
      error: error.message || 'An unexpected error occurred'
    };
  }
} 