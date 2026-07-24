import { Module } from '@nestjs/common';
import { IntegrationModule } from '../integration/integration.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [IntegrationModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
