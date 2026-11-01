import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  accepted: string[];
  rejected: string[];
  provider: 'smtp' | 'mock';
  simulated: boolean;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private providerMode: 'smtp' | 'mock' = 'mock';
  private fromAddress: string = '"Titan Auto" <no-reply@titanauto.com>';

  // In-memory record for testing & safe dev diagnostics (no passwords or OTP secrets)
  public lastDelivery: { to: string; subject: string; timestamp: Date; success: boolean; simulated: boolean } | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initTransporter();
    if (this.providerMode === 'smtp') {
      this.verifyConnection()
        .then((res) => {
          if (res.verified) {
            this.logger.log('SMTP connection & authentication verified successfully with remote host.');
          } else {
            this.logger.warn(`SMTP connection verification warning: ${res.error}`);
          }
        })
        .catch(() => {});
    }
  }

  private initTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST')?.trim();
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER')?.trim();
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    this.fromAddress = this.configService.get<string>('EMAIL_FROM') || '"Titan Auto" <no-reply@titanauto.com>';

    if (emailProvider === 'mock' || nodeEnv === 'test') {
      this.providerMode = 'mock';
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log('EmailService initialized in MOCK mode (test / simulated delivery)');
      return;
    }

    if (smtpHost) {
      const rawPort = this.configService.get('SMTP_PORT');
      const smtpPort = rawPort ? parseInt(String(rawPort), 10) : 587;
      const rawSecure = this.configService.get('SMTP_SECURE');
      const smtpSecure = String(rawSecure) === 'true' || smtpPort === 465;
      const smtpUser = this.configService.get<string>('SMTP_USER')?.trim();
      const smtpPass = this.configService.get<string>('SMTP_PASS')?.trim();

      if (!smtpUser || !smtpPass) {
        this.logger.warn('SMTP_HOST is defined but SMTP_USER or SMTP_PASS is missing. EmailService falling back to mock mode to prevent runtime auth crashes.');
        this.providerMode = 'mock';
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
        return;
      }

      this.providerMode = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
      });

      this.logger.log(`EmailService initialized with verified SMTP host: ${smtpHost}:${smtpPort} (secure: ${smtpSecure})`);
    } else {
      // In development when SMTP is not configured, fall back to mock transporter so requests don't hang
      this.providerMode = 'mock';
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.warn('No SMTP_HOST configured in environment. EmailService operating in simulated mock mode.');
    }
  }

  isConfigured(): boolean {
    return this.providerMode === 'smtp';
  }

  async verifyConnection(): Promise<{ configured: boolean; verified: boolean; error?: string }> {
    if (this.providerMode !== 'smtp' || !this.transporter) {
      return {
        configured: false,
        verified: false,
        error: 'SMTP provider is not configured. EmailService is operating in simulated mock mode.',
      };
    }

    try {
      await this.transporter.verify();
      return { configured: true, verified: true };
    } catch (err: any) {
      const safeErrorMsg = err?.message || 'Failed to authenticate or connect with SMTP server';
      this.logger.error(`SMTP connection verification failed: ${safeErrorMsg}`);
      return {
        configured: true,
        verified: false,
        error: safeErrorMsg,
      };
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    if (!options.to || !options.to.includes('@')) {
      throw new Error(`Invalid destination email address: ${options.to}`);
    }

    if (!this.transporter) {
      this.initTransporter();
    }

    const mailOptions = {
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    };

    const isSimulated = this.providerMode === 'mock';

    try {
      const info = await this.transporter!.sendMail(mailOptions);

      const accepted = Array.isArray(info.accepted) ? info.accepted.map(String) : [options.to];
      const rejected = Array.isArray(info.rejected) ? info.rejected.map(String) : [];

      this.lastDelivery = {
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
        success: accepted.length > 0,
        simulated: isSimulated,
      };

      if (isSimulated) {
        this.logger.warn(`[SIMULATED_MOCK] Real inbox delivery skipped (SMTP_HOST is not configured). Simulated dispatch to: ${options.to}`);
      } else {
        this.logger.log(`[SMTP_DISPATCH] Email successfully accepted by SMTP server for delivery to: ${options.to}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        accepted,
        rejected,
        provider: this.providerMode,
        simulated: isSimulated,
      };
    } catch (err: any) {
      this.lastDelivery = {
        to: options.to,
        subject: options.subject,
        timestamp: new Date(),
        success: false,
        simulated: isSimulated,
      };

      this.logger.error(`Failed to dispatch email to destination address: ${err?.message || err}`);
      throw new Error(`Email delivery failed: ${err?.message || 'SMTP provider error'}`);
    }
  }

  getProviderMode(): string {
    return this.providerMode;
  }
}
