import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PurchaseService } from '../services/purchase.service';
import { PurchaseChipDto } from '../dto/purchase.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('purchase')
@UseGuards(JwtAuthGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('chip')
  async purchaseChip(@Req() req, @Body() dto: PurchaseChipDto) {
    // userId comes from JWT, dto includes menuId & chipId
    return this.purchaseService.purchaseChip(req.user.id, dto.menuId, dto.chipId);
  }
}
