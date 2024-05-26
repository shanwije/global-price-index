import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AverageMidPriceDto } from './dto/global-price-index.dto';

@ApiTags('Global Price Index')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('global-price-index')
  @ApiOperation({ summary: 'Get global price index' })
  @ApiResponse({
    status: 200,
    description: 'The global price index has been successfully retrieved.',
    type: AverageMidPriceDto,
  })
  async getGlobalPriceIndex(): Promise<AverageMidPriceDto> {
    this.logger.log('Handling GET request for /global-price-index');
    const price = await this.appService.getGlobalPriceIndex();
    return price;
  }
}
