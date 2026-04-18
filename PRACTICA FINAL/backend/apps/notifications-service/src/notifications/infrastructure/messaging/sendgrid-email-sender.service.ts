import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

import { IEmailSender, SendEmailOptions } from '../../application/interfaces/email-sender.interface';

@Injectable()
export class SendgridEmailSenderService implements IEmailSender, OnModuleInit {
  private readonly logger    = new Logger(SendgridEmailSenderService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') ?? '';
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set — emails will not be sent');
      return;
    }
    sgMail.setApiKey(apiKey);
    this.logger.log('SendGrid initialized');
  }

  async send(options: SendEmailOptions): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn(`Skipping email to ${options.to} — SENDGRID_API_KEY not configured`);
      return;
    }

    await sgMail.send({
      to:      options.to,
      from:    this.fromEmail,
      subject: options.subject,
      html:    options.html,
    });

    this.logger.debug(`Email sent → ${options.to} | subject: ${options.subject}`);
  }
}
