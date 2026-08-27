import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const total_user = await this.prisma.user.count();
    const total_departemen = await this.prisma.departemen.count();
    const user_active = await this.prisma.user.count({ where: { status: 'active' } });
    const total_role = await this.prisma.role.count();

    // Chart per departemen
    const departemens = await this.prisma.departemen.findMany({
      include: { _count: { select: { users: true } } },
    });

    return {
      total_user,
      total_departemen,
      user_active,
      total_role,
      per_departemen: departemens.map((d) => ({
        nama_departemen: d.nama_departemen,
        total_user: d._count.users,
      })),
    };
  }

  async getHistoryLogs(params?: { search?: string; status?: string; archive?: string }) {
    const where: any = {};

    if (params?.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params?.search) {
      const s = params.search;
      where.OR = [
        { nama_user: { contains: s, mode: 'insensitive' } },
        { npk: { contains: s, mode: 'insensitive' } },
        { username: { contains: s, mode: 'insensitive' } },
        { departemen: { contains: s, mode: 'insensitive' } },
      ];
    }

    const logs = await this.prisma.loginLog.findMany({
      where,
      orderBy: { login_time: 'desc' },
      take: 500,
    });

    const total_success = await this.prisma.loginLog.count({ where: { status: 'SUCCESS' } });
    const total_failed = await this.prisma.loginLog.count({ where: { status: 'FAILED' } });
    const total = await this.prisma.loginLog.count({ where });

    return {
      logs: logs.map((l) => ({
        id: l.id,
        user_id: l.user_id,
        npk: l.npk,
        nama_user: l.nama_user,
        username: l.username,
        departemen: l.departemen,
        role: l.role,
        ip_address: l.ip_address,
        user_agent: l.user_agent,
        status: l.status,
        keterangan: l.keterangan,
        login_time: l.login_time,
      })),
      total,
      total_success,
      total_failed,
    };
  }
}
