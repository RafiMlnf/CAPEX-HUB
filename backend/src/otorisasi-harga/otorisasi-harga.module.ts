import { Module } from '@nestjs/common';
import { OtorisasiHargaController } from './otorisasi-harga.controller';
import { OtorisasiHargaService } from './otorisasi-harga.service';

@Module({
  controllers: [OtorisasiHargaController],
  providers: [OtorisasiHargaService],
})
export class OtorisasiHargaModule {}
