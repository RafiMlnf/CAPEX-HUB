import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Format user response ──────────────────────────────────────────────────
  private formatUser(user: any) {
    const roleName = (user.role?.nama_role ?? '').toLowerCase();
    const isAdm = roleName === 'admin' || (user.username || '').toLowerCase() === 'admin';

    return {
      id: user.id.toString(),
      npk: user.npk,
      username: user.username,
      name: user.nama_user,
      email: user.email,
      role: user.role?.nama_role ?? '',
      department: user.departemen?.nama_departemen ?? '',
      departemen_id: user.departemen_id ?? null,
      status: user.status,
      can_capex: user.portalAccess?.can_capex ?? true,
      can_bodr: user.portalAccess?.can_bodr ?? true,
      can_price: user.portalAccess?.can_price ?? true,
      can_admin: isAdm || (user.portalAccess?.can_admin ?? false),
      allowed_portals: [
        ...(user.portalAccess?.can_capex !== false ? ['capex'] : []),
        ...(user.portalAccess?.can_bodr !== false ? ['bodr'] : []),
        ...(user.portalAccess?.can_price !== false ? ['price'] : []),
        ...(isAdm || (user.portalAccess?.can_admin === true) ? ['admin'] : []),
      ],
      created_at: user.created_at,
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginUserDto, ip?: string, userAgent?: string) {
    // Try find by username or npk
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { npk: dto.username }],
      },
      include: {
        role: true,
        departemen: true,
        portalAccess: true,
      },
    });

    const logBase = {
      username: dto.username,
      ip_address: ip ?? null,
      user_agent: userAgent ?? null,
    };

    if (!user) {
      await this.prisma.loginLog.create({
        data: {
          ...logBase,
          status: 'FAILED',
          keterangan: 'User tidak ditemukan',
        },
      });
      throw new UnauthorizedException('Username atau password salah');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      await this.prisma.loginLog.create({
        data: {
          ...logBase,
          user_id: user.id,
          npk: user.npk,
          nama_user: user.nama_user,
          departemen: user.departemen?.nama_departemen,
          role: user.role?.nama_role,
          status: 'FAILED',
          keterangan: 'Password salah',
        },
      });
      throw new UnauthorizedException('Username atau password salah');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    await this.prisma.loginLog.create({
      data: {
        ...logBase,
        user_id: user.id,
        npk: user.npk,
        nama_user: user.nama_user,
        departemen: user.departemen?.nama_departemen,
        role: user.role?.nama_role,
        status: 'SUCCESS',
        keterangan: 'Login berhasil',
      },
    });

    return this.formatUser(user);
  }

  // ── Get all users ─────────────────────────────────────────────────────────
  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { role: true, departemen: true, portalAccess: true },
      orderBy: { created_at: 'desc' },
    });
    return users.map((u) => this.formatUser(u));
  }

  // ── Get one user ──────────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true, departemen: true, portalAccess: true },
    });
    if (!user) throw new NotFoundException(`User ${id} tidak ditemukan`);
    return this.formatUser(user);
  }

  // ── Helper: Resolve Departemen & Role ID ──────────────────────────────────
  private async resolveDeptAndRoleId(dto: any) {
    let deptId: number | undefined = undefined;
    if (dto.departemen_id !== undefined && dto.departemen_id !== null && !isNaN(Number(dto.departemen_id))) {
      deptId = Number(dto.departemen_id);
    } else if (dto.department) {
      const parsed = parseInt(dto.department);
      if (!isNaN(parsed)) {
        deptId = parsed;
      } else {
        const found = await this.prisma.departemen.findFirst({
          where: {
            OR: [
              { nama_departemen: { equals: dto.department, mode: 'insensitive' } },
              { kode_departemen: { equals: dto.department, mode: 'insensitive' } },
            ],
          },
        });
        if (found) deptId = found.id;
      }
    }
    if (!deptId) {
      const firstDept = await this.prisma.departemen.findFirst();
      if (firstDept) deptId = firstDept.id;
    }

    let roleId: number | undefined = undefined;
    if (dto.role_id !== undefined && dto.role_id !== null && !isNaN(Number(dto.role_id))) {
      roleId = Number(dto.role_id);
    } else if (dto.role) {
      const parsed = parseInt(dto.role);
      if (!isNaN(parsed)) {
        roleId = parsed;
      } else {
        const found = await this.prisma.role.findFirst({
          where: {
            OR: [
              { nama_role: { equals: dto.role, mode: 'insensitive' } },
              { kode_role: { equals: dto.role, mode: 'insensitive' } },
            ],
          },
        });
        if (found) roleId = found.id;
      }
    }
    if (!roleId) {
      const firstRole = await this.prisma.role.findFirst();
      if (firstRole) roleId = firstRole.id;
    }

    return { deptId, roleId };
  }

  // ── Create user ───────────────────────────────────────────────────────────
  async create(dto: CreateUserDto) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
    const password_hash = await bcrypt.hash(dto.password, saltRounds);
    const { deptId, roleId } = await this.resolveDeptAndRoleId(dto);

    const namaUser = dto.nama_user || dto.name || dto.username;

    try {
      const user = await this.prisma.user.create({
        data: {
          npk: dto.npk,
          nama_user: namaUser,
          email: dto.email,
          username: dto.username,
          password_hash,
          departemen_id: deptId!,
          role_id: roleId!,
          status: (dto.status as any) ?? 'active',
        },
        include: { role: true, departemen: true, portalAccess: true },
      });

      return this.formatUser(user);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Data user gagal disimpan: NPK ("${dto.npk}") atau Username ("${dto.username}") sudah terdaftar dalam sistem. Silakan gunakan NPK/Username yang berbeda.`,
        );
      }
      throw err;
    }
  }

  // ── Update user ───────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) throw new NotFoundException(`User ${id} tidak ditemukan`);

    const updateData: any = {};
    if (dto.npk !== undefined) updateData.npk = dto.npk;
    if (dto.username !== undefined) updateData.username = dto.username;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.nama_user !== undefined || dto.name !== undefined) {
      updateData.nama_user = dto.nama_user || dto.name;
    }

    if (dto.departemen_id !== undefined || dto.department !== undefined) {
      const { deptId } = await this.resolveDeptAndRoleId(dto);
      if (deptId) updateData.departemen_id = deptId;
    }

    if (dto.role_id !== undefined || dto.role !== undefined) {
      const { roleId } = await this.resolveDeptAndRoleId(dto);
      if (roleId) updateData.role_id = roleId;
    }

    if (dto.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
      updateData.password_hash = await bcrypt.hash(dto.password, saltRounds);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { role: true, departemen: true, portalAccess: true },
      });

      return this.formatUser(user);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          `Data user gagal diperbarui: NPK atau Username sudah digunakan oleh akun lain.`,
        );
      }
      throw err;
    }
  }

  // ── Delete user (permanent delete) ────────────────────────────────────────
  async remove(id: string) {
    const userId = parseInt(id);
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException(`User ${id} tidak ditemukan`);

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete portal access configuration
      await tx.userPortalAccess.deleteMany({ where: { user_id: userId } });
      // 2. Delete login logs
      await tx.loginLog.deleteMany({ where: { user_id: userId } });
      // 3. Delete workflow steps referencing this user
      await tx.approvalWorkflowStep.deleteMany({ where: { approver_user_id: userId } });
      await tx.approvalPriceWorkflowStep.deleteMany({ where: { approver_user_id: userId } });
      // 4. Clear department settings
      await tx.departmentSettings.updateMany({
        where: { head_dept_user_id: userId },
        data: { head_dept_user_id: null },
      });
      await tx.departmentSettings.updateMany({
        where: { accounting_user_id: userId },
        data: { accounting_user_id: null },
      });
      // 5. Delete the user record permanently
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { success: true };
  }
}
