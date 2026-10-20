import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
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
  ) {}

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
          { email: normalizedEmail },
          { customerProfile: { email: normalizedEmail } },
        ],
      },
    });

    if (existingUser) {
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
    const unlinkedCustomer = await this.prisma.customer.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        phone: normalizedPhone,
        userId: null,
      },
    });

    if (unlinkedCustomer && unlinkedCustomer.status === 'INACTIVE') {
      throw new ForbiddenException('Customer profile is currently inactive. Please contact support.');
    }

    // 4. Hash password using bcrypt (10 salt rounds) - never plaintext
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Create User and link to existing Customer profile or create new Customer profile atomically
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

      let customer;
      if (unlinkedCustomer) {
        // Link existing customer profile, preserving historical purchases, vehicles, and bookings
        customer = await tx.customer.update({
          where: { id: unlinkedCustomer.id },
          data: {
            userId: user.id,
            ...(unlinkedCustomer.phone ? {} : { phone: normalizedPhone }),
          },
        });
      } else {
        // Create new customer profile
        customer = await tx.customer.create({
          data: {
            userId: user.id,
            name: dto.name.trim(),
            phone: normalizedPhone,
            email: normalizedEmail,
            customerType: 'INDIVIDUAL',
            status: 'ACTIVE',
          },
        });
      }

      return { user, customer };
    });

    // 6. Audit log customer registration
    await this.auditService.log({
      actorUserId: result.user.id,
      action: unlinkedCustomer ? 'CUSTOMER_ACCOUNT_LINKED' : 'CUSTOMER_REGISTERED',
      entityType: 'Customer',
      entityId: result.customer.id,
      ipAddress,
      userAgent,
      metadata: {
        email: normalizedEmail,
        customerId: result.customer.id,
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

      if (user.status === 'PENDING' || empProfile?.status === 'PENDING_APPROVAL') {
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
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    const userProfile = await this.usersService.findById(user.id);
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
          { email },
          { customerProfile: { email } },
        ],
      },
    });

    if (existingEmailUser) {
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
    const fullName = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Google Customer';
    const unguessablePassword = await bcrypt.hash(crypto.randomUUID() + '_google_auth_sec_' + Date.now(), 10);

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

      let customer;
      if (unlinkedCust) {
        customer = await tx.customer.update({
          where: { id: unlinkedCust.id },
          data: {
            userId: newUser.id,
            ...(unlinkedCust.phone ? {} : { phone: payload.phone_number || payload.phone || '' }),
          },
        });
      } else {
        customer = await tx.customer.create({
          data: {
            userId: newUser.id,
            name: fullName,
            email,
            phone: payload.phone_number || payload.phone || '',
            customerType: 'INDIVIDUAL',
            status: 'ACTIVE',
          },
        });
      }

      return { user: newUser, customer };
    });


    await this.auditService.log({
      actorUserId: created.user.id,
      action: 'CUSTOMER_REGISTERED_GOOGLE',
      entityType: 'Customer',
      entityId: created.customer.id,
      ipAddress,
      userAgent,
      metadata: { email, googleSub, customerId: created.customer.id },
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
