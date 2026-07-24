import { Module } from '@nestjs/common';
import { PersonalExternoController } from './personal-externo.controller';
import { PersonalExternoService } from './personal-externo.service';

@Module({
  controllers: [PersonalExternoController],
  providers: [PersonalExternoService],
})
export class PersonalExternoModule {}
