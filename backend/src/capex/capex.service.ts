import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Helper: append batch file list ke JSON history revisi dokumen
function appendToRevisionHistory(existing: string | null, newEntry: string): string {
  try {
    const arr: string[][] = existing ? JSON.parse(existing) : [];
    const newFiles = newEntry.split(', ').map(s => s.trim()).filter(Boolean);
    if (newFiles.length > 0) arr.push(newFiles);
    return JSON.stringify(arr);
  } catch {
    const newFiles = newEntry.split(', ').map(s => s.trim()).filter(Boolean);
    return JSON.stringify(newFiles.length > 0 ? [newFiles] : []);
  }
}

@Injectable()
export class CapexService {
  constructor(private readonly prisma: PrismaService) {}

  private formatProposal(c: any): any {
    const isApproved = [
      'Approved / Archived',
      'Closed',
      'Gate 3 - Procurement',
      'Gate 4 - Commissioning',
      'Gate 5 - Benefit Realization',
      'Gate 6 - Project Closing',
    ].includes(c.status);

    const deptName = c.departemen?.nama_departemen || 'GENERAL';
    const noUrut = String(c.id).padStart(3, '0');
    const generatedCode = `CPX - ${deptName} - ${noUrut}`;
    const capexId = isApproved ? (c.kode_capex && c.kode_capex.startsWith('CPX -') ? c.kode_capex : generatedCode) : '-';

    return {
      id: c.id.toString(),
      capexId: capexId,
      name: c.nama_capex,
      description: c.description ?? '',
      department: c.departemen?.nama_departemen ?? '',
      pic: c.pic ?? '',
      estimatedCost: parseFloat(c.total_amount ?? 0),
      createdAt: c.created_at,
      gateStatus: c.status,
      isFsRequired: c.is_fs_required,
      fsCategory: c.fs_category,
      financeNotes: c.finance_notes,
      financeApprovedAt: c.finance_approved_at,
      committeeNotes: c.committee_notes,
      committeeApprovedAt: c.committee_approved_at,
      poNumber: c.po_number,
      poDate: c.po_date,
      commissioningDocName: c.commissioning_doc_name,
      commissioningNotes: c.commissioning_notes,
      commissioningApprovedAt: c.commissioning_approved_at,
      benefitTarget: c.benefit_target ? parseFloat(c.benefit_target) : null,
      benefitRealized: c.benefit_realized ? parseFloat(c.benefit_realized) : null,
      benefitNotes: c.benefit_notes,
      pirNotes: c.pir_notes,
      pirClosedAt: c.pir_closed_at,
      purpose: c.purpose,
      investmentType: c.investment_type,
      startDate: c.start_date,
      endDate: c.end_date,
      attachmentName: c.attachment_name,
      initialAttachmentName: c.initial_attachment_name || c.attachment_name,
      revisedAttachmentName: c.revised_attachment_name,
      revisedAttachmentHistory: c.revised_attachment_history ?? null,
      committeeReviewSchedule: c.committee_review_schedule,
      revisionSource: c.revision_source,
      history: (c.capexHistory ?? []).map((h: any) => ({
        gate: h.gate,
        action: h.action,
        actor: h.actor,
        timestamp: h.timestamp instanceof Date ? h.timestamp.toISOString() : (h.timestamp ?? ''),
        notes: h.notes ?? undefined,
      })),
    };
  }

  private formatCapexItem(c: any): any {
    const amountBodr = parseFloat(c.allocated_amount ?? 0);
    const budget = parseFloat(c.total_amount ?? 0);
    const available = budget - amountBodr;
    return {
      id: c.id.toString(),
      name: c.nama_capex,
      department: c.departemen?.nama_departemen ?? '',
      tahun: c.created_at ? new Date(c.created_at).getFullYear().toString() : '',
      budget,
      amount_bodr: amountBodr,
      available,
      capex_type: c.capexType?.nama_type ?? '',
      reference: c.capexReference?.nama ?? '',
      remark: c.description ?? '',
      status: c.status,
      created_at: c.created_at,
    };
  }

