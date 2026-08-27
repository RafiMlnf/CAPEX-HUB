import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/dashboard
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // GET /admin/history-logs
  @Get('history-logs')
  getHistoryLogs(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('archive') archive?: string,
  ) {
    return this.adminService.getHistoryLogs({ search, status, archive });
  }
}
