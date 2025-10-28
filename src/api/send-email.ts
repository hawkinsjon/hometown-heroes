interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export async function sendEmail(request: EmailRequest) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to send email');
    }
    return data;
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { error: error.message || 'Unexpected error' };
  }
} 