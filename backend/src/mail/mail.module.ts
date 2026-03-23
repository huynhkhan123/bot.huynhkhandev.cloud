import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()  // Make MailService available everywhere without importing
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
