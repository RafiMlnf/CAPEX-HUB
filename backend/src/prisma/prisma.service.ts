import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    let connectionString = configService.get<string>('DATABASE_URL');

    // If connection string contains template placeholders (e.g. ${DB_HOST}), interpolate them dynamically from ConfigService
    if (connectionString && connectionString.includes('${')) {
      connectionString = connectionString.replace(/\$\{(\w+)\}/g, (_, key) => {
        return configService.get<string>(key) || '';
      });
    }

    // Fallback assembly if DATABASE_URL is not provided directly
    if (!connectionString) {
      const dbType = configService.get<string>('DB_TYPE') || 'postgresql';
      const dbUser = configService.get<string>('DB_USER') || '';
      const dbPassword = configService.get<string>('DB_PASSWORD') || '';
      const dbHost = configService.get<string>('DB_HOST') || '';
      const dbPort = configService.get<string>('DB_PORT') || '';
      const dbName = configService.get<string>('DB_NAME') || '';
      const dbSchema = configService.get<string>('DB_SCHEMA') || '';

      connectionString = `${dbType}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}${dbSchema ? `?schema=${dbSchema}` : ''}`;
    }

    const pool = new pg.Pool({
      connectionString,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
