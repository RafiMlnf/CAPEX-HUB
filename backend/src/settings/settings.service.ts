import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Role Permissions ──────────────────────────────────────────────────────
  async getRolePermissions() {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { id: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id.toString(),
      role_id: r.id.toString(),
      kode_role: r.kode_role,
      nama_role: r.nama_role,
      permissions: r.rolePermissions.map((rp) => rp.permission.kode_permission),
      status: r.status,
      created_at: r.created_at,
    }));
  }

  async updateRolePermission(roleId: string, data: { permissions: string[] }) {
    const role = await this.prisma.role.findUnique({ where: { id: parseInt(roleId) } });
    if (!role) throw new NotFoundException(`Role ${roleId} tidak ditemukan`);

    // Delete all existing
    await this.prisma.rolePermission.deleteMany({ where: { role_id: parseInt(roleId) } });

    // Get permission IDs from codes
    const permissions = await this.prisma.permission.findMany({
      where: { kode_permission: { in: data.permissions } },
    });

    // Re-create
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        role_id: parseInt(roleId),
        permission_id: p.id,
        status: 'active' as any,
      })),
    });

    return this.getRolePermissions().then((list) => list.find((r) => r.role_id === roleId));
  }

  // ── Approval Workflow (BODR) ──────────────────────────────────────────────
  async getApprovalWorkflows() {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      include: {
        departemen: true,
        steps: { include: { approver: { include: { role: true } } }, orderBy: { step_order: 'asc' } },
      },
      orderBy: { id: 'asc' },
    });

    return workflows.map((w) => ({
      id: w.id.toString(),
      departemen_id: w.departemen_id.toString(),
      departemen_nama: w.departemen?.nama_departemen ?? '',
      type_approval_id: w.type_approval_id.toString(),
      type_approval_nama: '',
      list_approval: w.steps.map((s) => ({
        user_id: s.approver_user_id.toString(),
        user_name: s.approver?.nama_user ?? '',
        role: s.approver?.role?.nama_role ?? '',
        order: s.step_order,
      })),
      status: w.status,
      created_at: w.created_at,
    }));
  }

  async createApprovalWorkflow(data: any) {
    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        departemen_id: parseInt(data.departemen_id),
        type_approval_id: parseInt(data.type_approval_id),
        status: data.status ?? 'active',
        steps: {
          create: (data.list_approval ?? []).map((s: any, idx: number) => ({
            step_order: s.order ?? idx + 1,
            approver_user_id: parseInt(s.user_id),
            keterangan: s.keterangan ?? null,
          })),
        },
      },
    });
    return { id: workflow.id.toString() };
  }

  async updateApprovalWorkflow(id: string, data: any) {
    await this.prisma.approvalWorkflowStep.deleteMany({ where: { workflow_id: parseInt(id) } });
    await this.prisma.approvalWorkflow.update({
      where: { id: parseInt(id) },
      data: {
        departemen_id: data.departemen_id ? parseInt(data.departemen_id) : undefined,
        type_approval_id: data.type_approval_id ? parseInt(data.type_approval_id) : undefined,
        status: data.status,
        steps: {
          create: (data.list_approval ?? []).map((s: any, idx: number) => ({
            step_order: s.order ?? idx + 1,
            approver_user_id: parseInt(s.user_id),
            keterangan: s.keterangan ?? null,
          })),
        },
      },
    });
    return { success: true };
  }

  async deleteApprovalWorkflow(id: string) {
    await this.prisma.approvalWorkflow.delete({ where: { id: parseInt(id) } });
    return { success: true };
  }

  // ── Approval Price Workflow ───────────────────────────────────────────────
  async getApprovalPriceWorkflows() {
    const workflows = await this.prisma.approvalPriceWorkflow.findMany({
      include: {
        departemen: true,
        steps: { include: { approver: { include: { role: true } } }, orderBy: { step_order: 'asc' } },
      },
      orderBy: { id: 'asc' },
    });

    return workflows.map((w) => ({
      id: w.id.toString(),
      departemen_id: w.departemen_id.toString(),
      departemen_nama: w.departemen?.nama_departemen ?? '',
      type_approval_id: w.type_approval_id.toString(),
      type_approval_nama: '',
      list_approval: w.steps.map((s) => ({
        user_id: s.approver_user_id.toString(),
        user_name: s.approver?.nama_user ?? '',
        role: s.keterangan || s.approver?.role?.nama_role || 'Approver',
        order: s.step_order,
      })),
      status: w.status,
      created_at: w.created_at,
    }));
  }

  async createApprovalPriceWorkflow(data: any) {
    const workflow = await this.prisma.approvalPriceWorkflow.create({
      data: {
        departemen_id: parseInt(data.departemen_id),
        type_approval_id: parseInt(data.type_approval_id),
        status: data.status ?? 'active',
        steps: {
          create: (data.list_approval ?? []).map((s: any, idx: number) => ({
            step_order: s.order ?? idx + 1,
            approver_user_id: parseInt(s.user_id),
            keterangan: s.keterangan ?? null,
          })),
        },
      },
    });
    return { id: workflow.id.toString() };
  }

  async updateApprovalPriceWorkflow(id: string, data: any) {
    await this.prisma.approvalPriceWorkflowStep.deleteMany({ where: { workflow_id: parseInt(id) } });
    await this.prisma.approvalPriceWorkflow.update({
      where: { id: parseInt(id) },
      data: {
        departemen_id: data.departemen_id ? parseInt(data.departemen_id) : undefined,
        type_approval_id: data.type_approval_id ? parseInt(data.type_approval_id) : undefined,
        status: data.status,
        steps: {
          create: (data.list_approval ?? []).map((s: any, idx: number) => ({
            step_order: s.order ?? idx + 1,
            approver_user_id: parseInt(s.user_id),
            keterangan: s.keterangan ?? null,
          })),
        },
      },
    });
    return { success: true };
  }

  async deleteApprovalPriceWorkflow(id: string) {
    await this.prisma.approvalPriceWorkflow.delete({ where: { id: parseInt(id) } });
    return { success: true };
  }

  // ── Department Settings ───────────────────────────────────────────────────
  async getDeptSettings() {
    const settings = await this.prisma.departmentSettings.findMany({
      include: {
        departemen: true,
        headDept: true,
        accounting: true,
      },
      orderBy: { id: 'asc' },
    });

    return settings.map((s) => ({
      id: s.id.toString(),
      departemen_id: s.departemen_id.toString(),
      departemen_nama: s.departemen?.nama_departemen ?? '',
      keterangan: s.keterangan ?? '',
      head_dept_id: s.head_dept_user_id?.toString() ?? '',
      head_dept_nama: s.headDept?.nama_user ?? '',
      accounting_id: s.accounting_user_id?.toString() ?? '',
      accounting_nama: s.accounting?.nama_user ?? '',
      created_at: s.created_at,
    }));
  }

  async upsertDeptSettings(data: any) {
    const deptId = parseInt(data.departemen_id || data.dept_id);
    const headDeptId = data.head_dept_id || data.head_dept_user_id;
    const accountingId = data.accounting_id || data.accounting_user_id;

    const result = await this.prisma.departmentSettings.upsert({
      where: { departemen_id: deptId },
      create: {
        departemen_id: deptId,
        keterangan: data.keterangan ?? null,
        head_dept_user_id: headDeptId ? parseInt(headDeptId) : null,
        accounting_user_id: accountingId ? parseInt(accountingId) : null,
      },
      update: {
        keterangan: data.keterangan ?? null,
        head_dept_user_id: headDeptId ? parseInt(headDeptId) : null,
        accounting_user_id: accountingId ? parseInt(accountingId) : null,
      },
    });
    return { id: result.id.toString() };
  }

  // ── Portal Access ─────────────────────────────────────────────────────────
  async getPortalAccess() {
    const users = await this.prisma.user.findMany({
      where: { status: 'active' },
      include: {
        role: true,
        departemen: true,
        portalAccess: true,
      },
      orderBy: { nama_user: 'asc' },
    });

    return users.map((u) => {
      const roleName = (u.role?.nama_role ?? '').toLowerCase();
      const isAdm = roleName === 'admin' || (u.username || '').toLowerCase() === 'admin';
      const canAdmin = isAdm || (u.portalAccess?.can_admin === true);

      return {
        user_id: u.id,
        npk: u.npk,
        name: u.nama_user,
        username: u.username,
        department: u.departemen?.nama_departemen ?? '',
        role: u.role?.nama_role ?? '',
        can_capex: u.portalAccess?.can_capex ?? true,
        can_bodr: u.portalAccess?.can_bodr ?? true,
        can_price: u.portalAccess?.can_price ?? true,
        can_admin: canAdmin,
        allowed_portals: [
          ...(u.portalAccess?.can_capex !== false ? ['capex'] : []),
          ...(u.portalAccess?.can_bodr !== false ? ['bodr'] : []),
          ...(u.portalAccess?.can_price !== false ? ['price'] : []),
          ...(canAdmin ? ['admin'] : []),
        ],
      };
    });
  }

  async upsertPortalAccess(data: { user_id: number; can_capex: boolean; can_bodr: boolean; can_price: boolean; can_admin?: boolean }) {
    const userId = Number(data.user_id);
    const canCapex = Boolean(data.can_capex);
    const canBodr = Boolean(data.can_bodr);
    const canPrice = Boolean(data.can_price);
    const canAdmin = Boolean(data.can_admin);

    await this.prisma.userPortalAccess.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        can_capex: canCapex,
        can_bodr: canBodr,
        can_price: canPrice,
        can_admin: canAdmin,
      },
      update: {
        can_capex: canCapex,
        can_bodr: canBodr,
        can_price: canPrice,
        can_admin: canAdmin,
      },
    });
    return { success: true, message: 'Portal access berhasil diperbarui' };
  }
}
