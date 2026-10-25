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

      if (!customerProfile && user.email && user.phone) {
        const cleanDigits = user.phone.replace(/\D/g, '').slice(-10);
        const candidates = await this.prisma.customer.findMany({
          where: {
            email: { equals: user.email.trim(), mode: 'insensitive' },
            userId: null,
          },
        });
        const matched = candidates.filter((c) => {
          const cDigits = (c.phone || '').replace(/\D/g, '').slice(-10);
          return cleanDigits.length >= 7 && cDigits === cleanDigits;
        });

        if (matched.length === 1 && matched[0].status !== 'INACTIVE') {
          customerProfile = await this.prisma.customer.update({
            where: { id: matched[0].id },
            data: { userId: user.id },
          }).catch(() => null);
        }
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

    const orConditions: any[] = [
      { email: targetEmail },
      { customerProfile: { email: targetEmail } },
      { phone: { in: phoneList } },
      { customerProfile: { phone: { in: phoneList } } },
    ];

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

    // If user is a customer but customerProfile is not linked, attempt safe linkage
    if (user && !user.customerProfile && user.accountType === 'CUSTOMER') {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { userId: user.id },
            ...(user.email ? [{ email: user.email }] : []),
            ...(user.phone ? [{ phone: { in: phoneList } }] : []),
          ],
        },
      });

      if (existingCustomer) {
        if (!existingCustomer.userId) {
          await this.prisma.customer.update({
            where: { id: existingCustomer.id },
            data: { userId: user.id },
          }).catch(() => {});
        }
        (user as any).customerProfile = existingCustomer;
      }
    }

    return user;
  }
}

