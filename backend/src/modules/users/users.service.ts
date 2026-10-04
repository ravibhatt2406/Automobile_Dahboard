import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employeeProfile: {
          include: {
            branch: { include: { franchise: true } },
            roleAssignments: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
        customerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ID '${id}' not found`);
    }

    const roles = user.employeeProfile
      ? user.employeeProfile.roleAssignments.map((ra) => ra.role.name)
      : user.accountType === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN']
      : ['CUSTOMER'];

    const permissions = Array.from(
      new Set(
        user.employeeProfile?.roleAssignments.flatMap((ra) =>
          ra.role.rolePermissions.map((rp) => rp.permission.name),
        ) || [],
      ),
    );

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      employeeProfile: user.employeeProfile
        ? {
            id: user.employeeProfile.id,
            employeeCode: user.employeeProfile.employeeCode,
            firstName: user.employeeProfile.firstName,
            lastName: user.employeeProfile.lastName,
            designation: user.employeeProfile.designation,
            status: user.employeeProfile.status,
            branch: user.employeeProfile.branch,
          }
        : null,
      customerProfile: user.customerProfile || null,
      roles,
      permissions,
      assignedFranchiseId: user.employeeProfile?.branch?.franchiseId || null,
      assignedBranchId: user.employeeProfile?.branchId || null,
    };
  }

  async findByEmail(email: string) {
    if (!email) return null;
    const normEmail = email.toLowerCase().trim();

    // Map common demo/evaluation email aliases to the active seeded records
    const ALIAS_MAP: Record<string, string> = {
      'branchmanager@titanauto.com': 'manager.jaipur@titanauto.com',
      'manager@titanauto.com': 'manager.jaipur@titanauto.com',
      'sales@titanauto.com': 'sales.jaipur@titanauto.com',
      'mechanic@titanauto.com': 'mechanic.jaipur@titanauto.com',
      'customer@titanauto.com': 'customer@rajasthanlogistics.com',
    };

    const targetEmail = ALIAS_MAP[normEmail] || normEmail;

    const user = await this.prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        employeeProfile: {
          include: {
            roleAssignments: { include: { role: true } },
          },
        },
      },
    });

    return user || null;
  }
}
