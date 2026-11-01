import { Controller, Post, Get, Body, Req, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ActivateCustomerDto } from './dto/activate-customer.dto';
import { ActivateEmployeeDto } from './dto/activate-employee.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Public self-registration for new customers' })
  async register(@Body() dto: RegisterCustomerDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.registerCustomer(dto, ip, userAgent);
  }

  @Public()
  @Post('register/customer')
  @ApiOperation({ summary: 'Public customer self-registration endpoint alias' })
  async registerCustomer(@Body() dto: RegisterCustomerDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.registerCustomer(dto, ip, userAgent);
  }

  @Public()
  @Post('customer/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Secure customer account activation to verify identity and set password' })
  async activateCustomer(@Body() dto: ActivateCustomerDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.activateCustomer(dto, ip, userAgent);
  }

  @Public()
  @Post('customer/resend-activation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend activation code or invitation link to customer' })
  async resendActivation(@Body() dto: ResendActivationDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resendActivation(dto, ip, userAgent);
  }

  @Public()
  @Post('employee/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Secure employee account activation to verify identity and establish password' })
  async activateEmployee(@Body() dto: ActivateEmployeeDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.activateEmployee(dto, ip, userAgent);
  }

  @Public()
  @Post('employee/resend-activation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend activation code or invitation link to employee' })
  async resendEmployeeActivation(@Body() dto: ResendActivationDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resendEmployeeActivation(dto, ip, userAgent);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset verification code' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.forgotPassword(dto, ip, userAgent);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset with verification code or token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resetPassword(dto, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE')
  @ApiBearerAuth()
  @Post('customer/:id/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send or resend account activation invitation to customer (authorized staff)' })
  async sendCustomerInvite(@Param('id') customerId: string, @CurrentUser('id') userId: string) {
    return this.authService.sendActivationInvitation(customerId, userId);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT access/refresh tokens' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate or register customer using verified Google ID token' })
  async googleAuth(@Body() dto: GoogleAuthDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.authenticateGoogle(dto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT access token using valid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout authenticated user and log audit trail' })
  async logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.logout(userId, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile, roles, permissions, & scope' })
  async getMe(@CurrentUser() user: any) {
    return { user };
  }
}
