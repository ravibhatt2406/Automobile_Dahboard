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
        where: { userId: user.id },
      });
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
            preferredBranchId: customerProfile.preferredBranchId,
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

  async findByEmail(identifier: string) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const targetEmail = clean.toLowerCase();
    const isEmail = clean.includes('@');

    let orConditions: any[] = [];

    if (isEmail) {
      orConditions = [
        { email: { equals: targetEmail, mode: 'insensitive' } },
        { customerProfile: { email: { equals: targetEmail, mode: 'insensitive' } } },
      ];
    } else {
      // Extract numerical digits for phone format normalization
      const digits = clean.replace(/\D/g, '');
      const phoneVariants = new Set<string>([clean]);

      if (digits.length >= 7) {
        phoneVariants.add(digits);
        phoneVariants.add(`+${digits}`);

        const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
        phoneVariants.add(last10);
        phoneVariants.add(`+91${last10}`);
        phoneVariants.add(`0${last10}`);

        if (last10.length === 10) {
          const formattedWithSpace = `${last10.slice(0, 5)} ${last10.slice(5)}`;
          phoneVariants.add(formattedWithSpace);
          phoneVariants.add(`+91 ${formattedWithSpace}`);
        }
      }

      const phoneList = Array.from(phoneVariants);
      orConditions = [
        { phone: { in: phoneList } },
        { customerProfile: { phone: { in: phoneList } } },
      ];
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        employeeProfile: {
          include: {
            branch: { include: { franchise: true } },
            roleAssignments: { include: { role: true } },
          },
        },
        customerProfile: true,
      },
    });

    // If user is a customer and customerProfile is linked by verified userId
    if (user && !user.customerProfile && user.accountType === 'CUSTOMER') {
      const linkedCustomer = await this.prisma.customer.findFirst({
        where: { userId: user.id },
      });
      if (linkedCustomer) {
        (user as any).customerProfile = linkedCustomer;
      }
    }

    return user;
  }
}

