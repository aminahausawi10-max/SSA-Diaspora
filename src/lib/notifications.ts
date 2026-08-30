/**
 * Unified Notification Helper for SSA Diaspora Platform
 * Supports both Email (via Resend API) and SMS (via Twilio API).
 * Falls back to console log simulation if API keys are not provided.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '+1234567890';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@ssa-diaspora.gov.ng';

export const notifications = {
  /**
   * Sends an Email notification
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    console.log(`[Notification System] Simulating Email to <${to}>: "${subject}"`);
    
    if (!RESEND_API_KEY) {
      console.log(`[Notification System] Resend API Key is missing. Email simulated successfully.`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [to],
          subject: subject,
          html: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Notification System] Email sent successfully via Resend. ID: ${data.id}`);
        return true;
      } else {
        console.error(`[Notification System] Resend Error:`, data);
        return false;
      }
    } catch (error) {
      console.error(`[Notification System] Failed to send email via Resend:`, error);
      return false;
    }
  },

  /**
   * Sends an SMS notification
   */
  async sendSMS(to: string, message: string): Promise<boolean> {
    console.log(`[Notification System] Simulating SMS to <${to}>: "${message}"`);

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log(`[Notification System] Twilio credentials missing. SMS simulated successfully.`);
      return true;
    }

    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', TWILIO_FROM_NUMBER);
      params.append('Body', message);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          },
          body: params.toString()
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log(`[Notification System] SMS sent successfully via Twilio. SID: ${data.sid}`);
        return true;
      } else {
        console.error(`[Notification System] Twilio Error:`, data);
        return false;
      }
    } catch (error) {
      console.error(`[Notification System] Failed to send SMS via Twilio:`, error);
      return false;
    }
  },

  // Templates
  async sendWelcomeNotification(email: string, name: string, phone?: string) {
    const subject = 'Welcome to SSA Diaspora Portal';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to SSA Diaspora, ${name}!</h2>
        <p>Your registration has been submitted successfully and is currently <strong>PENDING VERIFICATION</strong>.</p>
        <p>Our Verification Officers are reviewing your passport and NIN details. You will receive an email as soon as your Diaspora ID is generated.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #666;">This is an official communication from the SSA Diaspora Office, Abuja, Nigeria.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
    if (phone) {
      await this.sendSMS(phone, `Hello ${name}, your SSA Diaspora account registration is successful. Status: PENDING VERIFICATION.`);
    }
  },

  async sendApprovalNotification(email: string, name: string, diasporaId: string, phone?: string) {
    const subject = 'SSA Diaspora Account Approved - ID Generated';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Congratulations ${name}!</h2>
        <p>Your SSA Diaspora account has been verified and approved.</p>
        <p>Your Unique Diaspora ID Number: <strong>${diasporaId}</strong></p>
        <p>You can now sign in to your Portal to view, download, or print your Virtual ID Card.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #666;">This is an official communication from the SSA Diaspora Office, Abuja, Nigeria.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
    if (phone) {
      await this.sendSMS(phone, `Hello ${name}, your SSA Diaspora account is approved! ID: ${diasporaId}. Login to download your Virtual ID card.`);
    }
  },

  async sendCaseUpdateNotification(email: string, name: string, caseNumber: string, status: string, notes: string, phone?: string) {
    const subject = `Case Status Update: ${caseNumber}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Case Progress Update</h2>
        <p>Dear ${name}, the status of your reported case (<strong>${caseNumber}</strong>) has been updated.</p>
        <p>New Status: <strong style="text-transform: uppercase; color: #3b82f6;">${status}</strong></p>
        <p><strong>Update Notes:</strong> ${notes}</p>
        <p>Log in to your member portal to view full case logs.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #666;">This is an official communication from the SSA Diaspora Office, Abuja, Nigeria.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
    if (phone) {
      await this.sendSMS(phone, `SSA Case Update: ${caseNumber} is now ${status}. Details: ${notes.slice(0, 50)}...`);
    }
  }
};
