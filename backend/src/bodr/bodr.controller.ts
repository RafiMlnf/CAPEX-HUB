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
import { BodrService } from './bodr.service';

@Controller()
export class BodrController {
  constructor(private readonly bodrService: BodrService) {}

  // GET /bodr-dashboard (separate from /bodr prefix)
  @Get('bodr-dashboard')
  getDashboard(@Query('user_id') userId?: string) {
    return this.bodrService.getDashboard(userId);
  }

  // GET /bodr/stats
  @Get('bodr/stats')
  getStats(@Query('user_id') userId?: string) {
    return this.bodrService.getStats(userId);
  }

  // GET /bodr/progress
  @Get('bodr/progress')
  getProgress() {
    return this.bodrService.getProgress();
  }

  // POST /bodr/otorisasi-harga-request
  @Post('bodr/otorisasi-harga-request')
  requestOtorisasiHarga(@Body() body: any) {
    return this.bodrService.requestOtorisasiHarga(body);
  }

  // GET /bodr
  @Get('bodr')
  findAll(@Query('user_id') userId?: string, @Query('status') status?: string) {
    return this.bodrService.findAll({ user_id: userId, status });
  }

  // GET /bodr/history
  @Get('bodr/history')
  getHistory(@Query('bodr_id') bodrId?: string) {
    return this.bodrService.getHistory(bodrId);
  }

  // GET /bodr/:id
  @Get('bodr/:id')
  findOne(@Param('id') id: string) {
    return this.bodrService.findOne(id);
  }

  // POST /bodr
  @Post('bodr')
  create(@Body() body: any) {
    return this.bodrService.create(body);
  }

  // PUT /bodr/:id
  @Put('bodr/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.bodrService.update(id, body);
  }

  // DELETE /bodr/:id
  @Delete('bodr/:id')
  remove(@Param('id') id: string) {
    return this.bodrService.remove(id);
  }
}
