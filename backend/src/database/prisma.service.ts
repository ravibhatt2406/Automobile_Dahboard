import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isOffline = false;

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 1000)),
      ]);
      this.logger.log('✅ Connected to PostgreSQL database successfully.');
    } catch (error: any) {
      this.isOffline = true;
      this.logger.warn(`⚠️  Database connection waiting (running in offline dev mode): ${error?.message || error}`);
    }
  }

  async onModuleDestroy() {
    if (!this.isOffline) {
      await this.$disconnect().catch(() => {});
    }
  }
}
