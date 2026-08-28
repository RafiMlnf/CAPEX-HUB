import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Entity routing ────────────────────────────────────────────────────────
  private getConfig(entity: string) {
    const map: Record<string, { model: any; fields: Record<string, any>; format: (r: any) => any }> = {
      departemens: {
        model: this.prisma.departemen,
        fields: { kode_departemen: true, nama_departemen: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_departemen, nama: r.nama_departemen, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      roles: {
        model: this.prisma.role,
        fields: { kode_role: true, nama_role: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_role, nama: r.nama_role, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      permissions: {
        model: this.prisma.permission,
        fields: { kode_permission: true, nama_permission: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_permission, nama: r.nama_permission, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'type-approvals': {
        model: this.prisma.typeApproval,
        fields: { kode_approval: true, nama_approval: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_approval, nama: r.nama_approval, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'cost-centers': {
        model: this.prisma.costCenter,
        fields: { kode_cost_center: true, nama_cost_center: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_cost_center, nama: r.nama_cost_center, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'capex-types': {
        model: this.prisma.capexType,
        fields: { kode_type: true, nama_type: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_type, nama: r.nama_type, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'capex-references': {
        model: this.prisma.capexReference,
        fields: { kode_reference: true, nama: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_reference, nama: r.nama, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'asset-types': {
        model: this.prisma.assetType,
        fields: { class: true, nama_type: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), class: r.class, nama_type: r.nama_type, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      vendors: {
        model: this.prisma.vendor,
        fields: { kode_vendor: true, email_vendor: true, vendor_name: true, street: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode_vendor, kode_vendor: r.kode_vendor, email: r.email_vendor, email_vendor: r.email_vendor, nama: r.vendor_name, vendor_name: r.vendor_name, street: r.street, status: r.status, created_at: r.created_at }),
      },
      'part-numbers': {
        model: this.prisma.partNumber,
        fields: { name_material: true, deskripsi_material: true, satuan: true, status: true },
        format: (r) => ({ id: r.id.toString(), nama_material: r.name_material, deskripsi_material: r.deskripsi_material, satuan: r.satuan, status: r.status, created_at: r.created_at }),
      },
      'jenis-otorisasi': {
        model: this.prisma.jenisOtorisasi,
        fields: { kode: true, nama: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode, nama: r.nama, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
      'jenis-barang': {
        model: this.prisma.jenisBarang,
        fields: { kode: true, nama: true, deskripsi: true, status: true },
        format: (r) => ({ id: r.id.toString(), kode: r.kode, nama: r.nama, deskripsi: r.deskripsi, status: r.status, created_at: r.created_at }),
      },
    };
    const cfg = map[entity];
    if (!cfg) throw new BadRequestException(`Entity '${entity}' tidak dikenal`);
    return cfg;
  }

  private mapInputToDb(entity: string, data: any): any {
    const mappings: Record<string, Record<string, string>> = {
      departemens: { kode: 'kode_departemen', nama: 'nama_departemen' },
      roles: { kode: 'kode_role', nama: 'nama_role' },
      permissions: { kode: 'kode_permission', nama: 'nama_permission' },
      'type-approvals': { kode: 'kode_approval', nama: 'nama_approval' },
      'cost-centers': { kode: 'kode_cost_center', nama: 'nama_cost_center' },
      'capex-types': { kode: 'kode_type', nama: 'nama_type' },
      'capex-references': { kode: 'kode_reference' },
      'asset-types': {},
      vendors: { kode: 'kode_vendor', email: 'email_vendor', nama: 'vendor_name' },
      'part-numbers': { nama_material: 'name_material' },
      'jenis-otorisasi': {},
      'jenis-barang': {},
    };
    const m = mappings[entity] ?? {};
    const result: any = { ...data };
    for (const [from, to] of Object.entries(m)) {
      if (result[from] !== undefined) {
        result[to] = result[from];
        delete result[from];
      }
    }
    return result;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async findAll(entity: string) {
    const { model, format } = this.getConfig(entity);
    const records = await (model as any).findMany({ orderBy: { created_at: 'desc' } });
    return records.map(format);
  }

  async create(entity: string, data: any) {
    const { model, format } = this.getConfig(entity);
    const dbData = this.mapInputToDb(entity, data);
    try {
      const record = await (model as any).create({ data: dbData });
      return format(record);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Data gagal disimpan: Kode atau nilai unik sudah terdaftar (duplikat). Silakan gunakan kode lain.`,
        );
      }
      throw err;
    }
  }

  async update(entity: string, id: string, data: any) {
    const { model, format } = this.getConfig(entity);
    const existing = await (model as any).findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new NotFoundException(`Record ${id} tidak ditemukan`);
    const dbData = this.mapInputToDb(entity, data);
    try {
      const record = await (model as any).update({ where: { id: parseInt(id) }, data: dbData });
      return format(record);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Data gagal diperbarui: Kode atau nilai unik sudah terdaftar pada data lain. Silakan gunakan kode yang berbeda.`,
        );
      }
      throw err;
    }
  }

  async remove(entity: string, id: string) {
    const { model } = this.getConfig(entity);
    const existing = await (model as any).findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new NotFoundException(`Record ${id} tidak ditemukan`);
    await (model as any).delete({ where: { id: parseInt(id) } });
    return { success: true };
  }

  // ── Otorisasi Harga Non-Product (special) ────────────────────────────────
  async getOtorisasiHargaNP(id?: string) {
    if (id) {
      const record = await this.prisma.otorisasiHarga.findUnique({
        where: { id: parseInt(id) },
        include: {
          buyer: true,
          bodr: true,
          jenisOtorisasi: true,
          suppliers: { include: { vendor: true, items: true } },
          approvals: { include: { approver: true }, orderBy: { step_order: 'asc' } },
        },
      });
      if (!record) throw new NotFoundException(`Otorisasi Harga ${id} tidak ditemukan`);
      return this.formatOtorisasiHarga(record);
    }
    const records = await this.prisma.otorisasiHarga.findMany({
      where: { jenis: 'non_product' },
      include: {
        buyer: true,
        bodr: true,
        jenisOtorisasi: true,
        suppliers: { include: { vendor: true, items: true } },
        approvals: { include: { approver: true }, orderBy: { step_order: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
    return records.map((r) => this.formatOtorisasiHarga(r));
  }

  private formatOtorisasiHarga(r: any) {
    return {
      id: r.id.toString(),
      no_doc: r.no_doc,
      no_pr: r.no_pr,
      no_bodr: r.bodr?.bodr_no ?? '',
      dana_bodr: r.dana_bodr ? parseFloat(r.dana_bodr) : 0,
      tanggal: r.tanggal,
      bodr_id: r.bodr_id?.toString(),
      buyer_id: r.buyer_user_id?.toString(),
      buyer_nama: r.buyer?.nama_user ?? '',
      suppliers: (r.suppliers ?? []).map((s: any) => ({
        vendor_id: s.vendor_id.toString(),
        vendor_nama: s.vendor?.vendor_name ?? '',
        quality_factor: s.quality_factor,
        delivery_factor: s.delivery_factor,
        safety_factor: s.safety_factor,
        is_cheapest: s.is_lowest_price,
        items: (s.items ?? []).map((i: any) => ({
          part_number: i.part_number,
          part_name: i.part_name,
          qty: parseFloat(i.qty),
          satuan: i.satuan,
          price_quot: parseFloat(i.price_quote),
          target_price: parseFloat(i.target_price),
          final_price: parseFloat(i.final_price),
        })),
      })),
      step: `Step ${r.current_step}`,
      status: r.status,
      approval_history: (r.approvals ?? []).map((a: any) => ({
        role: a.approver?.role?.nama_role ?? '',
        name: a.approver?.nama_user ?? '',
        status: a.status,
        timestamp: a.action_date ?? a.created_at,
        note: a.comment,
      })),
      created_at: r.created_at,
    };
  }

  async createOtorisasiHargaNP(data: any) {
    const record = await this.prisma.otorisasiHarga.create({
      data: {
        no_doc: data.no_doc,
        jenis: 'non_product',
        no_pr: data.no_pr,
        bodr_id: data.bodr_id ? parseInt(data.bodr_id) : null,
        tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
        buyer_user_id: parseInt(data.buyer_id),
        jenis_otorisasi_id: data.jenis_otorisasi_id ? parseInt(data.jenis_otorisasi_id) : null,
        status: 'Pending Review',
      },
    });
    const { id: _id1, ...rest1 } = record;
    return { id: record.id.toString(), ...rest1 };
  }

  async updateOtorisasiHargaNP(id: string, data: any) {
    const record = await this.prisma.otorisasiHarga.update({
      where: { id: parseInt(id) },
      data: { status: data.status, current_step: data.current_step },
    });
    const { id: _id2, ...rest2 } = record;
    return { id: record.id.toString(), ...rest2 };
  }

  async removeOtorisasiHargaNP(id: string) {
    await this.prisma.otorisasiHarga.delete({ where: { id: parseInt(id) } });
    return { success: true };
  }
}
