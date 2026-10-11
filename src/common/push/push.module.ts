import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Global()
@Module({
  providers: [PushService, PrismaService],
  exports: [PushService],
})
export class PushModule {}
