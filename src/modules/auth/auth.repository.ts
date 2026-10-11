import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });
  }

  async findByTenant(tenantId: string): Promise<Omit<User, 'password' | 'refreshToken'>[]> {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: { tenant: true },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
      include: { tenant: true },
    });
  }

  async updateActive(tenantId: string, userId: string, isActive: boolean) {
    return this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { isActive },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { refreshToken },
      include: { tenant: true },
    });
  }
}
