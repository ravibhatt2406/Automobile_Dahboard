import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

const DEV_ROLES: any[] = [
  { id: 'role-1', name: 'SUPER_ADMIN', rank: 1, isSystemRole: true },
  { id: 'role-2', name: 'FRANCHISE_OWNER', rank: 2, isSystemRole: true },
  { id: 'role-3', name: 'BRANCH_MANAGER', rank: 3, isSystemRole: true },
  { id: 'role-4', name: 'SALES_EMPLOYEE', rank: 4, isSystemRole: true },
  { id: 'role-5', name: 'SERVICE_MANAGER', rank: 5, isSystemRole: true },
  { id: 'role-6', name: 'MECHANIC', rank: 6, isSystemRole: true },
  { id: 'role-7', name: 'INVENTORY_MANAGER', rank: 7, isSystemRole: true },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const roles = await this.prisma.role.findMany({
        orderBy: { rank: 'asc' },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      if (roles && roles.length > 0) return roles;
    } catch {}

    return DEV_ROLES;
  }

  async findByName(name: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { name },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      if (role) return role;
    } catch {}

    const devRole = DEV_ROLES.find((r) => r.name === name);
    if (devRole) return devRole;

    return { id: `role-${name}`, name, rank: 5, isSystemRole: false };
  }
}
