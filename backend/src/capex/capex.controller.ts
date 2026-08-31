import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { CapexService } from './capex.service';

@Controller()
export class CapexController {
  constructor(private readonly capexService: CapexService) {}

  // GET /capex-proposals
  @Get('capex-proposals')
  getProposals() {
    return this.capexService.getProposals();
  }

  // POST /capex-proposals
  @Post('capex-proposals')
  addProposal(@Body() body: any) {
    return this.capexService.addProposal(body);
  }

  // PUT /capex-proposals/:id
  @Put('capex-proposals/:id')
  updateProposal(@Param('id') id: string, @Body() body: any) {
    return this.capexService.updateProposal(id, body);
  }

  // DELETE /capex-proposals/:id
  @Delete('capex-proposals/:id')
  deleteProposal(@Param('id') id: string) {
    return this.capexService.deleteProposal(id);
  }

  // GET /capex-items
  @Get('capex-items')
  getCapexItems() {
    return this.capexService.getCapexItems();
  }

  // GET /capex-history
  @Get('capex-history')
  getCapexHistory(@Query('capex_id') capexId?: string) {
    return this.capexService.getHistory(capexId);
  }

  // POST /sync/bodr
  @Post('sync/bodr')
  syncFromBodr() {
    return this.capexService.syncFromBodr();
  }
}
