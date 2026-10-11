import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Validates a mobile-app customer JWT (`type: 'customer'` claim) and
 * attaches the decoded payload as `request.customer`.
 */
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const payload = this.jwtService.verify(authHeader.substring(7), {
        secret: process.env.JWT_SECRET,
      });
      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Not a customer token');
      }
      request.customer = payload;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
