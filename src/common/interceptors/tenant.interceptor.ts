import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantSlug = request.headers['x-tenant-slug'];

    // Use default tenant if header not provided (for testing)
    const effectiveTenantSlug = tenantSlug || 'default';

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: effectiveTenantSlug, isActive: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found or inactive');
    }

    request.tenant = tenant;
    request.tenantId = tenant.id;

    return next.handle();
  }
}
