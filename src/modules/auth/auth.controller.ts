import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto, UpdateUserDto } from './dto/register.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PushService } from '../../common/push/push.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private push: PushService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('userId') userId: string) {
    return this.authService.logout(userId);
  }

  /**
   * Create a new user. Requires a valid admin JWT token.
   * The new user is assigned to the same tenant as the authenticated admin.
   */
  @Post('register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Req() req: any) {
    return this.authService.register(registerDto, req.user.tenantId);
  }

  /** Register the device's FCM token — salesman app gets order pushes. */
  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deviceToken(
    @Req() req: any,
    @Body() body: { token: string; platform?: string },
  ) {
    await this.push.registerToken(req.user.tenantId, body.token, body.platform, {
      userId: req.user.sub,
    });
  }

  /** List all users (salesmen + admins) in the current tenant. */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  async listUsers(@Req() req: any) {
    return this.authService.listUsers(req.user.tenantId);
  }

  /** Update a user's name, role, or password. */
  @Patch('users/:id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.authService.updateUser(req.user.tenantId, id, dto);
  }

  /** Activate/deactivate a user account. */
  @Patch('users/:id/active')
  @UseGuards(JwtAuthGuard)
  async setUserActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() req: any,
  ) {
    return this.authService.setUserActive(req.user.tenantId, id, isActive);
  }
}
