import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL database successfully.');
    } catch (err: any) {
      this.logger.warn(`⚠️ Warning: Could not eagerly connect to PostgreSQL (${err.message}). Database operations will connect once PostgreSQL is running.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}
