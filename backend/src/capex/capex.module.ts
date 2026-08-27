import { Module } from '@nestjs/common';
import { CapexController } from './capex.controller';
import { CapexService } from './capex.service';

@Module({
  controllers: [CapexController],
  providers: [CapexService],
})
export class CapexModule {}
