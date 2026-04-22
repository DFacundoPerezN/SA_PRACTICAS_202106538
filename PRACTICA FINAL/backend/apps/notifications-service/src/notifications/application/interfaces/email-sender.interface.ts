// Abstraction over the email provider (currently SendGrid).
// Use-cases depend only on this interface — never on @sendgrid/mail directly.

export interface SendEmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

export interface IEmailSender {
  send(options: SendEmailOptions): Promise<void>;
}

export const EMAIL_SENDER = Symbol('IEmailSender');
