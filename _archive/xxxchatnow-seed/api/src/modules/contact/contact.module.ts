import { Module } from '@nestjs/common';
import { ContactController } from './controllers';
import { ContactService } from './services';

@Module({
  providers: [ContactService],
  controllers: [ContactController],
  exports: []
})
export class ContactModule { }
