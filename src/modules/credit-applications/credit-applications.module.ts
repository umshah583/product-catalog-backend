import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CreditApplicationsController } from './credit-applications.controller.js';
import { CreditApplicationsService } from './credit-applications.service.js';
import { CreditApplicationsRepository } from './credit-applications.repository.js';
import { CreditApplicationPdfService } from './credit-application-pdf.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CreditApplicationsController],
  providers: [
    CreditApplicationsService,
    CreditApplicationsRepository,
    CreditApplicationPdfService,
    PrismaService,
    JwtAuthGuard,
  ],
  exports: [CreditApplicationsService],
})
export class CreditApplicationsModule {}
