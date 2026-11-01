import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ActivateCustomerDto } from './dto/activate-customer.dto';
import { ActivateEmployeeDto } from './dto/activate-employee.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  async registerCustomer(dto: RegisterCustomerDto, ipAddress?: string, userAgent?: string) {
    if (!dto.termsAccepted) {
      throw new BadRequestException('You must accept the terms of service and privacy policy to register');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedPhone = dto.phone.trim();

    // 1. Enforce unique email address across User records
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { customerProfile: { email: { equals: normalizedEmail, mode: 'insensitive' } } },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.status === 'PENDING') {
        throw new ConflictException(
          'An account with this email address is pending activation. Please activate your account to set your password.',
        );
      }
      if (existingUser.googleId) {
        throw new ConflictException(
          'An account with this email address already exists via Google Sign-In. Please sign in with Google or use Forgot Password to establish a password.',
        );
      }
      throw new ConflictException('An account with this email address already exists. Please log in.');
    }

    // 2. Enforce unique phone number
    const digits = normalizedPhone.replace(/\D/g, '');
    const phoneList = [normalizedPhone];
    if (digits.length >= 7) {
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
      phoneList.push(digits, `+${digits}`, `+91${last10}`, last10);
    }

    const existingPhone = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: { in: phoneList } },
          { customerProfile: { phone: { in: phoneList } } },
        ],
      },
    });

    if (existingPhone) {
      throw new ConflictException('An account with this phone number already exists. Please log in.');
    }

    // 3. Check for existing unlinked customer profile (e.g. from offline branch sales or bookings)
    // Never link accounts using unverified name or email match alone; require matching phone and email
    const phoneDigits = normalizedPhone.replace(/\D/g, '').slice(-10);
    const unlinkedCandidates = await this.prisma.customer.findMany({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        userId: null,
      },
    });

    const matchingCandidates = unlinkedCandidates.filter((c) => {
      const cDigits = (c.phone || '').replace(/\D/g, '').slice(-10);
      return phoneDigits.length >= 7 && cDigits === phoneDigits;
    });

    if (matchingCandidates.length > 1) {
      throw new ConflictException(
        'Multiple customer records match your details. Please contact customer support for account verification.',
      );
    }

    const unlinkedCustomer = matchingCandidates.length === 1 ? matchingCandidates[0] : null;

    if (unlinkedCustomer && unlinkedCustomer.status === 'INACTIVE') {
      throw new ForbiddenException('Customer profile is currently inactive. Please contact support.');
    }

    // 4. Hash password using bcrypt (10 salt rounds) - never plaintext
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Create User and link to existing Customer profile (if matched); otherwise new customer will complete onboarding
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          accountType: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      let customer: any = null;
      if (unlinkedCustomer) {
        // Link existing customer profile, preserving historical purchases, vehicles, and bookings
        customer = await tx.customer.update({
          where: { id: unlinkedCustomer.id },
          data: {
            userId: user.id,
            ...(unlinkedCustomer.phone ? {} : { phone: normalizedPhone }),
          },
        });
      }

      return { user, customer };
    });

    // 6. Audit log customer registration
    await this.auditService.log({
      actorUserId: result.user.id,
      action: unlinkedCustomer ? 'CUSTOMER_ACCOUNT_LINKED' : 'CUSTOMER_REGISTERED',
      entityType: unlinkedCustomer ? 'Customer' : 'User',
      entityId: result.customer ? result.customer.id : result.user.id,
      ipAddress,
      userAgent,
      metadata: {
        email: normalizedEmail,
        customerId: result.customer?.id,
        linkedExisting: !!unlinkedCustomer,
      },
    }).catch(() => {});

    // 7. Generate authentication tokens
    const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.accountType);
    const userProfile = await this.usersService.findById(result.user.id);

    return {
      message: unlinkedCustomer
        ? 'Customer profile successfully linked and account registered'
        : 'Customer registered successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const rawIdentifier = (dto.email || dto.emailOrPhone || '').trim();
    if (!rawIdentifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    const user = await this.usersService.findByEmail(rawIdentifier);

    if (!user) {
      // Check if an unlinked customer profile exists with this email or phone
      const targetEmail = rawIdentifier.toLowerCase();
      const cleanDigits = rawIdentifier.replace(/\D/g, '').slice(-10);
      const unlinkedCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { email: { equals: targetEmail, mode: 'insensitive' } },
            ...(cleanDigits.length >= 7 ? [{ phone: { contains: cleanDigits } }] : []),
          ],
        },
      });

      if (unlinkedCustomer && !unlinkedCustomer.userId) {
        throw new UnauthorizedException(
          'Your customer profile has not been activated yet. Please activate your account to set your password.',
        );
      }

      await this.auditService.log({
        action: 'FAILED_LOGIN',
        entityType: 'User',
        ipAddress,
        userAgent,
        metadata: { identifier: rawIdentifier, reason: 'Invalid email or phone' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const empProfile = (user as any)?.employeeProfile;
    const custProfile = (user as any)?.customerProfile;

    const isUnactivated =
      user.status === 'PENDING' ||
      !user.passwordHash ||
      user.passwordHash.includes('_unactivated_') ||
      user.passwordHash.startsWith('!UNACTIVATED!');

    if (isUnactivated) {
      if (user.accountType === 'CUSTOMER') {
        throw new UnauthorizedException(
          'Your customer account is pending activation. Please set your password using your activation link or OTP.',
        );
      } else {
        throw new UnauthorizedException(
          'Your employee account is pending activation. Please set your password using your activation link or OTP.',
        );
      }
    }

    if (
      user.status !== 'ACTIVE' ||
      (empProfile && empProfile.status !== 'ACTIVE') ||
      (custProfile && custProfile.status !== 'ACTIVE')
    ) {
      const statusReason =
        user.status !== 'ACTIVE'
          ? user.status
          : empProfile && empProfile.status !== 'ACTIVE'
          ? empProfile.status
          : custProfile?.status ?? 'INACTIVE';

      await this.auditService.log({
        actorUserId: user.id,
        action: 'FAILED_LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        metadata: {
          identifier: rawIdentifier,
          status: statusReason,
          reason: `Account is ${statusReason}`,
        },
      });

      if (empProfile?.status === 'PENDING_APPROVAL') {
        throw new ForbiddenException('Account is pending manager approval');
      }
      throw new UnauthorizedException(`Account is currently ${statusReason}`);
    }

    let isPasswordValid = false;
    if (user.passwordHash && dto.password) {
      try {
        if (user.passwordHash.startsWith('$2')) {
          isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        } else {
          // Check for legacy SHA-256 hash migration
          const sha256 = crypto.createHash('sha256').update(dto.password).digest('hex');
          if (user.passwordHash === sha256) {
            isPasswordValid = true;
            const upgradedHash = await bcrypt.hash(dto.password, 10);
            await this.prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: upgradedHash },
            }).catch(() => {});
          }
        }
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      try {
        await this.auditService.log({
          actorUserId: user.id,
          action: 'FAILED_LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          metadata: { identifier: rawIdentifier, reason: 'Invalid password' },
        }).catch(() => {});
      } catch {}

      if (user.googleId) {
        throw new UnauthorizedException(
          'Invalid password. This account was registered with Google Sign-In and does not have a separate password set. Please sign in with Google, or use Forgot Password to establish one.',
        );
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    const userProfile = await this.usersService.findById(user.id);

    // Enforce portal boundary isolation on the backend
    if (dto.portal === 'customer') {
      const hasCustomerAccess =
        user.accountType === 'CUSTOMER' ||
        userProfile?.roles?.includes('CUSTOMER') ||
        !!userProfile?.customerProfile ||
        !!userProfile?.customerId;

      if (!hasCustomerAccess) {
        await this.auditService.log({
          actorUserId: user.id,
          action: 'FAILED_LOGIN_PORTAL_FORBIDDEN',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          metadata: { portal: 'customer', accountType: user.accountType, roles: userProfile?.roles },
        }).catch(() => {});

        throw new ForbiddenException(
          'This account belongs to dealership organization staff. Please sign in through the Enterprise Operations Portal (/login/organization).'
        );
      }
    } else if (dto.portal === 'organization') {
      const hasOrgAccess =
        user.accountType !== 'CUSTOMER' ||
        userProfile?.roles?.some((r: string) => r !== 'CUSTOMER') ||
        !!userProfile?.employeeProfile ||
        !!userProfile?.employeeId;

      if (!hasOrgAccess) {
        await this.auditService.log({
          actorUserId: user.id,
          action: 'FAILED_LOGIN_PORTAL_FORBIDDEN',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          metadata: { portal: 'organization', accountType: user.accountType, roles: userProfile?.roles },
        }).catch(() => {});

        throw new ForbiddenException(
          'This account is registered for customer access. Please sign in through the Client Portal (/login/customer).'
        );
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.accountType);

    try {
      await this.auditService.log({
        actorUserId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        metadata: { roles: userProfile?.roles },
      }).catch(() => {});
    } catch {}

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }


  async authenticateGoogle(dto: GoogleAuthDto, ipAddress?: string, userAgent?: string) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new BadRequestException('Google authentication is not configured on the server');
    }

    if (!dto.credential || typeof dto.credential !== 'string') {
      throw new BadRequestException('Google ID token credential is required');
    }

    let payload: any;
    try {
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: dto.credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      await this.auditService.log({
        action: 'FAILED_GOOGLE_LOGIN',
        entityType: 'User',
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid or expired Google token', error: err?.message },
      }).catch(() => {});
      throw new UnauthorizedException('Invalid or expired Google token');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Google token missing valid subject identifier');
    }

    const googleSub = payload.sub;
    const email = payload.email?.toLowerCase().trim();
    if (!email) {
      throw new BadRequestException('Google account does not have an email address');
    }

    if (payload.email_verified === false) {
      throw new UnauthorizedException('Google email address is not verified');
    }

    // 1. Check for existing user linked by Google subject identifier (sub)
    const existingGoogleUser = await this.prisma.user.findUnique({
      where: { googleId: googleSub },
      include: {
        customerProfile: true,
        employeeProfile: true,
      },
    });

    if (existingGoogleUser) {
      // Check account status
      if (existingGoogleUser.status !== 'ACTIVE') {
        const statusReason = existingGoogleUser.status;
        await this.auditService.log({
          actorUserId: existingGoogleUser.id,
          action: 'FAILED_GOOGLE_LOGIN',
          entityType: 'User',
          entityId: existingGoogleUser.id,
          ipAddress,
          userAgent,
          metadata: { email: existingGoogleUser.email, status: statusReason, reason: `Account is ${statusReason}` },
        }).catch(() => {});

        if (existingGoogleUser.status === 'PENDING') {
          throw new ForbiddenException('Account is pending manager approval');
        }
        throw new UnauthorizedException(`Account is currently ${statusReason}`);
      }

      await this.prisma.user.update({
        where: { id: existingGoogleUser.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});

      await this.auditService.log({
        actorUserId: existingGoogleUser.id,
        action: 'GOOGLE_LOGIN_SUCCESS',
        entityType: 'User',
        entityId: existingGoogleUser.id,
        ipAddress,
        userAgent,
        metadata: { email: existingGoogleUser.email, accountType: existingGoogleUser.accountType },
      }).catch(() => {});

      const tokens = await this.generateTokens(
        existingGoogleUser.id,
        existingGoogleUser.email,
        existingGoogleUser.accountType,
      );
      const userProfile = await this.usersService.findById(existingGoogleUser.id);

      // Enforce portal boundary isolation on the backend for Google Sign-In
      if (dto.portal === 'customer') {
        const hasCustomerAccess =
          existingGoogleUser.accountType === 'CUSTOMER' ||
          userProfile?.roles?.includes('CUSTOMER') ||
          !!userProfile?.customerProfile ||
          !!userProfile?.customerId;

        if (!hasCustomerAccess) {
          await this.auditService.log({
            actorUserId: existingGoogleUser.id,
            action: 'FAILED_LOGIN_PORTAL_FORBIDDEN',
            entityType: 'User',
            entityId: existingGoogleUser.id,
            ipAddress,
            userAgent,
            metadata: { portal: 'customer', accountType: existingGoogleUser.accountType, roles: userProfile?.roles },
          }).catch(() => {});

          throw new ForbiddenException(
            'This account belongs to dealership organization staff. Please sign in through the Enterprise Operations Portal (/login/organization).'
          );
        }
      } else if (dto.portal === 'organization') {
        const hasOrgAccess =
          existingGoogleUser.accountType !== 'CUSTOMER' ||
          userProfile?.roles?.some((r: string) => r !== 'CUSTOMER') ||
          !!userProfile?.employeeProfile ||
          !!userProfile?.employeeId;

        if (!hasOrgAccess) {
          await this.auditService.log({
            actorUserId: existingGoogleUser.id,
            action: 'FAILED_LOGIN_PORTAL_FORBIDDEN',
            entityType: 'User',
            entityId: existingGoogleUser.id,
            ipAddress,
            userAgent,
            metadata: { portal: 'organization', accountType: existingGoogleUser.accountType, roles: userProfile?.roles },
          }).catch(() => {});

          throw new ForbiddenException(
            'This account is registered for customer access. Please sign in through the Client Portal (/login/customer).'
          );
        }
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userProfile,
      };
    }

    // 2. No account linked to this Google subject identifier.
    // Check if an existing account already has this email address.
    // Secure handling: Do NOT automatically link an existing password account solely because email matches.
    const existingEmailUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { customerProfile: { email: { equals: email, mode: 'insensitive' } } },
        ],
      },
    });

    if (existingEmailUser) {
      if (existingEmailUser.status === 'PENDING') {
        throw new ConflictException(
          'An account with this email address is pending activation. Please activate your account to set your password.',
        );
      }

      await this.auditService.log({
        actorUserId: existingEmailUser.id,
        action: 'FAILED_GOOGLE_LINKING',
        entityType: 'User',
        entityId: existingEmailUser.id,
        ipAddress,
        userAgent,
        metadata: { email, reason: 'Email already registered under password account. Automatic linking prohibited.' },
      }).catch(() => {});

      throw new ConflictException(
        'An account with this email address already exists. Please log in using your email and password.'
      );
    }

    // 3. New public Google registration: strictly create CUSTOMER account
    if (dto.portal === 'organization') {
      throw new ForbiddenException(
        'New employee or organization accounts cannot be self-registered via Google Sign-In. Please contact your dealership administrator.'
      );
    }
    const fullName = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Google Customer';
    const unguessablePassword = `_unactivated_google_${crypto.randomUUID()}`;

    // Check if an unlinked customer profile exists for this verified Google email
    const unlinkedCust = await this.prisma.customer.findFirst({
      where: { email, userId: null },
    });

    if (unlinkedCust && unlinkedCust.status === 'INACTIVE') {
      throw new ForbiddenException('Customer profile is currently inactive. Please contact support.');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          googleId: googleSub,
          passwordHash: unguessablePassword,
          accountType: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      let customer: any = null;
      if (unlinkedCust) {
        customer = await tx.customer.update({
          where: { id: unlinkedCust.id },
          data: {
            userId: newUser.id,
            ...(unlinkedCust.phone ? {} : { phone: payload.phone_number || payload.phone || '' }),
          },
        });
      }

      return { user: newUser, customer };
    });

    await this.auditService.log({
      actorUserId: created.user.id,
      action: unlinkedCust ? 'CUSTOMER_ACCOUNT_LINKED_GOOGLE' : 'CUSTOMER_REGISTERED_GOOGLE',
      entityType: unlinkedCust ? 'Customer' : 'User',
      entityId: created.customer ? created.customer.id : created.user.id,
      ipAddress,
      userAgent,
      metadata: { email, googleSub, customerId: created.customer?.id },
    }).catch(() => {});

    const tokens = await this.generateTokens(created.user.id, created.user.email, created.user.accountType);
    const userProfile = await this.usersService.findById(created.user.id);

    return {
      message: 'Customer registered with Google successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'titan_super_secret_refresh_key',
      });

      const userProfile = await this.usersService.findById(payload.sub);

      if (!userProfile || userProfile.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh session');
      }

      const tokens = await this.generateTokens(
        userProfile.id,
        userProfile.email,
        userProfile.accountType,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.auditService.log({
      actorUserId: userId,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async sendActivationInvitation(customerId: string, actorUserId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true, preferredBranch: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer '${customerId}' not found`);
    }

    // Generate 6-digit OTP and secure JWT token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = await this.jwtService.signAsync(
      { sub: customer.id, email: customer.email, phone: customer.phone, type: 'CUSTOMER_ACTIVATION' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
        expiresIn: '48h',
      },
    );

    const tokenHash = this.hashSecret(token);
    const otpHash = this.hashSecret(otp);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Dispatch Email Notification
    if (customer.email) {
      await this.notificationsService.send({
        customerId: customer.id,
        channel: 'EMAIL',
        title: 'Activate your Titan Auto Customer Account',
        body: `Welcome to Titan Auto! Your account has been prepared by our staff. Your activation code is ${otp}. Use the following link to set your password: /activate-account?email=${encodeURIComponent(customer.email)}&token=${token}`,
        metadata: {
          type: 'CUSTOMER_ACTIVATION',
          customerId: customer.id,
          tokenHash,
          otpHash,
          expiresAt,
          used: false,
          attempts: 0,
        },
      });
    }

    // Dispatch SMS Notification
    if (customer.phone) {
      await this.notificationsService.send({
        customerId: customer.id,
        channel: 'SMS',
        title: 'Titan Auto Account Activation Code',
        body: `Your Titan Auto portal activation OTP is ${otp}. Valid for 48 hours. Activate at /activate-account`,
        metadata: {
          type: 'CUSTOMER_ACTIVATION',
          customerId: customer.id,
          otpHash,
          expiresAt,
          used: false,
          attempts: 0,
        },
      });
    }

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'CUSTOMER_ACTIVATION_INVITATION_SENT',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { customerId: customer.id, email: customer.email, phone: customer.phone },
    }).catch(() => {});

    return {
      success: true,
      message: `Activation invitation successfully dispatched for ${customer.name}`,
      customerId: customer.id,
      ...(process.env.NODE_ENV === 'test' ? { token, otp } : {}),
    };
  }

  async sendEmployeeActivationInvitation(employeeId: string, actorUserId?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, branch: true },
    });
    if (!employee || !employee.user) {
      throw new NotFoundException(`Employee '${employeeId}' not found`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = await this.jwtService.signAsync(
      {
        sub: employee.id,
        userId: employee.userId,
        email: employee.user.email,
        phone: employee.user.phone,
        type: 'EMPLOYEE_ACTIVATION',
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
        expiresIn: '48h',
      },
    );

    const tokenHash = this.hashSecret(token);
    const otpHash = this.hashSecret(otp);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    if (employee.user.email) {
      await this.notificationsService.send({
        userId: employee.userId,
        channel: 'EMAIL',
        title: 'Activate your Titan Auto Employee Account',
        body: `Welcome to Titan Auto! Your employee account has been created. Your activation code is ${otp}. Use the following link to establish your password: /activate-employee?email=${encodeURIComponent(employee.user.email)}&token=${token}`,
        metadata: {
          type: 'EMPLOYEE_ACTIVATION',
          employeeId: employee.id,
          userId: employee.userId,
          tokenHash,
          otpHash,
          expiresAt,
          used: false,
          attempts: 0,
        },
      });
    }

    if (employee.user.phone) {
      await this.notificationsService.send({
        userId: employee.userId,
        channel: 'SMS',
        title: 'Titan Auto Employee Activation Code',
        body: `Your Titan Auto employee activation OTP is ${otp}. Valid for 48 hours. Activate at /activate-employee`,
        metadata: {
          type: 'EMPLOYEE_ACTIVATION',
          employeeId: employee.id,
          userId: employee.userId,
          otpHash,
          expiresAt,
          used: false,
          attempts: 0,
        },
      });
    }

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'EMPLOYEE_ACTIVATION_INVITATION_SENT',
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { employeeId: employee.id, email: employee.user.email, phone: employee.user.phone },
    }).catch(() => {});

    return {
      success: true,
      message: `Employee activation invitation successfully dispatched for ${employee.firstName} ${employee.lastName}`,
      employeeId: employee.id,
      ...(process.env.NODE_ENV === 'test' ? { token, otp } : {}),
    };
  }

  async activateCustomer(dto: ActivateCustomerDto, ipAddress?: string, userAgent?: string) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!/[0-9]/.test(dto.password) || !/[a-zA-Z]/.test(dto.password)) {
      throw new BadRequestException('Password must contain at least one letter and one number');
    }

    let customerId: string | null = null;
    let targetEmail: string | null = null;
    let targetPhone: string | null = null;
    let matchedNotification: any = null;

    // 1. JWT Token Verification
    if (dto.token) {
      try {
        const payload = await this.jwtService.verifyAsync(dto.token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
        });
        if (payload.type !== 'CUSTOMER_ACTIVATION') {
          throw new BadRequestException('Invalid activation token type');
        }
        customerId = payload.sub;
        targetEmail = payload.email;
        targetPhone = payload.phone;

        // Verify token against notification record to enforce single-use
        matchedNotification = await this.prisma.notification.findFirst({
          where: {
            customerId,
            title: { contains: 'Activation', mode: 'insensitive' },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (matchedNotification) {
          const meta = matchedNotification.metadata as any;
          if (meta?.used) {
            throw new BadRequestException('This activation invitation has already been used. Please log in or request a new invitation.');
          }
          if (meta?.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
            throw new BadRequestException('This activation token has expired. Please request a new invitation.');
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Activation token is invalid or expired. Please request a new invitation.');
      }
    }

    // 2. OTP Code Verification
    if (!customerId && dto.otp && dto.emailOrPhone) {
      const rawIdentifier = dto.emailOrPhone.trim();
      const cleanDigits = rawIdentifier.replace(/\D/g, '').slice(-10);
      const cleanEmail = rawIdentifier.toLowerCase();

      const candidateCustomers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { email: { equals: cleanEmail, mode: 'insensitive' } },
            ...(cleanDigits.length >= 7 ? [{ phone: { contains: cleanDigits } }] : []),
          ],
        },
      });

      if (candidateCustomers.length === 0) {
        throw new NotFoundException('No customer profile found with the provided email or phone');
      }

      const customerIds = candidateCustomers.map((c) => c.id);
      matchedNotification = await this.prisma.notification.findFirst({
        where: {
          customerId: { in: customerIds },
          title: { contains: 'Activation', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
      });

      const meta = matchedNotification?.metadata as any;
      const otpHash = this.hashSecret(dto.otp.trim());
      if (!meta || (meta.otpHash !== otpHash && meta.otp !== dto.otp.trim())) {
        throw new BadRequestException('Invalid activation OTP code');
      }
      if (meta.used) {
        throw new BadRequestException('This activation code has already been used. Please log in or request a new invitation.');
      }
      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
        throw new BadRequestException('Activation OTP has expired. Please request a new invitation.');
      }

      customerId = meta.customerId || matchedNotification?.customerId;
    }

    if (!customerId) {
      throw new BadRequestException('Either a valid activation token or OTP with email/phone is required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    if (customer.status === 'INACTIVE') {
      throw new ForbiddenException('Customer profile is inactive. Please contact dealership support.');
    }

    // Hash password with bcrypt (10 rounds) - never default, plaintext, or bypass
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const normalizedEmail = (customer.email || targetEmail || '').trim().toLowerCase();
    const normalizedPhone = (customer.phone || targetPhone || '').trim();

    if (!normalizedEmail && !normalizedPhone) {
      throw new BadRequestException('Customer profile lacks contact information to establish login credentials.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let user: any = null;

      if (customer.userId) {
        user = await tx.user.findUnique({ where: { id: customer.userId } });
        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              passwordHash,
              status: 'ACTIVE',
              ...(normalizedEmail && !user.email ? { email: normalizedEmail } : {}),
              ...(normalizedPhone && !user.phone ? { phone: normalizedPhone } : {}),
            },
          });
        }
      }

      if (!user) {
        // Prevent duplicate login account
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
              ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ],
          },
          include: { customerProfile: true, employeeProfile: true },
        });

        if (existingUser) {
          if (existingUser.accountType !== 'CUSTOMER' || existingUser.employeeProfile) {
            throw new ConflictException(
              'This contact detail is associated with an organizational employee account. Please contact dealership administration to link customer access.',
            );
          }
          if (existingUser.customerProfile && existingUser.customerProfile.id !== customer.id) {
            throw new ConflictException(
              'A customer login account already exists for this contact information. Please log in directly or use password recovery.',
            );
          }

          user = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              passwordHash,
              status: 'ACTIVE',
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              email: normalizedEmail || `customer_${customer.id.slice(0, 8)}@titanauto.local`,
              phone: normalizedPhone || null,
              passwordHash,
              accountType: 'CUSTOMER',
              status: 'ACTIVE',
            },
          });
        }

        await tx.customer.update({
          where: { id: customer.id },
          data: { userId: user.id },
        });
      }

      // Enforce single-use token: Invalidate notification token/OTP
      if (matchedNotification) {
        const meta = (matchedNotification.metadata as any) || {};
        await tx.notification.update({
          where: { id: matchedNotification.id },
          data: {
            status: 'READ',
            metadata: {
              ...meta,
              used: true,
              usedAt: new Date().toISOString(),
            },
          },
        }).catch(() => {});
      }

      return { user, customer };
    });

    await this.auditService.log({
      actorUserId: result.user.id,
      action: 'CUSTOMER_ACCOUNT_ACTIVATED',
      entityType: 'Customer',
      entityId: customer.id,
      ipAddress,
      userAgent,
      metadata: { customerId: customer.id, userId: result.user.id },
    }).catch(() => {});

    const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.accountType);
    const userProfile = await this.usersService.findById(result.user.id);

    return {
      success: true,
      message: 'Customer account activated successfully. Welcome to Titan Auto!',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async activateEmployee(dto: ActivateEmployeeDto, ipAddress?: string, userAgent?: string) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!/[0-9]/.test(dto.password) || !/[a-zA-Z]/.test(dto.password)) {
      throw new BadRequestException('Password must contain at least one letter and one number');
    }

    let employeeId: string | null = null;
    let userId: string | null = null;
    let matchedNotification: any = null;

    // 1. JWT Token Verification
    if (dto.token) {
      try {
        const payload = await this.jwtService.verifyAsync(dto.token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
        });
        if (payload.type !== 'EMPLOYEE_ACTIVATION') {
          throw new BadRequestException('Invalid activation token type');
        }
        employeeId = payload.sub;
        userId = payload.userId;

        matchedNotification = await this.prisma.notification.findFirst({
          where: {
            userId,
            title: { contains: 'Employee Account', mode: 'insensitive' },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (matchedNotification) {
          const meta = matchedNotification.metadata as any;
          if (meta?.used) {
            throw new BadRequestException('This activation token has already been used. Please log in or request a new invitation.');
          }
          if (meta?.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
            throw new BadRequestException('This activation token has expired. Please request a new invitation.');
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Activation token is invalid or expired. Please request a new invitation.');
      }
    }

    // 2. OTP Code Verification
    if (!userId && dto.otp && dto.emailOrPhone) {
      const rawIdentifier = dto.emailOrPhone.trim();
      const user = await this.usersService.findByEmail(rawIdentifier);
      if (!user || user.accountType !== 'EMPLOYEE') {
        throw new NotFoundException('No employee account found with the provided email or phone');
      }

      matchedNotification = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          title: { contains: 'Employee', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
      });

      const meta = matchedNotification?.metadata as any;
      const otpHash = this.hashSecret(dto.otp.trim());
      if (!meta || (meta.otpHash !== otpHash && meta.otp !== dto.otp.trim())) {
        throw new BadRequestException('Invalid employee activation OTP code');
      }
      if (meta.used) {
        throw new BadRequestException('This activation code has already been used. Please log in or request a new invitation.');
      }
      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
        throw new BadRequestException('Activation OTP has expired. Please request a new invitation.');
      }

      userId = user.id;
      employeeId = meta.employeeId || (user as any).employeeProfile?.id;
    }

    if (!userId) {
      throw new BadRequestException('Either a valid activation token or OTP with email/phone is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employeeProfile: { include: { roleAssignments: { include: { role: true } } } } },
    });

    if (!user) {
      throw new NotFoundException('Employee user account not found');
    }

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      throw new ForbiddenException('Employee account is inactive or suspended. Please contact administrator.');
    }

    // Hash password with bcrypt (10 rounds) - never default, plaintext, or bypass
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: 'ACTIVE',
        },
      });

      if (matchedNotification) {
        const meta = (matchedNotification.metadata as any) || {};
        await tx.notification.update({
          where: { id: matchedNotification.id },
          data: {
            status: 'READ',
            metadata: {
              ...meta,
              used: true,
              usedAt: new Date().toISOString(),
            },
          },
        }).catch(() => {});
      }
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'EMPLOYEE_ACCOUNT_ACTIVATED',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { userId: user.id, employeeId },
    }).catch(() => {});

    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    const userProfile = await this.usersService.findById(user.id);

    return {
      success: true,
      message: 'Employee account activated successfully. Welcome to Titan Auto!',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async resendActivation(dto: ResendActivationDto, ipAddress?: string, userAgent?: string) {
    const rawIdentifier = (dto.emailOrPhone || '').trim();
    if (!rawIdentifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    const cleanEmail = rawIdentifier.toLowerCase();
    const cleanDigits = rawIdentifier.replace(/\D/g, '').slice(-10);

    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          ...(cleanDigits.length >= 7 ? [{ phone: { contains: cleanDigits } }] : []),
        ],
      },
    });

    if (!customer) {
      throw new NotFoundException('No customer account found with that email or phone number');
    }

    return this.sendActivationInvitation(customer.id);
  }

  async resendEmployeeActivation(dto: ResendActivationDto, ipAddress?: string, userAgent?: string) {
    const rawIdentifier = (dto.emailOrPhone || '').trim();
    if (!rawIdentifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    const user = await this.usersService.findByEmail(rawIdentifier);
    if (!user || user.accountType !== 'EMPLOYEE' || !(user as any).employeeProfile) {
      return {
        success: true,
        message: 'If an employee account exists with this email or phone, an activation invitation has been sent.',
      };
    }

    return this.sendEmployeeActivationInvitation((user as any).employeeProfile.id, user.id);
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string) {
    const rawIdentifier = (dto.emailOrPhone || dto.email || '').trim();
    if (!rawIdentifier) {
      throw new BadRequestException('Email address or phone number is required');
    }

    const user = await this.usersService.findByEmail(rawIdentifier);

    if (user) {
      // 1. Rate limiting: 60-second cooldown per account
      const recentRequest = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          title: { contains: 'Password Reset', mode: 'insensitive' },
          createdAt: { gte: new Date(Date.now() - 60000) },
        },
      });
      if (recentRequest) {
        throw new BadRequestException(
          'A password reset verification code was recently requested. Please wait 60 seconds before requesting another code.',
        );
      }

      // 2. Generate cryptographically secure six-digit OTP and single-use JWT
      const otp = crypto.randomInt(100000, 1000000).toString();
      const token = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'PASSWORD_RESET' },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
          expiresIn: '1h',
        },
      );
      const tokenHash = this.hashSecret(token);
      const otpHash = this.hashSecret(otp);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const targetEmail = user.email || (user as any).customerProfile?.email;
      const targetPhone = user.phone || (user as any).customerProfile?.phone;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E5E5E5; border-radius: 16px; background: #FFFFFF;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: bold; color: #F5A800; letter-spacing: 2px; text-transform: uppercase;">TITAN AUTO PORTAL</span>
            <h2 style="margin: 6px 0 0; color: #111111; font-size: 20px;">Password Reset Verification</h2>
          </div>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.5;">We received a request to reset your password. Use the verification code below to complete your password update:</p>
          <div style="margin: 24px 0; padding: 18px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; text-align: center;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111111;">${otp}</span>
            <div style="color: #92400E; font-size: 11px; font-weight: 600; margin-top: 8px;">Valid for 1 hour &bull; Single-use only</div>
          </div>
          <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">If you did not request a password reset, please ignore this email or contact dealership support immediately.</p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #F3F4F6; color: #9CA3AF; font-size: 11px; text-align: center;">
            Titan Auto &bull; Enterprise Dealership Management
          </div>
        </div>
      `;

      if (targetEmail) {
        try {
          await this.notificationsService.send({
            userId: user.id,
            customerId: (user as any).customerProfile?.id,
            recipientEmail: targetEmail,
            channel: 'EMAIL',
            title: 'Titan Auto Password Reset Request',
            body: `Your Titan Auto password reset code is ${otp}. Valid for 1 hour.`,
            html: emailHtml,
            metadata: {
              type: 'PASSWORD_RESET',
              userId: user.id,
              tokenHash,
              otpHash,
              expiresAt,
              used: false,
              attempts: 0,
            },
          });
        } catch (err: any) {
          throw new ServiceUnavailableException(
            'Unable to deliver verification code through the email provider. Please contact dealership support.',
          );
        }
      }

      if (targetPhone) {
        await this.notificationsService.send({
          userId: user.id,
          customerId: (user as any).customerProfile?.id,
          recipientPhone: targetPhone,
          channel: 'SMS',
          title: 'Titan Auto Password Reset OTP',
          body: `Your Titan Auto password reset code is ${otp}. Valid for 1 hour.`,
          metadata: {
            type: 'PASSWORD_RESET',
            userId: user.id,
            otpHash,
            expiresAt,
            used: false,
            attempts: 0,
          },
        }).catch(() => {});
      }
    }

    const smtpHost = this.configService.get<string>('SMTP_HOST')?.trim();
    const isConfigured =
      Boolean(this.notificationsService?.isEmailConfigured?.()) ||
      Boolean(smtpHost);

    return {
      success: true,
      message: isConfigured
        ? 'If an account exists with this email or phone, a password reset code has been dispatched.'
        : 'If an account exists with this email or phone, a password reset code has been generated (Mock simulation mode active: SMTP_HOST is not configured).',
      deliveryMode: isConfigured ? 'smtp' : 'mock',
      simulated: !isConfigured,
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string, userAgent?: string) {
    const rawPassword = (dto.password || dto.newPassword || '').trim();
    if (!rawPassword || rawPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!/[0-9]/.test(rawPassword) || !/[a-zA-Z]/.test(rawPassword)) {
      throw new BadRequestException('Password must contain at least one letter and one number');
    }

    let userId: string | null = null;
    let matchedNotification: any = null;

    const rawToken = (dto.token || '').trim();
    const rawOtp = (dto.otp || dto.code || '').trim();
    const rawIdentifier = (dto.emailOrPhone || dto.email || '').trim();

    if (rawToken) {
      try {
        const payload = await this.jwtService.verifyAsync(rawToken, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
        });
        if (payload.type !== 'PASSWORD_RESET') {
          throw new BadRequestException('Invalid reset token type');
        }
        userId = payload.sub;

        matchedNotification = await this.prisma.notification.findFirst({
          where: {
            userId,
            title: { contains: 'Password Reset', mode: 'insensitive' },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (matchedNotification) {
          const meta = matchedNotification.metadata as any;
          if (meta?.used) {
            throw new BadRequestException('This password reset link has already been used. Please request a new one.');
          }
          if (meta?.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
            throw new BadRequestException('This password reset link has expired. Please request a new one.');
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Reset token is invalid or expired. Please request a new password reset.');
      }
    }

    if (!userId && rawOtp && rawIdentifier) {
      const user = await this.usersService.findByEmail(rawIdentifier);
      if (!user) {
        throw new BadRequestException('Invalid email or phone number');
      }

      matchedNotification = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          title: { contains: 'Password Reset', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!matchedNotification) {
        throw new BadRequestException('No password reset request found. Please request a new verification code.');
      }

      const meta = (matchedNotification.metadata as any) || {};

      if (meta.used) {
        throw new BadRequestException('This password reset code has already been used. Please request a new one.');
      }
      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
        throw new BadRequestException('Password reset verification code has expired. Please request a new one.');
      }
      if ((meta.attempts || 0) >= 5) {
        throw new BadRequestException(
          'Too many incorrect verification attempts. This code has been invalidated for security. Please request a new code.',
        );
      }

      const otpHash = this.hashSecret(rawOtp);
      if (meta.otpHash !== otpHash && meta.otp !== rawOtp) {
        const nextAttempts = (meta.attempts || 0) + 1;
        await this.prisma.notification.update({
          where: { id: matchedNotification.id },
          data: {
            metadata: {
              ...meta,
              attempts: nextAttempts,
            },
          },
        }).catch(() => {});

        const remaining = Math.max(0, 5 - nextAttempts);
        if (remaining === 0) {
          throw new BadRequestException('Invalid verification code. Maximum attempts exceeded. Please request a new code.');
        }
        throw new BadRequestException(`Invalid password reset verification code. ${remaining} attempt(s) remaining.`);
      }

      userId = user.id;
    }

    if (!userId) {
      throw new BadRequestException('Valid reset token or verification code with email/phone is required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      // Re-verify notification within transaction to prevent concurrent race condition replay
      if (matchedNotification) {
        const freshNotif = await tx.notification.findUnique({
          where: { id: matchedNotification.id },
        });
        const freshMeta = (freshNotif?.metadata as any) || {};
        if (freshMeta.used) {
          throw new BadRequestException('This password reset code has already been used.');
        }

        await tx.notification.update({
          where: { id: matchedNotification.id },
          data: {
            status: 'READ',
            metadata: {
              ...freshMeta,
              used: true,
              usedAt: new Date().toISOString(),
            },
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, status: 'ACTIVE' },
      });
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { userId: user.id },
    }).catch(() => {});

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    };
  }

  private async generateTokens(userId: string, email: string, accountType: string) {
    const payload = { sub: userId, email, accountType };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'titan_super_secret_refresh_key',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }
}
