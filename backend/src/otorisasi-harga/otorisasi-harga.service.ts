import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtorisasiHargaService {
  constructor(private readonly prisma: PrismaService) {}

  private formatRecord(r: any) {
    return {
      id: r.id.toString(),
      no_doc: r.no_doc,
      no_pr: r.no_pr ?? '',
      bodr_id: r.bodr_id?.toString(),
      bodr_no: r.bodr?.bodr_no ?? '',
      buyer_id: r.buyer_user_id?.toString(),
      buyer: r.buyer?.nama_user ?? '',
      product: r.jenisOtorisasi?.nama ?? '',
      jenis: r.jenis,
      jenis_otorisasi_id: r.jenis_otorisasi_id,
      jenis_otorisasi: r.jenisOtorisasi?.nama ?? '',
      dana_bodr: r.dana_bodr ? parseFloat(r.dana_bodr) : 0,
      tanggal: r.tanggal,
      date: r.tanggal,
      current_step: r.current_step,
      step: `Step ${r.current_step}`,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      approval_history: (r.approvals ?? []).map((a: any) => ({
        role: a.approver?.role?.nama_role ?? '',
        name: a.approver?.nama_user ?? '',
        status: a.status,
        timestamp: a.action_date ?? a.created_at,
        note: a.comment,
      })),
    };
  }

  async findAll() {
    const records = await this.prisma.otorisasiHarga.findMany({
      include: {
        buyer: { include: { role: true } },
        bodr: true,
        jenisOtorisasi: true,
        suppliers: { include: { vendor: true, items: true } },
        approvals: { include: { approver: { include: { role: true } } }, orderBy: { step_order: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
    return records.map((r) => this.formatRecord(r));
  }

  async create(data: any) {
    const record = await this.prisma.otorisasiHarga.create({
      data: {
        no_doc: data.no_doc,
        jenis: data.jenis ?? 'non_product',
        no_pr: data.no_pr ?? null,
        bodr_id: data.bodr_id ? parseInt(data.bodr_id) : null,
        tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
        buyer_user_id: parseInt(data.buyer_id ?? data.buyer_user_id),
        jenis_otorisasi_id: data.jenis_otorisasi_id ? parseInt(data.jenis_otorisasi_id) : null,
        status: 'Pending Review',
        current_step: 1,
      },
    });

    // Fetch buyer info for history
    const buyer = await this.prisma.user.findUnique({
      where: { id: parseInt(data.buyer_id ?? data.buyer_user_id) },
      include: { role: true },
    });

    // Insert initial history entry
    await this.prisma.otorisasiHargaHistory.create({
      data: {
        otorisasi_harga_id: record.id,
        action: 'SUBMITTED',
        actor: buyer?.nama_user ?? data.actor ?? 'System',
        actor_role: buyer?.role?.nama_role ?? 'Buyer',
        status_before: null,
        status_after: 'Pending Review',
        comment: data.no_doc ?? null,
        timestamp: record.created_at,
      },
    });

    return { id: record.id.toString() };
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.otorisasiHarga.findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new NotFoundException(`Otorisasi Harga ${id} tidak ditemukan`);

    // Approval action
    if (data.approval_action && data.step_order !== undefined) {
      const statusBefore = existing.status;

      await this.prisma.approvalHarga.updateMany({
        where: { otorisasi_harga_id: parseInt(id), step_order: data.step_order },
        data: {
          status: data.approval_action,
          comment: data.comment ?? null,
          action_date: new Date(),
        },
      });

      let statusAfter = existing.status;

      if (data.approval_action === 'rejected') {
        await this.prisma.otorisasiHarga.update({ where: { id: parseInt(id) }, data: { status: 'rejected' } });
        statusAfter = 'rejected';
      } else if (data.approval_action === 'approved') {
        const allApprovals = await this.prisma.approvalHarga.findMany({ where: { otorisasi_harga_id: parseInt(id) } });
        const allApproved = allApprovals.every((a) => a.status === 'approved');
        if (allApproved && allApprovals.length > 0) {
          await this.prisma.otorisasiHarga.update({ where: { id: parseInt(id) }, data: { status: 'approved' } });
          statusAfter = 'approved';
        } else {
          await this.prisma.otorisasiHarga.update({
            where: { id: parseInt(id) },
            data: { status: 'in_approval', current_step: data.step_order },
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
      await this.prisma.otorisasiHargaHistory.create({
        data: {
          otorisasi_harga_id: parseInt(id),
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

    const record = await this.prisma.otorisasiHarga.update({
      where: { id: parseInt(id) },
      data: { status: data.status, current_step: data.current_step },
    });
    return { id: record.id.toString() };
  }

  async remove(id: string) {
    const existing = await this.prisma.otorisasiHarga.findUnique({
      where: { id: parseInt(id) },
      include: { buyer: { include: { role: true } } },
    });
    if (!existing) throw new NotFoundException(`Otorisasi Harga ${id} tidak ditemukan`);

    // Insert history before delete
    await this.prisma.otorisasiHargaHistory.create({
      data: {
        otorisasi_harga_id: existing.id,
        action: 'DELETED',
        actor: (existing as any).buyer?.nama_user ?? 'System',
        actor_role: (existing as any).buyer?.role?.nama_role ?? '',
        status_before: existing.status,
        status_after: 'deleted',
        comment: `Dokumen ${existing.no_doc} dihapus`,
        timestamp: new Date(),
      },
    });

    await this.prisma.otorisasiHarga.delete({ where: { id: parseInt(id) } });
    return { success: true };
  }

  // ── Otorisasi Harga History ───────────────────────────────────────────────────
  async getHistory(ohId?: string) {
    const where: any = {};
    if (ohId) where.otorisasi_harga_id = parseInt(ohId);

    const records = await this.prisma.otorisasiHargaHistory.findMany({
      where,
      include: {
        otorisasiHarga: {
          select: {
            no_doc: true,
            no_pr: true,
            jenis: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return records.map((h) => ({
      id: h.id.toString(),
      otorisasi_harga_id: h.otorisasi_harga_id.toString(),
      no_doc: h.otorisasiHarga?.no_doc ?? '',
      no_pr: h.otorisasiHarga?.no_pr ?? '',
      jenis: h.otorisasiHarga?.jenis ?? '',
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
