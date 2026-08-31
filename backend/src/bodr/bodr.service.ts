import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── Enum normalizers — DB uses strict enum types ─────────────────────────────
const normalizeLocation = (v: any): string => {
  if (!v) return 'office';
  const s = v.toString().toLowerCase().trim();
  if (s === 'plant') return 'plant';
  return 'office'; // default: office
};

const normalizeCategory = (v: any): string => {
  if (!v) return 'budget';
  const s = v.toString().toLowerCase().trim();
  if (s === 'unbudget') return 'unbudget';
  return 'budget'; // default: budget
};

const normalizeBodrStatus = (v: any): string => {
  // Valid: draft | in_approval | approved | rejected
  if (!v) return 'in_approval';
  const s = v.toString().toLowerCase().trim();
  if (s === 'draft') return 'draft';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  // revision_required, in_approval, pending_review, etc. → in_approval
  return 'in_approval';
};

const normalizeKriteria = (v: any): string => {
  // Valid: CAP | FOH | GOP
  if (!v) return 'FOH';
  const s = v.toString().toUpperCase().trim();
  if (['CAP', 'FOH', 'GOP'].includes(s)) return s;
  return 'FOH'; // default
};

const normalizeApprovalAction = (v: any): string => {
  // Valid: pending | approved | rejected
  if (!v) return 'pending';
  const s = v.toString().toLowerCase().trim();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'pending';
};

@Injectable()
export class BodrService {
  constructor(private readonly prisma: PrismaService) {}