  async getProposals() {
    const records = await this.prisma.capex.findMany({
      include: { departemen: true, capexType: true, capexReference: true, capexHistory: { orderBy: { timestamp: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
    return records.map((c) => this.formatProposal(c));
  }

  async addProposal(data: any) {
    let departemenId = data.departemen_id ? parseInt(data.departemen_id) : null;
    if (!departemenId && data.department) {
      const allDepts = await this.prisma.departemen.findMany();
      const target = data.department.toLowerCase().trim();
      const found = allDepts.find((d) => {
        const dName = d.nama_departemen.toLowerCase().trim();
        return dName === target || dName.includes(target) || target.includes(dName);
      });
      if (found) departemenId = found.id;
    }
    if (!departemenId && data.pic) {
      const u = await this.prisma.user.findFirst({
        where: { OR: [{ nama_user: data.pic }, { username: data.pic }] },
      });
      if (u?.departemen_id) departemenId = u.departemen_id;
    }

    const record = await this.prisma.capex.create({
      data: {
        kode_capex: data.kode_capex ?? `CAPEX-${Date.now()}`,
        nama_capex: data.name,
        description: data.description ?? null,
        departemen_id: departemenId,
        total_amount: data.estimatedCost ?? data.total_amount ?? 0,
        pic: data.pic ?? null,
        status: 'Gate 0 - Idea',
        purpose: data.purpose ?? null,
        investment_type: data.investmentType ?? null,
        start_date: data.startDate ?? null,
        end_date: data.endDate ?? null,
        attachment_name: data.attachmentName ?? null,
        initial_attachment_name: data.initialAttachmentName ?? data.attachmentName ?? null,
        revised_attachment_name: data.revisedAttachmentName ?? null,
      },
      include: { departemen: true, capexType: true, capexReference: true, capexHistory: { orderBy: { timestamp: 'asc' } } },
    });

    const initialActor = data.actor || data.pic || 'Staff User';
    await this.prisma.capexHistory.create({
      data: {
        capex_id: record.id,
        gate: 0,
        action: 'SUBMITTED',
        actor: initialActor,
        timestamp: new Date(),
        notes: data.description ?? 'Pengajuan usulan CAPEX baru',
      },
    });

    const fullRecord = await this.prisma.capex.findFirst({
      where: { id: record.id },
      include: { departemen: true, capexType: true, capexReference: true, capexHistory: { orderBy: { timestamp: 'asc' } } },
    });
    return this.formatProposal(fullRecord || record);
  }

  async updateProposal(id: string, data: any) {
    const match = id.match(/(\d+)$/);
    const numId = match ? parseInt(match[1]) : parseInt(id);
    const existing = await this.prisma.capex.findFirst({
      where: {
        OR: [
          { id: !isNaN(numId) ? numId : -1 },
          { kode_capex: id },
        ],
      },
      include: { departemen: true },
    });
    if (!existing) throw new NotFoundException(`Capex ${id} tidak ditemukan`);

    let departemenId = data.departemen_id !== undefined ? (data.departemen_id ? parseInt(data.departemen_id) : null) : undefined;
    if (departemenId === undefined && data.department) {
      const allDepts = await this.prisma.departemen.findMany();
      const target = data.department.toLowerCase().trim();
      const found = allDepts.find((d) => {
        const dName = d.nama_departemen.toLowerCase().trim();
        return dName === target || dName.includes(target) || target.includes(dName);
      });
      if (found) departemenId = found.id;
    }

    const newStatus = data.gateStatus ?? data.status;
    const isApprovedNow = [
      'Approved / Archived',
      'Closed',
      'Gate 3 - Procurement',
    ].includes(newStatus);

    let kodeCapexToUpdate: string | undefined = undefined;
    if (isApprovedNow) {
      const deptName = existing.departemen?.nama_departemen || data.department || 'GENERAL';
      const noUrut = String(existing.id).padStart(3, '0');
      kodeCapexToUpdate = `CPX - ${deptName} - ${noUrut}`;
    }

    const record = await this.prisma.capex.update({
      where: { id: existing.id },
      data: {
        kode_capex: kodeCapexToUpdate,
        nama_capex: data.name,
        description: data.description,
        departemen_id: departemenId,
        total_amount: data.estimatedCost !== undefined ? data.estimatedCost : undefined,
        pic: data.pic,
        purpose: data.purpose,
        investment_type: data.investmentType,
        start_date: data.startDate,
        end_date: data.endDate,
        attachment_name: data.attachmentName !== undefined ? data.attachmentName : undefined,
        initial_attachment_name: data.initialAttachmentName !== undefined ? data.initialAttachmentName : (existing.initial_attachment_name || existing.attachment_name),
        revised_attachment_name: data.revisedAttachmentName !== undefined ? data.revisedAttachmentName : undefined,
        // Append ke history revisi jika ada dokumen revisi baru — tidak pernah ditimpa
        revised_attachment_history: data.revisedAttachmentName !== undefined
          ? appendToRevisionHistory(existing.revised_attachment_history as string | null, data.revisedAttachmentName)
          : undefined,
        status: newStatus,
        is_fs_required: data.isFsRequired,
        fs_category: data.fsCategory,
        finance_notes: data.financeNotes,
        finance_approved_at: data.financeApprovedAt ? new Date(data.financeApprovedAt) : undefined,
        committee_notes: data.committeeNotes,
        committee_approved_at: data.committeeApprovedAt ? new Date(data.committeeApprovedAt) : undefined,
        committee_review_schedule: data.committeeReviewSchedule,
        revision_source: data.revisionSource,
        po_number: data.poNumber,
        po_date: data.poDate,
        commissioning_doc_name: data.commissioningDocName,
        commissioning_notes: data.commissioningNotes,
        benefit_target: data.benefitTarget,
        benefit_realized: data.benefitRealized,
        benefit_notes: data.benefitNotes,
        pir_notes: data.pirNotes,
        pir_closed_at: data.pirClosedAt ? new Date(data.pirClosedAt) : undefined,
      },
    });

    // Simpan entry history baru jika dikirim dari frontend
    if (Array.isArray(data.history) && data.history.length > 0) {
      const latestEntry = data.history[data.history.length - 1];
      await this.prisma.capexHistory.create({
        data: {
          capex_id: existing.id,
          gate: latestEntry.gate ?? 0,
          action: latestEntry.action ?? '',
          actor: latestEntry.actor ?? '',
          timestamp: latestEntry.timestamp ? new Date(latestEntry.timestamp) : new Date(),
          notes: latestEntry.notes ?? null,
        },
      });
    }

    // Ambil ulang data lengkap SETELAH history tersimpan agar response termasuk history terbaru
    const updatedRecord = await this.prisma.capex.findFirst({
      where: { id: existing.id },
      include: { departemen: true, capexType: true, capexReference: true, capexHistory: { orderBy: { timestamp: 'asc' } } },
    });
    return this.formatProposal(updatedRecord);
  }


  async deleteProposal(id: string) {
    const match = id.match(/(\d+)$/);
    const numId = match ? parseInt(match[1]) : parseInt(id);
    const existing = await this.prisma.capex.findFirst({
      where: {
        OR: [
          { id: !isNaN(numId) ? numId : -1 },
          { kode_capex: id },
        ],
      },
    });
    if (!existing) throw new NotFoundException(`Capex ${id} tidak ditemukan`);
    await this.prisma.capex.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async getCapexItems() {
    const records = await this.prisma.capex.findMany({
      include: { departemen: true, capexType: true, capexReference: true },
      orderBy: { created_at: 'desc' },
    });
    return records.map((c) => this.formatCapexItem(c));
  }

  async syncFromBodr() {
    // Recalculate allocated_amount from approved BODR
    const capexList = await this.prisma.capex.findMany();
    for (const capex of capexList) {
      const agg = await this.prisma.bodr.aggregate({
        where: { capex_id: capex.id, status: { in: ['in_approval', 'approved'] } },
        _sum: { amount: true },
      });
      const allocated = agg._sum.amount ?? 0;
      await this.prisma.capex.update({
        where: { id: capex.id },
        data: { allocated_amount: allocated },
      });
    }
    return { success: true, message: 'Sync BODR ke Capex berhasil' };
  }
}
