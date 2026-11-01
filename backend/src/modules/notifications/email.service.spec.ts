import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'EMAIL_PROVIDER') return 'mock';
        if (key === 'EMAIL_FROM') return '"Titan Auto Test" <test@titanauto.com>';
        return null;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    service.onModuleInit();
  });

  it('should initialize in mock mode when configured for testing', () => {
    expect(service.getProviderMode()).toBe('mock');
    expect(service.isConfigured()).toBe(false);
  });

  it('should report verifyConnection as unconfigured in mock mode without throwing', async () => {
    const status = await service.verifyConnection();
    expect(status.configured).toBe(false);
    expect(status.verified).toBe(false);
    expect(status.error).toContain('SMTP provider is not configured');
  });

  it('should successfully dispatch simulated email and mark outcome as simulated (never claiming real external delivery)', async () => {
    const result = await service.sendEmail({
      to: 'customer@titanauto.com',
      subject: 'Password Reset',
      text: 'Your verification code is 123456',
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.provider).toBe('mock');
    expect(result.accepted).toContain('customer@titanauto.com');
    expect(service.lastDelivery).toEqual(
      expect.objectContaining({
        to: 'customer@titanauto.com',
        subject: 'Password Reset',
        success: true,
        simulated: true,
      }),
    );
  });

  it('should fall back safely to mock transport if SMTP_HOST is provided without credentials', async () => {
    const customConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'SMTP_HOST') return 'smtp.sendgrid.net';
        if (key === 'SMTP_USER') return '';
        if (key === 'SMTP_PASS') return '';
        return null;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: customConfig },
      ],
    }).compile();

    const devService = module.get<EmailService>(EmailService);
    devService.onModuleInit();

    expect(devService.getProviderMode()).toBe('mock');
    expect(devService.isConfigured()).toBe(false);
  });

  it('should reject invalid recipient email without @', async () => {
    await expect(
      service.sendEmail({
        to: 'invalid-email-address',
        subject: 'Test',
        text: 'Hello',
      }),
    ).rejects.toThrow('Invalid destination email address');
  });
});
