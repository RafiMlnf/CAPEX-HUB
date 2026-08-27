import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MasterModule } from './master/master.module';
import { SettingsModule } from './settings/settings.module';
import { BodrModule } from './bodr/bodr.module';
import { OtorisasiHargaModule } from './otorisasi-harga/otorisasi-harga.module';
import { CapexModule } from './capex/capex.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // Global env configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded files statically
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), process.env.UPLOAD_DEST ?? 'uploads'),
      serveRoot: '/uploads',
    }),

    // Global Prisma
    PrismaModule,

    // Feature modules
    UsersModule,
    MasterModule,
    SettingsModule,
    BodrModule,
    OtorisasiHargaModule,
    CapexModule,
    AdminModule,
    UploadModule,
  ],
})
export class AppModule {}
