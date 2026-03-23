import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Agent module is a STUB in MVP — returns 501 Not Implemented
// Phase 3 will add BullMQ workers, GitHub integration, etc.
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  @Get('runs')
  listRuns(@CurrentUser('id') _userId: string) {
    return {
      statusCode: 501,
      message: 'Agent functionality is not yet available. Coming in Phase 3.',
      data: [],
    };
  }
}
