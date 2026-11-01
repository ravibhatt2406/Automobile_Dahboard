import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let usersService: any;
  let jwtService: any;
  let configService: any;
  let auditService: any;
  let notificationsService: any;

  const validPassword = 'SecurePassword123!';
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-usr' }),
        update: jest.fn().mockResolvedValue({ id: 'updated-usr' }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 'updated-cust' }),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({ id: 'notif-1', metadata: { used: false } }),
        update: jest.fn().mockResolvedValue({ id: 'updated-notif' }),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      signAsync: jest.fn().mockResolvedValue('mock-async-jwt-token'),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_jwt_access_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_jwt_refresh_secret';
        if (key === 'GOOGLE_CLIENT_ID') return 'mock-google-client-id';
        return null;
      }),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1', status: 'SENT' }),
      isEmailConfigured: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'usr-active-1',
        email: 'customer@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: { id: 'cust-1', status: 'ACTIVE' },
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.login({
        emailOrPhone: 'customer@titanauto.com',
        password: validPassword,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should reject login with wrong password', async () => {
      const mockUser = {
        id: 'usr-active-1',
        email: 'customer@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'customer@titanauto.com',
          password: 'WrongPassword999!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for customer pending activation', async () => {
      const mockUser = {
        id: 'usr-pending-1',
        email: 'pending.cust@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'PENDING',
        customerProfile: { id: 'cust-pending', status: 'ACTIVE' },
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'pending.cust@titanauto.com',
          password: validPassword,
        }),
      ).rejects.toThrow('Your customer account is pending activation');
    });

    it('should reject login for employee pending activation', async () => {
      const mockUser = {
        id: 'usr-emp-pending',
        email: 'new.emp@titanauto.com',
        passwordHash: '$2b$10$somestring_unactivated_emp_12345',
        accountType: 'EMPLOYEE',
        status: 'PENDING',
        employeeProfile: { id: 'emp-1', status: 'PENDING_APPROVAL' },
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'new.emp@titanauto.com',
          password: validPassword,
        }),
      ).rejects.toThrow('Your employee account is pending activation');
    });

    it('should reject login for activated employee pending manager approval', async () => {
      const mockUser = {
        id: 'usr-emp-approval',
        email: 'waiting.approval@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
        employeeProfile: { id: 'emp-1', status: 'PENDING_APPROVAL' },
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'waiting.approval@titanauto.com',
          password: validPassword,
        }),
      ).rejects.toThrow('Account is pending manager approval');
    });

    it('should reject login for account with missing or unusable password hash', async () => {
      const mockUser = {
        id: 'usr-no-hash',
        email: 'nohash@titanauto.com',
        passwordHash: null,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'nohash@titanauto.com',
          password: 'SomePassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should inform Google-registered user without established password to use Google Sign-In or password reset', async () => {
      const mockUser = {
        id: 'usr-google-1',
        email: 'google.user@titanauto.com',
        googleId: '117662691915476234210',
        passwordHash: await bcrypt.hash('random_google_sec_123', 10),
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          emailOrPhone: 'google.user@titanauto.com',
          password: 'GuessedPassword123!',
        }),
      ).rejects.toThrow('This account was registered with Google Sign-In and does not have a separate password set');
    });

    it('should normalize mixed-case and padded email on login lookup', async () => {
      const mockUser = {
        id: 'usr-active-1',
        email: 'customer@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.login({
        emailOrPhone: '  CUSTOMER@TitanAuto.com  ',
        password: validPassword,
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith('CUSTOMER@TitanAuto.com');
      expect(result).toHaveProperty('accessToken');
    });

    it('should reject employee login when accessing via customer portal', async () => {
      const mockEmployee = {
        id: 'usr-emp-1',
        email: 'sales@titanauto.com',
        passwordHash: validPasswordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      };
      const mockEmpProfile = {
        id: 'usr-emp-1',
        email: 'sales@titanauto.com',
        accountType: 'EMPLOYEE',
        roles: ['SALES_EMPLOYEE'],
        employeeProfile: { id: 'emp-1' },
        customerProfile: null,
      };

      usersService.findByEmail.mockResolvedValue(mockEmployee);
      usersService.findById.mockResolvedValue(mockEmpProfile);

      await expect(
        service.login({
          emailOrPhone: 'sales@titanauto.com',
          password: validPassword,
          portal: 'customer',
        }),
      ).rejects.toThrow('This account belongs to dealership organization staff');
    });

    it('should reject customer login when accessing via organization portal', async () => {
      const mockCustomer = {
        id: 'usr-cust-1',
        email: 'fleet@customer.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };
      const mockCustProfile = {
        id: 'usr-cust-1',
        email: 'fleet@customer.com',
        accountType: 'CUSTOMER',
        roles: ['CUSTOMER'],
        employeeProfile: null,
        customerProfile: { id: 'cust-1' },
      };

      usersService.findByEmail.mockResolvedValue(mockCustomer);
      usersService.findById.mockResolvedValue(mockCustProfile);

      await expect(
        service.login({
          emailOrPhone: 'fleet@customer.com',
          password: validPassword,
          portal: 'organization',
        }),
      ).rejects.toThrow('This account is registered for customer access');
    });

    it('should allow customer login when accessing via customer portal', async () => {
      const mockCustomer = {
        id: 'usr-cust-1',
        email: 'fleet@customer.com',
        passwordHash: validPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };
      const mockCustProfile = {
        id: 'usr-cust-1',
        email: 'fleet@customer.com',
        accountType: 'CUSTOMER',
        roles: ['CUSTOMER'],
        employeeProfile: null,
        customerProfile: { id: 'cust-1' },
      };

      usersService.findByEmail.mockResolvedValue(mockCustomer);
      usersService.findById.mockResolvedValue(mockCustProfile);

      const result = await service.login({
        emailOrPhone: 'fleet@customer.com',
        password: validPassword,
        portal: 'customer',
      });

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('registerCustomer (Duplicate Account Prevention)', () => {
    it('should reject duplicate registration if email already registered and active', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-existing',
        email: 'existing@titanauto.com',
        status: 'ACTIVE',
      });

      await expect(
        service.registerCustomer({
          name: 'Jane Doe',
          email: 'existing@titanauto.com',
          phone: '+919876543210',
          password: 'Password123!',
          termsAccepted: true,
        }),
      ).rejects.toThrow('An account with this email address already exists. Please log in.');
    });

    it('should guide customer to activation if account exists and is pending activation', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-existing-pending',
        email: 'pending@titanauto.com',
        status: 'PENDING',
      });

      await expect(
        service.registerCustomer({
          name: 'Jane Doe',
          email: 'pending@titanauto.com',
          phone: '+919876543210',
          password: 'Password123!',
          termsAccepted: true,
        }),
      ).rejects.toThrow('An account with this email address is pending activation');
    });

    it('should guide user to Google Sign-In or password recovery if email was registered via Google', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-google-exist',
        email: 'google.exist@titanauto.com',
        googleId: '1234567890',
        status: 'ACTIVE',
      });

      await expect(
        service.registerCustomer({
          name: 'Google User',
          email: 'google.exist@titanauto.com',
          phone: '+919876543210',
          password: 'Password123!',
          termsAccepted: true,
        }),
      ).rejects.toThrow('An account with this email address already exists via Google Sign-In');
    });
  });

  describe('activateCustomer (Customer account activation & single-use tokens)', () => {
    it('should activate customer, set secure bcrypt password hash, and prevent token reuse', async () => {
      const token = 'valid-customer-activation-token';
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'cust-uuid-1',
        email: 'newcustomer@titanauto.com',
        phone: '+919988776655',
        type: 'CUSTOMER_ACTIVATION',
      });

      const tokenHash = service.hashSecret(token);
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-cust-act-1',
        metadata: {
          tokenHash,
          used: false,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      prisma.customer.findUnique.mockResolvedValue({
        id: 'cust-uuid-1',
        name: 'New Customer',
        email: 'newcustomer@titanauto.com',
        phone: '+919988776655',
        status: 'ACTIVE',
        userId: null,
      });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'usr-created-cust-1',
        email: 'newcustomer@titanauto.com',
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      });
      prisma.customer.update.mockResolvedValue({
        id: 'cust-uuid-1',
        userId: 'usr-created-cust-1',
      });
      usersService.findById.mockResolvedValue({
        id: 'usr-created-cust-1',
        email: 'newcustomer@titanauto.com',
        accountType: 'CUSTOMER',
      });

      const result = await service.activateCustomer({
        token,
        password: 'SecurePassword123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.message).toContain('Customer account activated successfully');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newcustomer@titanauto.com',
            status: 'ACTIVE',
          }),
        }),
      );
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-cust-act-1' },
          data: expect.objectContaining({
            metadata: expect.objectContaining({ used: true }),
          }),
        }),
      );
    });

    it('should reject already used customer activation token', async () => {
      const token = 'used-token';
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'cust-uuid-1',
        type: 'CUSTOMER_ACTIVATION',
      });

      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-used',
        metadata: { used: true },
      });

      await expect(
        service.activateCustomer({
          token,
          password: 'SecurePassword123!',
        }),
      ).rejects.toThrow('This activation invitation has already been used');
    });
  });

  describe('activateEmployee (Single-use token & self-password)', () => {
    it('should activate employee and enforce single-use tokens', async () => {
      const token = 'valid-emp-token';
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'emp-1',
        userId: 'usr-emp-1',
        type: 'EMPLOYEE_ACTIVATION',
      });

      const tokenHash = service.hashSecret(token);
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-emp-1',
        metadata: {
          tokenHash,
          used: false,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      const mockEmployeeUser = {
        id: 'usr-emp-1',
        email: 'emp1@titanauto.com',
        accountType: 'EMPLOYEE',
        status: 'PENDING',
        employeeProfile: { id: 'emp-1' },
      };
      prisma.user.findUnique.mockResolvedValue(mockEmployeeUser);
      usersService.findById.mockResolvedValue(mockEmployeeUser);

      const result = await service.activateEmployee({
        token,
        password: 'NewStrongPassword123!',
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr-emp-1' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-emp-1' },
          data: expect.objectContaining({
            status: 'READ',
            metadata: expect.objectContaining({ used: true }),
          }),
        }),
      );
    });

    it('should reject reused employee activation token', async () => {
      const token = 'already-used-token';
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'emp-1',
        userId: 'usr-emp-1',
        type: 'EMPLOYEE_ACTIVATION',
      });

      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-emp-1',
        metadata: {
          used: true,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      await expect(
        service.activateEmployee({
          token,
          password: 'NewStrongPassword123!',
        }),
      ).rejects.toThrow('This activation token has already been used');
    });

    it('should reject employee activation with weak password', async () => {
      await expect(
        service.activateEmployee({
          token: 'some-token',
          password: 'weak',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should return non-enumerating response when requesting password reset', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({
        emailOrPhone: 'nonexistent@titanauto.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
    });

    it('should successfully reset password with valid token and prevent token reuse', async () => {
      const token = 'valid-reset-token';
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'usr-1',
        type: 'PASSWORD_RESET',
      });

      const tokenHash = service.hashSecret(token);
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-reset-1',
        metadata: {
          tokenHash,
          used: false,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      prisma.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'user1@titanauto.com',
      });

      const result = await service.resetPassword({
        token,
        password: 'BrandNewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr-1' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-reset-1' },
          data: expect.objectContaining({
            metadata: expect.objectContaining({ used: true }),
          }),
        }),
      );
    });

    it('should allow login with new password after successful password reset', async () => {
      const newPassword = 'NewSecretPassword123!';
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      const mockUpdatedUser = {
        id: 'usr-1',
        email: 'user1@titanauto.com',
        passwordHash: newPasswordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      };

      usersService.findByEmail.mockResolvedValue(mockUpdatedUser);
      usersService.findById.mockResolvedValue(mockUpdatedUser);

      const loginResult = await service.login({
        emailOrPhone: 'user1@titanauto.com',
        password: newPassword,
      });

      expect(loginResult).toHaveProperty('accessToken');
      expect(loginResult).toHaveProperty('refreshToken');
    });

    it('should enforce 60-second rate-limiting cooldown on forgotPassword requests', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'usr-1',
        email: 'user1@titanauto.com',
      });

      prisma.notification.findFirst.mockResolvedValueOnce({
        id: 'notif-recent',
        createdAt: new Date(),
      });

      await expect(
        service.forgotPassword({ emailOrPhone: 'user1@titanauto.com' }),
      ).rejects.toThrow('Please wait 60 seconds before requesting another code');
    });

    it('should throw ServiceUnavailableException if email provider fails to send OTP', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'usr-1',
        email: 'user1@titanauto.com',
      });

      prisma.notification.findFirst.mockResolvedValueOnce(null); // No recent rate-limit
      notificationsService.send.mockRejectedValueOnce(new Error('SMTP connection refused'));

      await expect(
        service.forgotPassword({ emailOrPhone: 'user1@titanauto.com' }),
      ).rejects.toThrow('Unable to deliver verification code through the email provider');
    });

    it('should reject reset when incorrect OTP is provided and track remaining attempts', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'usr-1',
        email: 'user1@titanauto.com',
      });

      const validOtp = '654321';
      const validOtpHash = service.hashSecret(validOtp);

      prisma.notification.findFirst.mockResolvedValueOnce({
        id: 'notif-otp-1',
        metadata: {
          otpHash: validOtpHash,
          used: false,
          attempts: 0,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      await expect(
        service.resetPassword({
          emailOrPhone: 'user1@titanauto.com',
          otp: '000000',
          password: 'NewStrongPassword123!',
        }),
      ).rejects.toThrow('Invalid password reset verification code. 4 attempt(s) remaining.');
    });

    it('should lock out password reset when OTP attempts reach maximum allowed', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'usr-1',
        email: 'user1@titanauto.com',
      });

      prisma.notification.findFirst.mockResolvedValueOnce({
        id: 'notif-otp-1',
        metadata: {
          otpHash: 'somehash',
          used: false,
          attempts: 5,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        },
      });

      await expect(
        service.resetPassword({
          emailOrPhone: 'user1@titanauto.com',
          otp: '000000',
          password: 'NewStrongPassword123!',
        }),
      ).rejects.toThrow('Too many incorrect verification attempts');
    });
  });

  describe('authenticateGoogle (Issue A root cause handling)', () => {
    it('should refuse automatic account takeover when existing password account exists', async () => {
      jest.spyOn(OAuth2Client.prototype as any, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-sub-12345',
          email: 'existing.password@titanauto.com',
          name: 'Existing Customer',
          email_verified: true,
        }),
      } as any);

      prisma.user.findUnique.mockResolvedValueOnce(null); // No user linked by googleId
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'usr-password-cust',
        email: 'existing.password@titanauto.com',
        googleId: null,
        status: 'ACTIVE',
      }); // Found existing email account

      await expect(
        service.authenticateGoogle({
          credential: 'valid-google-id-token',
        }),
      ).rejects.toThrow(
        'An account with this email address already exists. Please log in using your email and password.',
      );
    });
  });
});
