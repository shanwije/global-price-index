import { ApiProperty } from '@nestjs/swagger';

export class AverageMidPriceDto {
  @ApiProperty({ example: 50005, description: 'The average mid price' })
  price: number;
}
