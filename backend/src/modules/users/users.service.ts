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

    let customerProfile = user.customerProfile;
    if (!customerProfile && (user.accountType === 'CUSTOMER' || roles.includes('CUSTOMER'))) {
      customerProfile = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { userId: user.id },
            ...(user.email ? [{ email: user.email }] : []),
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
      });
      if (customerProfile && !customerProfile.userId) {
        await this.prisma.customer.update({
          where: { id: customerProfile.id },
          data: { userId: user.id },
        }).catch(() => {});
      }
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      role: user.accountType,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      employeeId: user.employeeProfile?.id || null,
      customerId: customerProfile?.id || null,
      branchId: user.employeeProfile?.branchId || null,
      franchiseId: user.employeeProfile?.branch?.franchiseId || null,
      employee: user.employeeProfile
        ? {
            id: user.employeeProfile.id,
            employeeCode: user.employeeProfile.employeeCode,
            firstName: user.employeeProfile.firstName,
            lastName: user.employeeProfile.lastName,
            designation: user.employeeProfile.designation,
            status: user.employeeProfile.status,
            branchId: user.employeeProfile.branchId,
            branch: user.employeeProfile.branch,
          }
        : null,
      customer: customerProfile
        ? {
            id: customerProfile.id,
            name: customerProfile.name,
            customerType: customerProfile.customerType,
            email: customerProfile.email,
            phone: customerProfile.phone,
            status: customerProfile.status,
          }
        : null,
      branch: user.employeeProfile?.branch || null,
      franchise: user.employeeProfile?.branch?.franchise || null,
      employeeProfile: user.employeeProfile
        ? {
            id: user.employeeProfile.id,
            employeeCode: user.employeeProfile.employeeCode,
            firstName: user.employeeProfile.firstName,
            lastName: user.employeeProfile.lastName,
            designation: user.employeeProfile.designation,
            status: user.employeeProfile.status,
            branchId: user.employeeProfile.branchId,
            branch: user.employeeProfile.branch,
          }
        : null,
      customerProfile: customerProfile || null,
      roles,
      permissions,
      scope: {
        franchiseId: user.employeeProfile?.branch?.franchiseId || null,
        branchId: user.employeeProfile?.branchId || null,
      },
      assignedFranchiseId: user.employeeProfile?.branch?.franchiseId || null,
      assignedBranchId: user.employeeProfile?.branchId || null,
    };
  }

  async findByEmail(email: string) {
    if (!email) return null;
    const clean = email.trim();
    const targetEmail = clean.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { phone: clean },
          { customerProfile: { email: targetEmail } },
          { customerProfile: { phone: clean } },
        ],
      },
      include: {
        employeeProfile: {
          include: {
            roleAssignments: { include: { role: true } },
          },
        },
        customerProfile: true,
      },
    });

    return user;
  }
}
