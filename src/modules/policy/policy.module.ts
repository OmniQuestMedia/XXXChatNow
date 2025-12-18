import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyConfiguration } from './entities/policy-configuration.entity';
import { PolicyService } from './policy.service';
import { CampaignBudgetCalculatorService } from './campaign-budget-calculator.service';
import { PolicyController } from './controllers/policy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyConfiguration])],
  controllers: [PolicyController],
  providers: [PolicyService, CampaignBudgetCalculatorService],
  exports: [PolicyService, CampaignBudgetCalculatorService],
})
export class PolicyModule {}
