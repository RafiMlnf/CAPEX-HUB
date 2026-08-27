import { Module } from '@nestjs/common';
import { BodrController } from './bodr.controller';
import { BodrService } from './bodr.service';

@Module({
  controllers: [BodrController],
  providers: [BodrService],
  exports: [BodrService],
})
export class BodrModule {}
