import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CustomersRepository } from './customers.repository.js';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
} from './dto/customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    private customersRepository: CustomersRepository,
    private jwtService: JwtService,
  ) {}

  async register(tenantId: string, dto: CustomerRegisterDto) {
    const existing = await this.customersRepository.findByEmail(tenantId, dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const customer = await this.customersRepository.create({
      tenantId,
      email: dto.email,
      phone: dto.phone,
      password: await bcrypt.hash(dto.password, 10),
      name: dto.name,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    return { customer, message: 'Account created — pending admin approval' };
  }

  async login(tenantId: string, dto: CustomerLoginDto) {
    const customer = await this.customersRepository.findByEmail(tenantId, dto.email);
    if (!customer || !(await bcrypt.compare(dto.password, customer.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (customer.status === 'REJECTED') {
      throw new ForbiddenException('This account has been rejected');
    }
    if (customer.status === 'BLOCKED') {
      throw new ForbiddenException('This account has been blocked');
    }

    const token = this.jwtService.sign(
      { sub: customer.id, tenantId, type: 'customer' },
      { secret: process.env.JWT_SECRET, expiresIn: '365d' },
    );

    return {
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
      },
    };
  }

  async me(tenantId: string, customerId: string) {
    const customer = await this.customersRepository.findById(tenantId, customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async findAll(tenantId: string) {
    return this.customersRepository.findAll(tenantId);
  }

  async updateStatus(tenantId: string, id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED') {
    const existing = await this.customersRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundException('Customer not found');
    return this.customersRepository.updateStatus(tenantId, id, status);
  }

  /** Throw unless the customer is approved — used to gate ordering. */
  async assertApproved(tenantId: string, customerId: string) {
    const customer = await this.customersRepository.findById(tenantId, customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.status !== 'APPROVED') {
      throw new ForbiddenException('Your account is pending approval');
    }
    return customer;
  }
}
