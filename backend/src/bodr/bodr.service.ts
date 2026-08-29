import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BodrService {
  constructor(private readonly prisma: PrismaService) {}

  private formatBodr(b: any) {
    return {
      id: b.id.toString(),
      bodr_no: b.bodr_no,
      bodr_id_final: b.bodr_id_final ?? null,
      title: b.title,
      proposer: b.user?.nama_user ?? '',
      department: b.departemen?.nama_departemen ?? '',
      category: b.kriteria_approval,
      budget_type: b.category,
      cost_center: b.costCenter?.kode_cost_center ?? '',
      capex_id: b.capex_id?.toString(),
      amount: b.amount ? parseFloat(b.amount) : 0,
      benefit: b.benefit ?? '',
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
      step: `Step ${b.current_step}`,
      date: b.created_at,
      created_at: b.created_at,
      // Asset (only for CAP)
      nama_asset: b.asset?.nama_asset ?? '',
      plan: b.asset?.plant ?? '',
      location: b.asset?.location ?? '',
      asset_type: b.asset?.assetType?.nama_type ?? '',
      no_asset: b.asset?.nama_asset ?? '',
      // Approval history
      approval_history: (b.approvals ?? []).map((a: any) => ({
        initials: (a.approver?.nama_user ?? '').substring(0, 2).toUpperCase(),
        role: a.approver?.role?.nama_role ?? '',
        name: a.approver?.nama_user ?? '',
        status: a.status,
        timestamp: a.action_date ?? a.created_at,
        note: a.comment,
      })),
      // Documents
      documents: (b.documents ?? []).map((d: any) => d.file_path),
    };
  }

  // ── List BODR ─────────────────────────────────────────────────────────────
  async findAll(query?: { user_id?: string; status?: string }) {
    const where: any = {};
    if (query?.user_id) where.user_id = parseInt(query.user_id);
    if (query?.status) where.status = query.status;

    const list = await this.prisma.bodr.findMany({
      where,
      include: {
        user: { include: { role: true } },
        departemen: true,
        costCenter: true,
        capex: true,
        asset: { include: { assetType: true } },
        approvals: { include: { approver: { include: { role: true } } }, orderBy: { step_order: 'asc' } },
        documents: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return list.map((b) => this.formatBodr(b));
  }

  // ── Get one BODR ──────────────────────────────────────────────────────────
  async findOne(id: string) {
    const b = await this.prisma.bodr.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { include: { role: true } },
        departemen: true,
        costCenter: true,
        capex: true,
        asset: { include: { assetType: true } },
        approvals: { include: { approver: { include: { role: true } } }, orderBy: { step_order: 'asc' } },
        documents: true,
      },
    });
    if (!b) throw new NotFoundException(`BODR ${id} tidak ditemukan`);
    return this.formatBodr(b);
  }

  // ── Create BODR ───────────────────────────────────────────────────────────
  async create(data: any) {
    if (!data.user_id || !data.capex_id || !data.cost_center_id) {
      throw new BadRequestException('user_id, capex_id, cost_center_id wajib diisi');
    }

    const deptId = parseInt(data.departemen_id);

    // Look up active ApprovalWorkflow for this department to seed initial approvals
    const activeWorkflow = await this.prisma.approvalWorkflow.findFirst({
      where: {
        departemen_id: deptId,
        status: 'active',
      },
      include: {
        steps: { orderBy: { step_order: 'asc' } },
      },
    });

    const initialApprovals = (activeWorkflow?.steps || []).map((s) => ({
      step_order: s.step_order,
      approver_user_id: s.approver_user_id,
      status: 'pending',
    }));

    // Generate BODR number (DB trigger handles it, but we set empty for safety)
    const bodr = await this.prisma.bodr.create({
      data: {
        bodr_no: `BODR/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(Date.now()).slice(-4)}`,
        title: data.title ?? 'Untitled',
        user_id: parseInt(data.user_id),
        departemen_id: deptId,
        cost_center_id: parseInt(data.cost_center_id),
        kriteria_approval: data.kriteria_approval ?? data.category,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        benefit: data.benefit ?? null,
        capex_id: parseInt(data.capex_id),
        amount: data.amount,
        category: data.budget_type ?? data.category_budget ?? 'budget',
        budget_remarks: data.budget_remarks ?? null,
        status: data.status ?? 'in_approval',
        current_step: initialApprovals.length > 0 ? 1 : 0,
        // Seed initial approvals from department's active workflow
        ...(initialApprovals.length > 0
          ? {
              approvals: {
                create: initialApprovals,
              },
            }
          : {}),
        // Create asset if CAP
        ...(data.kriteria_approval === 'CAP' && data.nama_asset
          ? {
              asset: {
                create: {
                  nama_asset: data.nama_asset,
                  plant: data.plan ?? '2301',
                  location: data.location ?? 'office',
                  asset_type_id: data.asset_type_id ? parseInt(data.asset_type_id) : null,
                },
              },
            }
          : {}),
      },
      include: {
        user: { include: { role: true } },
        departemen: true,
        costCenter: true,
        capex: true,
        asset: { include: { assetType: true } },
        approvals: {
          include: { approver: { include: { role: true } } },
          orderBy: { step_order: 'asc' },
        },
        documents: true,
      },
    });

    // Allocate capex amount
    await this.prisma.capex.update({
      where: { id: parseInt(data.capex_id) },
      data: { allocated_amount: { increment: data.amount } },
    });

    return this.formatBodr(bodr);
  }

  // ── Update BODR (approval action) ─────────────────────────────────────────
  async update(id: string, data: any) {
    const existing = await this.prisma.bodr.findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new NotFoundException(`BODR ${id} tidak ditemukan`);

    // If approval action
    if (data.approval_action && data.step_order !== undefined && data.approver_user_id) {
      await this.prisma.bodrApproval.updateMany({
        where: { bodr_id: parseInt(id), step_order: data.step_order },
        data: {
          status: data.approval_action,
          comment: data.comment ?? null,
          action_date: new Date(),
        },
      });

      if (data.approval_action === 'rejected') {
        await this.prisma.bodr.update({ where: { id: parseInt(id) }, data: { status: 'rejected' } });
      } else if (data.approval_action === 'approved') {
        const allApprovals = await this.prisma.bodrApproval.findMany({ where: { bodr_id: parseInt(id) } });
        const allApproved = allApprovals.every((a) => a.status === 'approved');
        if (allApproved && allApprovals.length > 0) {
          const year = new Date().getFullYear();
          const seq = String(Date.now()).slice(-5);
          await this.prisma.bodr.update({
            where: { id: parseInt(id) },
            data: { status: 'approved', bodr_id_final: `BID/${year}/${seq}` },
          });
        } else {
          await this.prisma.bodr.update({
            where: { id: parseInt(id) },
            data: { status: 'in_approval', current_step: data.step_order },
          });
        }
      }

      return { success: true };
    }

    // General update
    const bodr = await this.prisma.bodr.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        status: data.status,
        benefit: data.benefit,
        budget_remarks: data.budget_remarks,
      },
      include: {
        user: { include: { role: true } },
        departemen: true,
        costCenter: true,
        capex: true,
        asset: { include: { assetType: true } },
        approvals: true,
        documents: true,
      },
    });
    return this.formatBodr(bodr);
  }

  // ── Delete BODR ───────────────────────────────────────────────────────────
  async remove(id: string) {
    const bodr = await this.prisma.bodr.findUnique({ where: { id: parseInt(id) } });
    if (!bodr) throw new NotFoundException(`BODR ${id} tidak ditemukan`);
    if (bodr.status !== 'draft') throw new BadRequestException('Hanya BODR dengan status draft yang bisa dihapus');

    // Release capex allocation
    await this.prisma.capex.update({
      where: { id: bodr.capex_id },
      data: { allocated_amount: { decrement: bodr.amount } },
    });

    await this.prisma.bodr.delete({ where: { id: parseInt(id) } });
    return { success: true };
  }

  // ── BODR Stats (for dashboard) ────────────────────────────────────────────
  async getStats(userId?: string) {
    const where: any = userId ? { user_id: parseInt(userId) } : {};
    const total = await this.prisma.bodr.count({ where });
    const pending = await this.prisma.bodr.count({ where: { ...where, status: 'in_approval' } });
    const approved = await this.prisma.bodr.count({ where: { ...where, status: 'approved' } });
    const rejected = await this.prisma.bodr.count({ where: { ...where, status: 'rejected' } });

    const capexActual = await this.prisma.bodr.aggregate({
      where: { ...where, status: 'approved' },
      _sum: { amount: true },
    });
    const capexBudget = await this.prisma.capex.aggregate({ _sum: { total_amount: true } });

    return {
      total_bodr: total,
      pending_approval: pending,
      approved,
      rejected,
      capex_actual: capexActual._sum.amount ? parseFloat(capexActual._sum.amount.toString()) : 0,
      capex_budget: capexBudget._sum.total_amount ? parseFloat(capexBudget._sum.total_amount.toString()) : 0,
    };
  }

  // ── BODR Progress ─────────────────────────────────────────────────────────
  async getProgress() {
    // 1. Fetch all BODR proposals with their approval records + dept info
    const bodrs = await this.prisma.bodr.findMany({
      include: {
        user: { include: { role: true } },
        departemen: true,
        approvals: {
          include: { approver: { include: { role: true } } },
          orderBy: { step_order: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 2. Fetch all active approval workflows with their ordered steps
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { status: 'active' },
      include: {
        departemen: true,
        steps: {
          include: { approver: { include: { role: true } } },
          orderBy: { step_order: 'asc' },
        },
      },
    });

    // 3. Build lookup map: departemen_id → workflow
    const workflowByDept = new Map(workflows.map((w) => [w.departemen_id, w]));

    // 4. Format each BODR proposal with its approval history + matching workflow steps
    const proposals = bodrs.map((b) => {
      const wf = workflowByDept.get(b.departemen_id) ?? null;
      return {
        id: b.id.toString(),
        bodr_no: b.bodr_no,
        title: b.title,
        category: b.kriteria_approval,
        department: b.departemen?.nama_departemen ?? '',
        proposer: b.user?.nama_user ?? '',
        amount: b.amount ? parseFloat(b.amount.toString()) : 0,
        status: b.status,
        current_step: b.current_step,
        created_at: b.created_at,
        notes: b.budget_remarks ?? '',
        benefit: b.benefit ?? '',
        // Approval records from DB (ordered by step_order asc)
        approval_history: b.approvals.map((a) => ({
          step_order: a.step_order,
          role: a.approver?.role?.nama_role ?? '',
          name: a.approver?.nama_user ?? '',
          initials: (a.approver?.nama_user ?? '').substring(0, 2).toUpperCase(),
          status: a.status,
          timestamp: (a.action_date ?? a.created_at).toISOString(),
          note: a.comment ?? '',
        })),
        // Workflow definition for this dept (null if dept has no active workflow)
        workflow_id: wf ? wf.id.toString() : null,
        workflow_steps: wf
          ? wf.steps.map((s) => ({
              step_order: s.step_order,
              role: s.approver?.role?.nama_role ?? '',
              user_name: s.approver?.nama_user ?? '',
            }))
          : [],
      };
    });

    // 5. Also return global workflow list for phase label derivation on frontend
    const workflowSummaries = workflows.map((w) => ({
      departemen_id: w.departemen_id.toString(),
      departemen_nama: w.departemen?.nama_departemen ?? '',
      steps: w.steps.map((s) => ({
        step_order: s.step_order,
        role: s.approver?.role?.nama_role ?? '',
        user_name: s.approver?.nama_user ?? '',
      })),
    }));

    return { proposals, workflows: workflowSummaries };
  }

  // ── BODR Dashboard ────────────────────────────────────────────────────────
  async getDashboard(userId?: string) {
    const stats = await this.getStats(userId);

    // Chart per kriteria
    const byKriteria = await this.prisma.bodr.groupBy({
      by: ['kriteria_approval'],
      _count: { id: true },
    });

    // Chart per bulan
    const allBodr = await this.prisma.bodr.findMany({
      select: { created_at: true, kriteria_approval: true },
      orderBy: { created_at: 'asc' },
    });
    const perBulan: Record<string, number> = {};
    allBodr.forEach((b) => {
      const key = `${b.created_at.getFullYear()}-${String(b.created_at.getMonth() + 1).padStart(2, '0')}`;
      perBulan[key] = (perBulan[key] ?? 0) + 1;
    });

    return {
      ...stats,
      by_kriteria: byKriteria.map((k) => ({ kriteria: k.kriteria_approval, count: k._count.id })),
      per_bulan: Object.entries(perBulan).map(([bulan, count]) => ({ bulan, count })),
    };
  }

  // ── Request Otorisasi Harga ───────────────────────────────────────────────
  async requestOtorisasiHarga(data: { bodr_id: number; no_pr: string; deskripsi: string; amount: number }) {
    const record = await this.prisma.otorisasiHargaRequest.create({
      data: {
        bodr_id: data.bodr_id,
        no_pr: data.no_pr,
        deskripsi: data.deskripsi ?? null,
        amount: data.amount,
        status: 'submitted',
      },
    });
    const { id: _id, ...rest } = record;
    return { id: record.id.toString(), ...rest };
  }
}
