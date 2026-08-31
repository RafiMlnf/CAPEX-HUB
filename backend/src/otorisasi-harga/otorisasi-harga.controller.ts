import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { OtorisasiHargaService } from './otorisasi-harga.service';

@Controller('otorisasi-harga')
export class OtorisasiHargaController {
  constructor(private readonly service: OtorisasiHargaService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('history')
  getHistory(@Query('oh_id') ohId?: string) {
    return this.service.getHistory(ohId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
