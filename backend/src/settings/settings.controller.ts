import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
} from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Role Permissions ──────────────────────────────────────────────────────
  @Get('role-permissions')
  getRolePermissions() {
    return this.settingsService.getRolePermissions();
  }

  @Put('role-permissions')
  updateRolePermission(@Query('id') id: string, @Body() body: { permissions: string[] }) {
    return this.settingsService.updateRolePermission(id, body);
  }

  // ── Approval Workflow (BODR) ──────────────────────────────────────────────
  @Get('approval-workflows')
  getApprovalWorkflows() {
    return this.settingsService.getApprovalWorkflows();
  }

  @Post('approval-workflows')
  createApprovalWorkflow(@Body() body: any) {
    return this.settingsService.createApprovalWorkflow(body);
  }

  @Put('approval-workflows')
  updateApprovalWorkflow(@Query('id') id: string, @Body() body: any) {
    return this.settingsService.updateApprovalWorkflow(id, body);
  }

  @Delete('approval-workflows')
  deleteApprovalWorkflow(@Query('id') id: string) {
    return this.settingsService.deleteApprovalWorkflow(id);
  }

  // ── Approval Price Workflow ───────────────────────────────────────────────
  @Get('approval-price-workflows')
  getApprovalPriceWorkflows() {
    return this.settingsService.getApprovalPriceWorkflows();
  }

  @Post('approval-price-workflows')
  createApprovalPriceWorkflow(@Body() body: any) {
    return this.settingsService.createApprovalPriceWorkflow(body);
  }

  @Put('approval-price-workflows')
  updateApprovalPriceWorkflow(@Query('id') id: string, @Body() body: any) {
    return this.settingsService.updateApprovalPriceWorkflow(id, body);
  }

  @Delete('approval-price-workflows')
  deleteApprovalPriceWorkflow(@Query('id') id: string) {
    return this.settingsService.deleteApprovalPriceWorkflow(id);
  }

  // ── Department Settings ───────────────────────────────────────────────────
  @Get('dept-settings')
  getDeptSettings() {
    return this.settingsService.getDeptSettings();
  }

  @Post('dept-settings')
  upsertDeptSettings(@Body() body: any) {
    return this.settingsService.upsertDeptSettings(body);
  }

  // ── Portal Access ─────────────────────────────────────────────────────────
  @Get('portal-access')
  getPortalAccess() {
    return this.settingsService.getPortalAccess();
  }

  @Post('portal-access')
  upsertPortalAccess(@Body() body: any) {
    return this.settingsService.upsertPortalAccess(body);
  }
}
