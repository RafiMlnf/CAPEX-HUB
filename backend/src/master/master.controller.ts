import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { MasterService } from './master.service';

@Controller('master')
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // ── Otorisasi Harga Non-Product (special route before generic :entity) ────

  // GET /master/otorisasi-harga-np
  @Get('otorisasi-harga-np')
  getOtorisasiHargaNPList(@Query('id') id?: string) {
    return this.masterService.getOtorisasiHargaNP(id);
  }

  // POST /master/otorisasi-harga-np
  @Post('otorisasi-harga-np')
  createOtorisasiHargaNP(@Body() body: any) {
    return this.masterService.createOtorisasiHargaNP(body);
  }

  // PUT /master/otorisasi-harga-np?id=:id
  @Put('otorisasi-harga-np')
  updateOtorisasiHargaNP(@Query('id') id: string, @Body() body: any) {
    return this.masterService.updateOtorisasiHargaNP(id, body);
  }

  // DELETE /master/otorisasi-harga-np?id=:id
  @Delete('otorisasi-harga-np')
  removeOtorisasiHargaNP(@Query('id') id: string) {
    return this.masterService.removeOtorisasiHargaNP(id);
  }

  // ── Generic Master Data CRUD ──────────────────────────────────────────────

  // GET /master/:entity
  @Get(':entity')
  findAll(@Param('entity') entity: string) {
    return this.masterService.findAll(entity);
  }

  // POST /master/:entity
  @Post(':entity')
  create(@Param('entity') entity: string, @Body() body: any) {
    return this.masterService.create(entity, body);
  }

  // PUT /master/:entity?id=:id
  @Put(':entity')
  update(
    @Param('entity') entity: string,
    @Query('id') id: string,
    @Body() body: any,
  ) {
    return this.masterService.update(entity, id, body);
  }

  // DELETE /master/:entity?id=:id
  @Delete(':entity')
  remove(@Param('entity') entity: string, @Query('id') id: string) {
    return this.masterService.remove(entity, id);
  }
}
