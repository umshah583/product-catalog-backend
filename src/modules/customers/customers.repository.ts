import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  tenantId: true,
  createdAt: true,
} as const;

@Injectable()
export class CustomersRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(tenantId: string, email: string) {
    return this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    });
  }

  findById(tenantId: string, id: string) {
    return this.prisma.customer.findFirst({
      where: { id, tenantId },
      select: CUSTOMER_SELECT,
    });
  }

  create(data: {
    tenantId: string;
    email: string;
    phone: string;
    password: string;
    name?: string;
  }) {
    return this.prisma.customer.create({
      data: {
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: data.password,
        name: data.name ?? null,
        tenant: { connect: { id: data.tenantId } },
      },
      select: CUSTOMER_SELECT,
    });
  }

  findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        ...CUSTOMER_SELECT,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(tenantId: string, id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.customer.update({
      where: { id, tenantId },
      data: { status },
      select: CUSTOMER_SELECT,
    });
  }
}