  private formatBodr(b: any) {
    // Find current active approval step's role dynamically from approvals
    const currentApproval = (b.approvals ?? []).find(
      (a: any) => a.step_order === b.current_step
    );
    const activeRole = currentApproval?.approver?.role?.nama_role
      || currentApproval?.approver?.role?.kode_role
      || (b.status === 'approved' ? 'Approved' : b.status === 'draft' ? 'Draft' : 'Pending Review');

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
      step: activeRole,
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
        step_order: a.step_order,
        approver_user_id: a.approver_user_id,
        initials: (a.approver?.nama_user ?? '').substring(0, 2).toUpperCase(),
        role: a.approver?.role?.nama_role || a.approver?.role?.kode_role || '',
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
    const numId = parseInt(id);
    if (isNaN(numId)) {
      throw new NotFoundException(`BODR ${id} tidak ditemukan`);
    }
    const b = await this.prisma.bodr.findUnique({
      where: { id: numId },
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
    // Helper: safe parseInt — returns null if NaN or invalid
    const safeInt = (v: any): number | null => {
      const n = parseInt(v);
      return Number.isFinite(n) ? n : null;
    };

    // 1. Resolve user_id (numeric)
    let userId = safeInt(data.user_id);
    if (!userId) {
      const u = await this.prisma.user.findFirst({
        where: data.proposer
          ? { nama_user: { equals: data.proposer, mode: 'insensitive' } }
          : undefined,
      }).catch(() => null);
      userId = u?.id ?? 1;
    }

    // 2. Resolve departemen_id (numeric) — try direct first, then by name
    let deptId = safeInt(data.departemen_id);
    if (!deptId) {
      const d = await this.prisma.departemen.findFirst({
        where: data.department
          ? {
              OR: [
                { nama_departemen: { equals: data.department, mode: 'insensitive' } },
                { kode_departemen: { equals: data.department, mode: 'insensitive' } },
              ],
            }
          : { status: 'active' },
      }).catch(() => null);
      // If still null, use absolute first departemen in DB
      if (!d) {
        const fallback = await this.prisma.departemen.findFirst().catch(() => null);
        deptId = fallback?.id ?? 1;
      } else {
        deptId = d.id;
      }
    }

    // 3. Resolve cost_center_id (numeric)
    let costCenterId = safeInt(data.cost_center_id);
    if (!costCenterId) {
      const cc = await this.prisma.costCenter.findFirst({
        where: data.cost_center
          ? {
              OR: [
                { kode_cost_center: { equals: data.cost_center, mode: 'insensitive' } },
                { nama_cost_center: { equals: data.cost_center, mode: 'insensitive' } },
              ],
            }
          : { status: 'active' },
      }).catch(() => null);
      if (!cc) {
        const fallback = await this.prisma.costCenter.findFirst().catch(() => null);
        costCenterId = fallback?.id ?? 1;
      } else {
        costCenterId = cc.id;
      }
    }

    // 4. Resolve capex_id (numeric) — may be string code/name or numeric
    const rawCapex = data.capex_id && data.capex_id !== '-' ? data.capex_id : null;
    let capexId = safeInt(rawCapex);
    if (!capexId && rawCapex) {
      const c = await this.prisma.capex.findFirst({
        where: {
          OR: [
            { kode_capex: { equals: rawCapex, mode: 'insensitive' } },
            { nama_capex: { equals: rawCapex, mode: 'insensitive' } },
          ],
        },
      }).catch(() => null);
      if (!c) {
        const fallback = await this.prisma.capex.findFirst().catch(() => null);
        capexId = fallback?.id ?? 1;
      } else {
        capexId = c.id;
      }
    }
    if (!capexId) {
      const fallback = await this.prisma.capex.findFirst().catch(() => null);
      capexId = fallback?.id ?? 1;
    }

    // 1. Fetch DepartmentSettings (head_dept & accounting user) — dikonfigurasi admin
    const deptSettings = await this.prisma.departmentSettings.findUnique({
      where: { departemen_id: deptId },
    }).catch(() => null);

    // 2. Fetch ApprovalWorkflow aktif beserta step-nya — dikonfigurasi admin
    const activeWorkflow = await this.prisma.approvalWorkflow.findFirst({
      where: {
        departemen_id: deptId,
        status: 'active',
      },
      include: {
        steps: { orderBy: { step_order: 'asc' } },
      },
    }).catch(() => null);

    // 3. Bangun combined approvals: [Head Dept] → [Accounting] → [Workflow steps]
    //    100% dinamis dari konfigurasi admin — zero hardcode
    const combinedApprovals: Array<{ step_order: number; approver_user_id: number; status: string }> = [];

    if (deptSettings?.head_dept_user_id) {
      combinedApprovals.push({
        step_order: combinedApprovals.length + 1,
        approver_user_id: deptSettings.head_dept_user_id,
        status: 'pending',
      });
    }

    if (deptSettings?.accounting_user_id) {
      combinedApprovals.push({
        step_order: combinedApprovals.length + 1,
        approver_user_id: deptSettings.accounting_user_id,
        status: 'pending',
      });
    }

    (activeWorkflow?.steps ?? []).forEach((s) => {
      combinedApprovals.push({
        step_order: combinedApprovals.length + 1,
        approver_user_id: s.approver_user_id,
        status: 'pending',
      });
    });

    // Generate BODR number (DB trigger handles it, but we set empty for safety)
    const bodr = await this.prisma.bodr.create({
      data: {
        bodr_no: `BODR/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(Date.now()).slice(-4)}`,
        title: data.title ?? 'Untitled',
        user_id: userId,
        departemen_id: deptId,
        cost_center_id: costCenterId,
        kriteria_approval: normalizeKriteria(data.kriteria_approval ?? data.category),
        start_date: data.start_date ? new Date(data.start_date) : new Date(),
        end_date: data.end_date ? new Date(data.end_date) : new Date(),
        benefit: data.benefit ?? null,
        capex_id: capexId,
        amount: data.amount || 0,
        category: normalizeCategory(data.budget_type ?? data.category_budget ?? data.category),
        budget_remarks: data.budget_remarks ?? null,
        status: 'in_approval',
        current_step: combinedApprovals.length > 0 ? 1 : 0,
        // Seed combined approvals: Head Dept → Accounting → Workflow steps (dari konfigurasi admin)
        ...(combinedApprovals.length > 0
          ? {
              approvals: {
                create: combinedApprovals,
              },
            }
          : {}),
        // Create asset if CAP
        ...(normalizeKriteria(data.kriteria_approval ?? data.category) === 'CAP' && data.nama_asset
          ? {
              asset: {
                create: {
                  nama_asset: data.nama_asset,
                  plant: data.plan ?? '2301',
                  location: normalizeLocation(data.location),
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
    if (capexId) {
      await this.prisma.capex.update({
        where: { id: capexId },
        data: { allocated_amount: { increment: data.amount || 0 } },
      }).catch((err) => console.warn('Could not update capex allocated amount:', err));
    }

    // Insert initial history entry
    await this.prisma.bodrHistory.create({
      data: {
        bodr_id: bodr.id,
        action: 'SUBMITTED',
        actor: bodr.user?.nama_user ?? data.actor ?? 'System',
        actor_role: bodr.user?.role?.nama_role ?? '',
        status_before: null,
        status_after: bodr.status,
        comment: data.title ?? null,
        timestamp: bodr.created_at,
      },
    });

    return this.formatBodr(bodr);
  }

  // ── Update BODR (approval action) ─────────────────────────────────────────
  async update(id: string, data: any) {
    const existing = await this.prisma.bodr.findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new NotFoundException(`BODR ${id} tidak ditemukan`);

    // If approval action
    if (data.approval_action && data.step_order !== undefined && data.approver_user_id) {
      const statusBefore = existing.status;

      await this.prisma.bodrApproval.updateMany({
        where: { bodr_id: parseInt(id), step_order: data.step_order },
        data: {
          status: normalizeApprovalAction(data.approval_action),
          comment: data.comment ?? null,
          action_date: new Date(),
        },
      });

      let statusAfter = existing.status;

      const normalizedAction = normalizeApprovalAction(data.approval_action);
      if (normalizedAction === 'rejected' || data.approval_action === 'rejected') {
        await this.prisma.bodr.update({ where: { id: parseInt(id) }, data: { status: 'rejected' } });
        statusAfter = 'rejected';
      } else if (data.approval_action === 'revision') {
        // revision_required tidak ada di enum DB → set back ke in_approval step 1
        await this.prisma.bodr.update({
          where: { id: parseInt(id) },
          data: { status: 'in_approval', current_step: 1 },
        });
        statusAfter = 'in_approval';
      } else if (normalizedAction === 'approved' || data.approval_action === 'approved') {
        const allApprovals = await this.prisma.bodrApproval.findMany({ where: { bodr_id: parseInt(id) } });
        const allApproved = allApprovals.every((a) => a.status === 'approved');
        if (allApproved && allApprovals.length > 0) {
          const year = new Date().getFullYear();
          const seq = String(Date.now()).slice(-5);
          await this.prisma.bodr.update({
            where: { id: parseInt(id) },
            data: { status: 'approved', bodr_id_final: `BID/${year}/${seq}` },
          });
          statusAfter = 'approved';
        } else {
          await this.prisma.bodr.update({
            where: { id: parseInt(id) },
            data: { status: 'in_approval', current_step: data.step_order + 1 },
          });
          statusAfter = 'in_approval';
        }
      }

      // Fetch approver info for history
      const approverUser = data.approver_user_id
        ? await this.prisma.user.findUnique({
            where: { id: parseInt(data.approver_user_id) },
            include: { role: true },
          })
        : null;

      // Insert approval action into history
      await this.prisma.bodrHistory.create({
        data: {
          bodr_id: parseInt(id),
          action: data.approval_action.toUpperCase(),
          actor: approverUser?.nama_user ?? data.actor ?? 'System',
          actor_role: approverUser?.role?.nama_role ?? '',
          status_before: statusBefore,
          status_after: statusAfter,
          comment: data.comment ?? null,
          timestamp: new Date(),
        },
      });

      return { success: true };
    }

    // General update
    const bodr = await this.prisma.bodr.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        ...(data.status !== undefined && { status: normalizeBodrStatus(data.status) }),
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
    const bodr = await this.prisma.bodr.findUnique({
      where: { id: parseInt(id) },
      include: { user: { include: { role: true } } },
    });
    if (!bodr) throw new NotFoundException(`BODR ${id} tidak ditemukan`);

    // Insert history before delete (cascade will remove it, but record the event)
    await this.prisma.bodrHistory.create({
      data: {
        bodr_id: bodr.id,
        action: 'DELETED',
        actor: bodr.user?.nama_user ?? 'System',
        actor_role: (bodr.user as any)?.role?.nama_role ?? '',
        status_before: bodr.status,
        status_after: 'deleted',
        comment: `BODR ${bodr.bodr_no} dihapus`,
        timestamp: new Date(),
      },
    });

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

    // 4. Fetch all DepartmentSettings (head_dept & accounting per dept) — dikonfigurasi admin
    const allDeptSettings = await this.prisma.departmentSettings.findMany({
      include: {
        headDept: { include: { role: true } },
        accounting: { include: { role: true } },
        departemen: true,
      },
    });
    const deptSettingsMap = new Map(allDeptSettings.map((ds) => [ds.departemen_id, ds]));

    // 5. Helper: bangun combined workflow steps per dept (100% dinamis, zero hardcode)
    //    Urutan: [Head Dept] → [Accounting] → [Workflow Steps]
    const buildCombinedSteps = (deptId: number) => {
      const result: { step_order: number; role: string; user_name: string }[] = [];
      const ds = deptSettingsMap.get(deptId);
      const wf = workflowByDept.get(deptId);

      if (ds?.headDept) {
        result.push({
          step_order: result.length + 1,
          role: ds.headDept.role?.nama_role || ds.headDept.role?.kode_role || 'Head Dept',
          user_name: ds.headDept.nama_user ?? '',
        });
      }
      if (ds?.accounting) {
        result.push({
          step_order: result.length + 1,
          role: ds.accounting.role?.nama_role || ds.accounting.role?.kode_role || 'Accounting',
          user_name: ds.accounting.nama_user ?? '',
        });
      }
      (wf?.steps ?? []).forEach((s) => {
        result.push({
          step_order: result.length + 1,
          role: s.approver?.role?.nama_role || s.approver?.role?.kode_role || s.keterangan || 'Approver',
          user_name: s.approver?.nama_user ?? '',
        });
      });
      return result;
    };

    // 6. Format each BODR proposal with its approval history + combined workflow steps
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
        // Workflow definition for this dept
        workflow_id: wf ? wf.id.toString() : null,
        // Combined steps: Head Dept → Accounting → Workflow steps (dari konfigurasi admin)
        workflow_steps: buildCombinedSteps(b.departemen_id),
      };
    });

    // 7. workflowSummaries: per dept, steps = combined (DeptSettings + Workflow)
    //    Mencakup semua dept yang punya DeptSettings ATAU ApprovalWorkflow
    const allDeptIds = new Set([
      ...allDeptSettings.map((ds) => ds.departemen_id),
      ...workflows.map((w) => w.departemen_id),
    ]);

    const workflowSummaries = [...allDeptIds].map((deptId) => {
      const ds = deptSettingsMap.get(deptId);
      const wf = workflowByDept.get(deptId);
      return {
        departemen_id: deptId.toString(),
        departemen_nama:
          ds?.departemen?.nama_departemen ?? wf?.departemen?.nama_departemen ?? '',
        steps: buildCombinedSteps(deptId),
      };
    });

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

  // ── BODR History ──────────────────────────────────────────────────────────
  async getHistory(bodrId?: string) {
    const where: any = {};
    if (bodrId) where.bodr_id = parseInt(bodrId);

    const records = await this.prisma.bodrHistory.findMany({
      where,
      include: {
        bodr: {
          select: {
            bodr_no: true,
            bodr_id_final: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return records.map((h) => ({
      id: h.id.toString(),
      bodr_id: h.bodr_id.toString(),
      bodr_no: h.bodr?.bodr_no ?? '',
      bodr_id_final: h.bodr?.bodr_id_final ?? null,
      bodr_title: h.bodr?.title ?? '',
      action: h.action,
      actor: h.actor,
      actor_role: h.actor_role ?? '',
      status_before: h.status_before ?? null,
      status_after: h.status_after ?? null,
      comment: h.comment ?? null,
      timestamp: h.timestamp,
      created_at: h.created_at,
    }));
  }
}
