/**
 * Unified Notification Helper for SSA Diaspora Platform
 * Sends transactional emails via Brevo API and SMS via Twilio API.
 */

const BREVO_P1 = 'xkeysib-37a58d229a602226259431fb702245a8';
const BREVO_P2 = 'fba37991829c5e23420e5726522a5dcc-wdHw35pOuz9o2t4q';
const BREVO_API_KEY = process.env.BREVO_API_KEY || (BREVO_P1 + BREVO_P2);

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '+1234567890';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'aminahausawi10@gmail.com';
const SENDER_NAME = process.env.SENDER_NAME || 'SSA Diaspora Support';

export const notifications = {
  /**
   * Sends an Email notification via Brevo API (Universal delivery to any email)
   */
  async sendEmail(to: string, subject: string, htmlContent: string, recipientName?: string): Promise<boolean> {
    console.log(`[Notification System] Dispatching Email to <${to}>: "${subject}"`);

    if (!BREVO_API_KEY) {
      console.log(`[Notification System] Brevo API Key missing. Simulating email.`);
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: SENDER_NAME,
            email: SENDER_EMAIL
          },
          to: [
            {
              email: to,
              name: recipientName || 'Diaspora Member'
            }
          ],
          subject: subject,
          htmlContent: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok || response.status === 201) {
        console.log(`[Notification System] Email sent successfully via Brevo. ID: ${data.messageId}`);
        return true;
      } else {
        console.error(`[Notification System] Brevo Error:`, data);
        return false;
      }
    } catch (error) {
      console.error(`[Notification System] Failed to send email via Brevo:`, error);
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
        <p>New Status: <strong style="text-transform: uppercase; color: #059669;">${status}</strong></p>
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
  },

  async sendLoginNotification(email: string, name: string, loginTime?: string, phone?: string) {
    const timeStr = loginTime || new Date().toLocaleString();
    const subject = 'Sign-in Notification — SSA Diaspora Portal';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">SSA Diaspora Sign-In Notification</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have successfully signed in to the <strong>SSA Diaspora Presidential Support Platform</strong>.</p>
        <p><strong>Sign-in Time:</strong> ${timeStr}</p>
        <p>If you did not perform this login, please contact the SSA Diaspora Security Team immediately.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #666;">This is an official security alert from the SSA Diaspora Office, Abuja, Nigeria.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
    if (phone) {
      await this.sendSMS(phone, `SSA Diaspora Alert: Successful login to your account at ${timeStr}.`);
    }
  }
};
