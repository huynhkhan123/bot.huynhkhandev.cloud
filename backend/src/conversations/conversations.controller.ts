import { Controller, Get, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.conversationsService.listForUser(userId);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.conversationsService.getMessages(id, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.conversationsService.softDelete(id, userId);
  }
}
