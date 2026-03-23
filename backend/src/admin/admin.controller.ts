import { Controller, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('page') page = '1', @Query('limit') limit = '20', @Query('search') search?: string) {
    return this.adminService.listUsers(parseInt(page), parseInt(limit), search);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto.isActive);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
