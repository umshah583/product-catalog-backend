import { Injectable } from '@nestjs/common';
import { Prisma, Settings } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class SettingsRepository {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string): Promise<Settings | null> {
    return this.prisma.settings.findUnique({
      where: { tenantId },
    });
  }

  async upsert(tenantId: string, data: Prisma.SettingsCreateInput): Promise<Settings> {
    const { tenant, ...createData } = data;
    return this.prisma.settings.upsert({
      where: { tenantId },
      create: { ...createData, tenantId },
      update: data,
    });
  }

  async update(tenantId: string, data: Prisma.SettingsUpdateInput): Promise<Settings> {
    return this.prisma.settings.update({
      where: { tenantId },
      data,
    });
  }
}
