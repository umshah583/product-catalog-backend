import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, PrismaService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
