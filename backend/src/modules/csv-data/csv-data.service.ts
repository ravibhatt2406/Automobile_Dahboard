import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parseCsv, stringifyCsv } from './utils/csv-parser.util';
import * as bcrypt from 'bcrypt';
import { ROLE_RANKS } from '@/common/constants/permissions.constant';
import { resolveUserScope } from '@/common/utils/scope.util';

export interface RowPreviewResult {
  rowNumber: number;
  data: Record<string, string>;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  errors: string[];
  isDuplicate: boolean;
}

export interface PreviewResponse {
  entity: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  canCommit: boolean;
  headers: string[];
  previewRows: RowPreviewResult[];
}

export interface ImportExecutionResult {
  success: boolean;
  entity: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber: number; reason: string; data?: any }>;
  errorReportCsv?: string;
}

@Injectable()
export class CsvDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // 1. CSV TEMPLATES
  // ==========================================
  getTemplate(entity: string): { filename: string; content: string } {
    const normalized = entity.toLowerCase();
    switch (normalized) {
      case 'customers':
        return {
          filename: 'customers-template.csv',
          content: stringifyCsv([
            [
              'name',
              'phone',
              'email',
              'customerType',
              'companyName',
              'address',
              'city',
              'state',
              'pincode',
              'gstin',
              'franchiseCode',
            ],
            [
              'Rajesh Kumar',
              '9876543210',
              'rajesh.kumar@example.com',
              'INDIVIDUAL',
              '',
              '123 Industrial Area',
              'Jaipur',
              'Rajasthan',
              '302013',
              '08AABCT1332L1Z1',
              'FRAN-RAJ-01',
            ],
            [
              'Apex Logistics Pvt Ltd',
              '9822334455',
              'fleet@apexlogistics.in',
              'BUSINESS',
              'Apex Logistics Pvt Ltd',
              'Plot 99 Transport Nagar',
              'Jaipur',
              'Rajasthan',
              '302003',
              '08AAACA9999L1Z5',
              'FRAN-RAJ-01',
            ],
          ]),
        };

      case 'branches':
        return {
          filename: 'branches-template.csv',
          content: stringifyCsv([
            ['franchiseCode', 'code', 'name', 'address', 'city', 'state', 'status'],
            [
              'FRAN-RAJ-01',
              'BRN-JAI-NORTH',
              'Jaipur North Commercial Hub',
              'Plot 44 VKI Area',
              'Jaipur',
              'Rajasthan',
              'ACTIVE',
            ],
          ]),
        };

      case 'franchises':
        return {
          filename: 'franchises-template.csv',
          content: stringifyCsv([
            ['code', 'name', 'legalName', 'taxId', 'status'],
            [
              'FRAN-DEL-01',
              'Delhi Capital Commercial Trucks',
              'Delhi Fleet Logistics Pvt Ltd',
              '07AAACD1111L1Z2',
              'ACTIVE',
            ],
          ]),
        };

      case 'employees':
        return {
          filename: 'employees-template.csv',
          content: stringifyCsv([
            [
              'employeeCode',
              'branchCode',
              'firstName',
              'lastName',
              'email',
              'phone',
              'designation',
              'roleName',
              'initialPassword',
            ],
            [
              'EMP-9001',
              'BRN-JAI-01',
              'Amit',
              'Sharma',
              'amit.sharma@ashokleyland.com',
              '9876543299',
              'Sales Consultant',
              'SALES_EMPLOYEE',
              'Titan@2026!',
            ],
          ]),
        };

      default:
        throw new BadRequestException(
          `Unsupported entity type '${entity}'. Must be one of: customers, branches, franchises, employees`,
        );
    }
  }

  // ==========================================
  // 2. CSV EXPORT (Scoped & Formula Protected)
  // ==========================================
  async exportData(
    entity: string,
    user: any,
    queryBranchId?: string,
    queryFranchiseId?: string,
    options?: { search?: string; status?: string; customerType?: string },
  ): Promise<{ filename: string; content: string }> {
    const normalized = entity.toLowerCase();

    // 1. Resolve scope authoritatively
    const targetBranch =
      queryBranchId && queryBranchId !== 'ALL' && queryBranchId !== 'undefined'
        ? queryBranchId.trim()
        : user?.effectiveScope?.effectiveBranchId || undefined;
    const targetFranchise =
      queryFranchiseId && queryFranchiseId !== 'ALL' && queryFranchiseId !== 'undefined'
        ? queryFranchiseId.trim()
        : user?.effectiveScope?.effectiveFranchiseId || undefined;

    const scope = user
      ? await resolveUserScope(this.prisma, user, targetBranch, targetFranchise)
      : null;

    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = scope
      ? scope.isActingSuperAdmin
      : user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = scope
      ? scope.isActingFranchiseLevel
      : roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isBranchLevel = scope
      ? scope.isActingBranchLevel
      : roles.some((r) =>
          ['BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'SERVICE_ADVISOR', 'MECHANIC'].includes(r),
        );

    const effectiveFranchiseId = scope?.effectiveFranchiseId || null;
    const effectiveBranchId = scope?.effectiveBranchId || null;

    switch (normalized) {
      case 'franchises': {
        if (!isSuperAdmin && !isFranchiseLevel) {
          throw new ForbiddenException('Unauthorized: You lack permissions to export franchises.');
        }

        const where: any = {};
        if (effectiveFranchiseId) {
          where.id = effectiveFranchiseId;
        } else if (effectiveBranchId) {
          where.branches = { some: { id: effectiveBranchId } };
        } else if (!isSuperAdmin && isFranchiseLevel && scope?.assignedFranchiseId) {
          where.id = scope.assignedFranchiseId;
        }

        if (options?.status && options.status !== 'ALL') {
          where.status = options.status;
        }

        if (options?.search && options.search.trim()) {
          const term = options.search.trim();
          where.OR = [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
            { legalName: { contains: term, mode: 'insensitive' } },
          ];
        }

        const franchises = await this.prisma.franchise.findMany({
          where,
          include: { _count: { select: { branches: true } } },
          orderBy: { createdAt: 'desc' },
        });

        const rows: string[][] = [
          ['ID', 'Code', 'Name', 'Legal Name', 'Tax ID', 'Status', 'Total Branches', 'Created At'],
        ];

        for (const f of franchises) {
          rows.push([
            f.id,
            f.code,
            f.name,
            f.legalName || '',
            f.taxId || '',
            f.status,
            String(f._count?.branches || 0),
            f.createdAt.toISOString(),
          ]);
        }

        return {
          filename: `franchises-export-${Date.now()}.csv`,
          content: stringifyCsv(rows),
        };
      }

      case 'branches': {
        if (!isSuperAdmin && !isFranchiseLevel && !isBranchLevel) {
          throw new ForbiddenException('Unauthorized: You lack permissions to export branches.');
        }

        const where: any = {};
        if (effectiveBranchId) {
          where.id = effectiveBranchId;
        } else if (effectiveFranchiseId) {
          where.franchiseId = effectiveFranchiseId;
        } else if (!isSuperAdmin) {
          if (isFranchiseLevel && scope?.assignedFranchiseId) {
            where.franchiseId = scope.assignedFranchiseId;
          } else if (scope?.assignedBranchId) {
            where.id = scope.assignedBranchId;
          }
        }

        if (options?.status && options.status !== 'ALL') {
          where.status = options.status;
        }

        if (options?.search && options.search.trim()) {
          const term = options.search.trim();
          where.AND = [
            ...(where.AND || []),
            {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { code: { contains: term, mode: 'insensitive' } },
                { city: { contains: term, mode: 'insensitive' } },
              ],
            },
          ];
        }

        const branches = await this.prisma.branch.findMany({
          where,
          include: {
            franchise: true,
            _count: { select: { employees: true, vehicles: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const rows: string[][] = [
          [
            'ID',
            'Franchise Code',
            'Franchise Name',
            'Branch Code',
            'Branch Name',
            'Address',
            'City',
            'State',
            'Status',
            'Total Employees',
            'Total Vehicles',
            'Created At',
          ],
        ];

        for (const b of branches) {
          rows.push([
            b.id,
            b.franchise?.code || '',
            b.franchise?.name || '',
            b.code,
            b.name,
            b.address || '',
            b.city || '',
            b.state || '',
            b.status,
            String(b._count?.employees || 0),
            String(b._count?.vehicles || 0),
            b.createdAt.toISOString(),
          ]);
        }

        return {
          filename: `branches-export-${Date.now()}.csv`,
          content: stringifyCsv(rows),
        };
      }

      case 'employees': {
        if (!isSuperAdmin && !isFranchiseLevel && !isBranchLevel) {
          throw new ForbiddenException('Unauthorized: You lack permissions to export employees.');
        }

        const where: any = {};
        if (effectiveBranchId) {
          where.branchId = effectiveBranchId;
        } else if (effectiveFranchiseId) {
          where.branch = { franchiseId: effectiveFranchiseId };
        } else if (!isSuperAdmin) {
          if (isFranchiseLevel && scope?.assignedFranchiseId) {
            where.branch = { franchiseId: scope.assignedFranchiseId };
          } else if (scope?.assignedBranchId) {
            where.branchId = scope.assignedBranchId;
          }
        }

        if (options?.status && options.status !== 'ALL') {
          where.status = options.status;
        }

        if (options?.search && options.search.trim()) {
          const term = options.search.trim();
          where.AND = [
            ...(where.AND || []),
            {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { employeeCode: { contains: term, mode: 'insensitive' } },
                { designation: { contains: term, mode: 'insensitive' } },
                { user: { email: { contains: term, mode: 'insensitive' } } },
                { user: { phone: { contains: term, mode: 'insensitive' } } },
              ],
            },
          ];
        }

        const employees = await this.prisma.employee.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                accountType: true,
                // NEVER include passwordHash!
              },
            },
            branch: { include: { franchise: true } },
            roleAssignments: { include: { role: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const rows: string[][] = [
          [
            'Employee ID',
            'Employee Code',
            'Branch Code',
            'Branch Name',
            'Franchise Code',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Designation',
            'Status',
            'Roles',
            'Hired Date',
            'Created At',
          ],
        ];

        for (const emp of employees) {
          const empRoles = emp.roleAssignments.map((ra) => ra.role.name).join('; ');
          rows.push([
            emp.id,
            emp.employeeCode,
            emp.branch?.code || '',
            emp.branch?.name || '',
            emp.branch?.franchise?.code || '',
            emp.firstName,
            emp.lastName,
            emp.user?.email || '',
            emp.user?.phone || '',
            emp.designation || '',
            emp.status,
            empRoles || 'EMPLOYEE',
            emp.hiredAt ? emp.hiredAt.toISOString() : '',
            emp.createdAt.toISOString(),
          ]);
        }

        return {
          filename: `employees-export-${Date.now()}.csv`,
          content: stringifyCsv(rows),
        };
      }

      case 'customers': {
        if (user?.accountType === 'CUSTOMER' && !isSuperAdmin && !isFranchiseLevel && !isBranchLevel) {
          throw new ForbiddenException('Unauthorized: Customers cannot export customer lists.');
        }

        const conditions: any[] = [];

        if (effectiveBranchId) {
          conditions.push({
            OR: [
              { preferredBranchId: effectiveBranchId },
              { quotations: { some: { branchId: effectiveBranchId } } },
              { bookings: { some: { branchId: effectiveBranchId } } },
              { vehicles: { some: { branchId: effectiveBranchId } } },
              { leads: { some: { branchId: effectiveBranchId } } },
              { serviceAppointments: { some: { branchId: effectiveBranchId } } },
              { serviceJobs: { some: { branchId: effectiveBranchId } } },
              { conversations: { some: { branchId: effectiveBranchId } } },
              { invoices: { some: { branchId: effectiveBranchId } } },
            ],
          });
        } else if (effectiveFranchiseId) {
          conditions.push({
            OR: [
              { preferredBranch: { franchiseId: effectiveFranchiseId } },
              { franchiseLinks: { some: { franchiseId: effectiveFranchiseId } } },
              { leads: { some: { franchiseId: effectiveFranchiseId } } },
              { quotations: { some: { franchiseId: effectiveFranchiseId } } },
              { bookings: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
              { vehicles: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
              { serviceJobs: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
              { serviceAppointments: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
              { conversations: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
              { invoices: { some: { branch: { franchiseId: effectiveFranchiseId } } } },
            ],
          });
        } else if (!isSuperAdmin) {
          if (isFranchiseLevel && scope?.assignedFranchiseId) {
            conditions.push({
              OR: [
                { preferredBranch: { franchiseId: scope.assignedFranchiseId } },
                { franchiseLinks: { some: { franchiseId: scope.assignedFranchiseId } } },
                { leads: { some: { franchiseId: scope.assignedFranchiseId } } },
                { quotations: { some: { franchiseId: scope.assignedFranchiseId } } },
                { bookings: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
                { vehicles: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
                { serviceJobs: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
                { serviceAppointments: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
                { conversations: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
                { invoices: { some: { branch: { franchiseId: scope.assignedFranchiseId } } } },
              ],
            });
          } else if (scope?.assignedBranchId) {
            conditions.push({
              OR: [
                { preferredBranchId: scope.assignedBranchId },
                { quotations: { some: { branchId: scope.assignedBranchId } } },
                { bookings: { some: { branchId: scope.assignedBranchId } } },
                { vehicles: { some: { branchId: scope.assignedBranchId } } },
                { leads: { some: { branchId: scope.assignedBranchId } } },
                { serviceAppointments: { some: { branchId: scope.assignedBranchId } } },
                { serviceJobs: { some: { branchId: scope.assignedBranchId } } },
                { conversations: { some: { branchId: scope.assignedBranchId } } },
                { invoices: { some: { branchId: scope.assignedBranchId } } },
              ],
            });
          }
        }

        if (options?.customerType && options.customerType !== 'ALL') {
          conditions.push({ customerType: options.customerType });
        }

        if (options?.status && options.status !== 'ALL') {
          conditions.push({ status: options.status });
        }

        if (options?.search && options.search.trim()) {
          const term = options.search.trim();
          conditions.push({
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { phone: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { companyName: { contains: term, mode: 'insensitive' } },
            ],
          });
        }

        const where: any = conditions.length > 0 ? { AND: conditions } : {};

        const customers = await this.prisma.customer.findMany({
          where,
          include: {
            franchiseLinks: { include: { franchise: true } },
            _count: { select: { vehicles: true, bookings: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const rows: string[][] = [
          [
            'Customer ID',
            'Name',
            'Phone',
            'Email',
            'Customer Type',
            'Company Name',
            'Address',
            'City',
            'State',
            'Pincode',
            'GSTIN',
            'Status',
            'Total Vehicles',
            'Total Bookings',
            'Created At',
          ],
        ];

        for (const c of customers) {
          rows.push([
            c.id,
            c.name,
            c.phone,
            c.email || '',
            c.customerType,
            c.companyName || '',
            c.address || '',
            c.city || '',
            c.state || '',
            c.pincode || '',
            c.gstin || '',
            c.status,
            String(c._count?.vehicles || 0),
            String(c._count?.bookings || 0),
            c.createdAt.toISOString(),
          ]);
        }

        return {
          filename: `customers-export-${Date.now()}.csv`,
          content: stringifyCsv(rows),
        };
      }

      default:
        throw new BadRequestException(`Export not supported for entity '${entity}'`);
    }
  }

  // ==========================================
  // 3. CSV PREVIEW & VALIDATION
  // ==========================================
  async previewImport(entity: string, csvContent: string, user: any): Promise<PreviewResponse> {
    const normalized = entity.toLowerCase();
    this.assertImportAuthorization(normalized, user);

    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('CSV file content is empty');
    }

    if (csvContent.length > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 5MB maximum limit.');
    }

    const rows = parseCsv(csvContent);
    if (rows.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row.');
    }

    const headers = rows[0].map((h) => h.trim());
    const dataRows = rows.slice(1);

    if (dataRows.length > 500) {
      throw new BadRequestException(
        `Batch size limit exceeded: Maximum 500 data rows permitted per CSV import (provided ${dataRows.length}).`,
      );
    }

    const previewRows: RowPreviewResult[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    switch (normalized) {
      case 'franchises': {
        this.validateRequiredHeaders(headers, ['code', 'name']);
        const existingCodes = new Set(
          (await this.prisma.franchise.findMany({ select: { code: true } })).map((f) =>
            f.code.toUpperCase(),
          ),
        );
        const seenInFile = new Set<string>();

        dataRows.forEach((r, idx) => {
          const rowNum = idx + 2;
          const rowData = this.mapRow(headers, r);
          const errors: string[] = [];
          const code = (rowData['code'] || '').trim().toUpperCase();
          const name = (rowData['name'] || '').trim();

          if (!code) errors.push('Missing required field: code');
          if (!name) errors.push('Missing required field: name');

          let isDuplicate = false;
          if (code) {
            if (existingCodes.has(code)) {
              errors.push(`Duplicate: Franchise code '${code}' already exists in database`);
              isDuplicate = true;
            } else if (seenInFile.has(code)) {
              errors.push(`Duplicate: Franchise code '${code}' appears multiple times in file`);
              isDuplicate = true;
            } else {
              seenInFile.add(code);
            }
          }

          const status = errors.length === 0 ? 'VALID' : isDuplicate ? 'DUPLICATE' : 'INVALID';
          if (status === 'VALID') validCount++;
          else if (status === 'DUPLICATE') duplicateCount++;
          else invalidCount++;

          previewRows.push({ rowNumber: rowNum, data: rowData, status, errors, isDuplicate });
        });
        break;
      }

      case 'branches': {
        this.validateRequiredHeaders(headers, ['franchiseCode', 'code', 'name']);
        const existingBranches = new Set(
          (await this.prisma.branch.findMany({ select: { code: true } })).map((b) =>
            b.code.toUpperCase(),
          ),
        );
        const validFranchises = new Map(
          (await this.prisma.franchise.findMany({ select: { code: true, id: true, status: true } })).map(
            (f) => [f.code.toUpperCase(), f],
          ),
        );
        const seenInFile = new Set<string>();

        dataRows.forEach((r, idx) => {
          const rowNum = idx + 2;
          const rowData = this.mapRow(headers, r);
          const errors: string[] = [];
          const franCode = (rowData['franchiseCode'] || '').trim().toUpperCase();
          const code = (rowData['code'] || '').trim().toUpperCase();
          const name = (rowData['name'] || '').trim();

          if (!code) errors.push('Missing required field: code');
          if (!name) errors.push('Missing required field: name');
          if (!franCode) errors.push('Missing required field: franchiseCode');

          const fran = validFranchises.get(franCode);
          if (franCode && !fran) {
            errors.push(`Foreign key error: Franchise code '${franCode}' does not exist`);
          } else if (fran && fran.status !== 'ACTIVE') {
            errors.push(`Invalid parent status: Franchise '${franCode}' is inactive`);
          }

          let isDuplicate = false;
          if (code) {
            if (existingBranches.has(code)) {
              errors.push(`Duplicate: Branch code '${code}' already exists in database`);
              isDuplicate = true;
            } else if (seenInFile.has(code)) {
              errors.push(`Duplicate: Branch code '${code}' appears multiple times in file`);
              isDuplicate = true;
            } else {
              seenInFile.add(code);
            }
          }

          const status = errors.length === 0 ? 'VALID' : isDuplicate ? 'DUPLICATE' : 'INVALID';
          if (status === 'VALID') validCount++;
          else if (status === 'DUPLICATE') duplicateCount++;
          else invalidCount++;

          previewRows.push({ rowNumber: rowNum, data: rowData, status, errors, isDuplicate });
        });
        break;
      }

      case 'employees': {
        this.validateRequiredHeaders(headers, [
          'employeeCode',
          'branchCode',
          'firstName',
          'lastName',
          'email',
          'roleName',
        ]);

        const allBranches = await this.prisma.branch.findMany({
          select: { code: true, id: true, franchiseId: true, status: true },
        });
        const branchMap = new Map(allBranches.map((b) => [b.code.toUpperCase(), b]));

        const existingUsers = await this.prisma.user.findMany({
          select: { email: true, phone: true },
        });
        const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
        const existingPhones = new Set(
          existingUsers.filter((u) => u.phone).map((u) => u.phone as string),
        );

        const existingEmpCodes = new Set(
          (await this.prisma.employee.findMany({ select: { employeeCode: true } })).map((e) =>
            e.employeeCode.toUpperCase(),
          ),
        );

        const allRoles = await this.prisma.role.findMany({ select: { name: true, rank: true } });
        const roleMap = new Map(allRoles.map((ro) => [ro.name.toUpperCase(), ro]));

        const creatorRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
        const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || creatorRoles.includes('SUPER_ADMIN');
        const creatorRank = isSuperAdmin
          ? 1
          : Math.min(...creatorRoles.map((r) => ROLE_RANKS[r] ?? 99));

        const seenCodes = new Set<string>();
        const seenEmails = new Set<string>();

        dataRows.forEach((r, idx) => {
          const rowNum = idx + 2;
          const rowData = this.mapRow(headers, r);
          const errors: string[] = [];

          const empCode = (rowData['employeeCode'] || '').trim().toUpperCase();
          const branchCode = (rowData['branchCode'] || '').trim().toUpperCase();
          const firstName = (rowData['firstName'] || '').trim();
          const lastName = (rowData['lastName'] || '').trim();
          const email = (rowData['email'] || '').trim().toLowerCase();
          const phone = (rowData['phone'] || '').trim();
          const roleName = (rowData['roleName'] || '').trim().toUpperCase();

          if (!empCode) errors.push('Missing required field: employeeCode');
          if (!branchCode) errors.push('Missing required field: branchCode');
          if (!firstName) errors.push('Missing required field: firstName');
          if (!lastName) errors.push('Missing required field: lastName');
          if (!email) errors.push('Missing required field: email');
          if (!roleName) errors.push('Missing required field: roleName');

          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Invalid email format: '${email}'`);
          }

          // Branch validation & scope
          const branch = branchMap.get(branchCode);
          if (branchCode && !branch) {
            errors.push(`Branch '${branchCode}' does not exist`);
          } else if (branch) {
            if (branch.status !== 'ACTIVE') {
              errors.push(`Cannot assign employee to inactive branch '${branchCode}'`);
            }
            if (!isSuperAdmin) {
              const isFranchiseLevel = creatorRoles.some((cr) =>
                ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(cr),
              );
              if (isFranchiseLevel && user?.assignedFranchiseId) {
                if (branch.franchiseId !== user.assignedFranchiseId) {
                  errors.push(
                    `Scope restriction: Branch '${branchCode}' belongs to another franchise`,
                  );
                }
              } else if (user?.assignedBranchId) {
                if (branch.id !== user.assignedBranchId && branch.code !== user.assignedBranchId) {
                  errors.push(
                    `Scope restriction: You are restricted to your assigned branch '${user.assignedBranchId}'`,
                  );
                }
              }
            }
          }

          // Role assignment & RBAC validation
          const targetRole = roleMap.get(roleName);
          if (roleName && !targetRole) {
            errors.push(`Role '${roleName}' does not exist in system`);
          } else if (targetRole) {
            if (roleName === 'SUPER_ADMIN') {
              errors.push('Security Violation: Granting SUPER_ADMIN via CSV import is strictly prohibited');
            } else if (!isSuperAdmin && targetRole.rank <= creatorRank) {
              errors.push(
                `RBAC Privilege Violation: Cannot grant role '${roleName}' (rank ${targetRole.rank}) with equal or higher rank than yours (${creatorRank})`,
              );
            }
          }

          // Duplicate detection
          let isDuplicate = false;
          if (empCode && existingEmpCodes.has(empCode)) {
            errors.push(`Duplicate: Employee code '${empCode}' already exists in database`);
            isDuplicate = true;
          } else if (empCode && seenCodes.has(empCode)) {
            errors.push(`Duplicate: Employee code '${empCode}' appears multiple times in file`);
            isDuplicate = true;
          }

          if (email && existingEmails.has(email)) {
            errors.push(`Duplicate: Email '${email}' is already registered to a user`);
            isDuplicate = true;
          } else if (email && seenEmails.has(email)) {
            errors.push(`Duplicate: Email '${email}' appears multiple times in file`);
            isDuplicate = true;
          }

          if (phone && existingPhones.has(phone)) {
            errors.push(`Duplicate: Phone '${phone}' is already registered`);
            isDuplicate = true;
          }

          if (empCode) seenCodes.add(empCode);
          if (email) seenEmails.add(email);

          const status = errors.length === 0 ? 'VALID' : isDuplicate ? 'DUPLICATE' : 'INVALID';
          if (status === 'VALID') validCount++;
          else if (status === 'DUPLICATE') duplicateCount++;
          else invalidCount++;

          previewRows.push({ rowNumber: rowNum, data: rowData, status, errors, isDuplicate });
        });
        break;
      }

      case 'customers': {
        this.validateRequiredHeaders(headers, ['name', 'phone']);
        const existingCustomers = await this.prisma.customer.findMany({
          select: { phone: true, email: true },
        });
        const existingPhones = new Set(existingCustomers.map((c) => c.phone));
        const existingEmails = new Set(
          existingCustomers.filter((c) => c.email).map((c) => c.email!.toLowerCase()),
        );

        const seenPhones = new Set<string>();
        const seenEmails = new Set<string>();

        dataRows.forEach((r, idx) => {
          const rowNum = idx + 2;
          const rowData = this.mapRow(headers, r);
          const errors: string[] = [];

          const name = (rowData['name'] || '').trim();
          const phone = (rowData['phone'] || '').trim();
          const email = (rowData['email'] || '').trim().toLowerCase();
          const custType = (rowData['customerType'] || 'INDIVIDUAL').trim().toUpperCase();

          if (!name) errors.push('Missing required field: name');
          if (!phone) errors.push('Missing required field: phone');

          if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
            errors.push(`Invalid phone format: '${phone}' (must be 10-15 digits)`);
          }

          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Invalid email format: '${email}'`);
          }

          if (custType && !['INDIVIDUAL', 'BUSINESS'].includes(custType)) {
            errors.push(`Invalid customerType '${custType}'. Must be INDIVIDUAL or BUSINESS.`);
          }

          let isDuplicate = false;
          if (phone && existingPhones.has(phone)) {
            errors.push(`Duplicate: Customer with phone '${phone}' already exists`);
            isDuplicate = true;
          } else if (phone && seenPhones.has(phone)) {
            errors.push(`Duplicate: Phone '${phone}' appears multiple times in file`);
            isDuplicate = true;
          }

          if (email && existingEmails.has(email)) {
            errors.push(`Duplicate: Customer with email '${email}' already exists`);
            isDuplicate = true;
          } else if (email && seenEmails.has(email)) {
            errors.push(`Duplicate: Email '${email}' appears multiple times in file`);
            isDuplicate = true;
          }

          if (phone) seenPhones.add(phone);
          if (email) seenEmails.add(email);

          const status = errors.length === 0 ? 'VALID' : isDuplicate ? 'DUPLICATE' : 'INVALID';
          if (status === 'VALID') validCount++;
          else if (status === 'DUPLICATE') duplicateCount++;
          else invalidCount++;

          previewRows.push({ rowNumber: rowNum, data: rowData, status, errors, isDuplicate });
        });
        break;
      }
    }

    return {
      entity: normalized,
      totalRows: dataRows.length,
      validRowsCount: validCount,
      invalidRowsCount: invalidCount,
      duplicateRowsCount: duplicateCount,
      canCommit: validCount > 0,
      headers,
      previewRows,
    };
  }

  // ==========================================
  // 4. CSV IMPORT EXECUTION (Controlled Transactions)
  // ==========================================
  async executeImport(
    entity: string,
    csvContent: string,
    skipDuplicates = true,
    user: any,
  ): Promise<ImportExecutionResult> {
    const preview = await this.previewImport(entity, csvContent, user);
    const normalized = entity.toLowerCase();
    const rowsToProcess = preview.previewRows.filter((r) => {
      if (r.status === 'VALID') return true;
      if (r.status === 'DUPLICATE' && !skipDuplicates) return false;
      return false;
    });

    const failedRows: Array<{ rowNumber: number; reason: string; data: any }> = [];
    preview.previewRows
      .filter((r) => r.status === 'INVALID' || (r.status === 'DUPLICATE' && skipDuplicates))
      .forEach((r) => {
        failedRows.push({
          rowNumber: r.rowNumber,
          reason: r.errors.join('; '),
          data: r.data,
        });
      });

    let importedCount = 0;
    const actorUserId = user?.id;

    switch (normalized) {
      case 'franchises': {
        await this.prisma.$transaction(async (tx) => {
          for (const row of rowsToProcess) {
            const d = row.data;
            await tx.franchise.create({
              data: {
                code: d['code'].trim().toUpperCase(),
                name: d['name'].trim(),
                legalName: d['legalName']?.trim() || null,
                taxId: d['taxId']?.trim() || null,
                status: (d['status']?.trim().toUpperCase() || 'ACTIVE'),
              },
            });
            importedCount++;
          }
        });
        break;
      }

      case 'branches': {
        await this.prisma.$transaction(async (tx) => {
          for (const row of rowsToProcess) {
            const d = row.data;
            const franCode = d['franchiseCode'].trim().toUpperCase();
            const franchise = await tx.franchise.findUnique({ where: { code: franCode } });
            if (!franchise) {
              failedRows.push({
                rowNumber: row.rowNumber,
                reason: `Franchise '${franCode}' could not be resolved`,
                data: d,
              });
              continue;
            }

            await tx.branch.create({
              data: {
                franchiseId: franchise.id,
                code: d['code'].trim().toUpperCase(),
                name: d['name'].trim(),
                address: d['address']?.trim() || null,
                city: d['city']?.trim() || null,
                state: d['state']?.trim() || null,
                status: (d['status']?.trim().toUpperCase() || 'ACTIVE'),
              },
            });
            importedCount++;
          }
        });
        break;
      }

      case 'employees': {
        const defaultPasswordHash = await bcrypt.hash('Titan@2026!', 10);

        for (const row of rowsToProcess) {
          const d = row.data;
          try {
            await this.prisma.$transaction(async (tx) => {
              const branchCode = d['branchCode'].trim().toUpperCase();
              const branch = await tx.branch.findUnique({ where: { code: branchCode } });
              if (!branch) {
                throw new Error(`Branch '${branchCode}' not found`);
              }

              const roleName = d['roleName'].trim().toUpperCase();
              const role = await tx.role.findUnique({ where: { name: roleName } });
              if (!role) {
                throw new Error(`Role '${roleName}' not found`);
              }

              const password = d['initialPassword']?.trim() || 'Titan@2026!';
              const passwordHash =
                password === 'Titan@2026!'
                  ? defaultPasswordHash
                  : await bcrypt.hash(password, 10);

              // 1. Create User in PENDING state
              const newUser = await tx.user.create({
                data: {
                  email: d['email'].trim().toLowerCase(),
                  phone: d['phone']?.trim() || null,
                  passwordHash,
                  accountType: 'EMPLOYEE',
                  status: 'PENDING',
                },
              });

              // 2. Create Employee in PENDING_APPROVAL state
              const newEmp = await tx.employee.create({
                data: {
                  userId: newUser.id,
                  branchId: branch.id,
                  employeeCode: d['employeeCode'].trim().toUpperCase(),
                  firstName: d['firstName'].trim(),
                  lastName: d['lastName'].trim(),
                  designation: d['designation']?.trim() || null,
                  status: 'PENDING_APPROVAL',
                },
              });

              // 3. Create EmployeeApprovalRequest in PENDING state
              await tx.employeeApprovalRequest.create({
                data: {
                  employeeId: newEmp.id,
                  requestedByUserId: actorUserId || newUser.id,
                  assignedRoleId: role.id,
                  status: 'PENDING',
                },
              });

              importedCount++;
            });
          } catch (err: any) {
            failedRows.push({
              rowNumber: row.rowNumber,
              reason: err.message || 'Transaction commit failed',
              data: d,
            });
          }
        }
        break;
      }

      case 'customers': {
        await this.prisma.$transaction(async (tx) => {
          for (const row of rowsToProcess) {
            const d = row.data;
            const franCode = d['franchiseCode']?.trim().toUpperCase();
            let franchiseId: string | null = null;
            if (franCode) {
              const fran = await tx.franchise.findUnique({ where: { code: franCode } });
              if (fran) franchiseId = fran.id;
            }

            const custType = (d['customerType']?.trim().toUpperCase() || 'INDIVIDUAL') as any;

            const newCust = await tx.customer.create({
              data: {
                name: d['name'].trim(),
                phone: d['phone'].trim(),
                email: d['email']?.trim().toLowerCase() || null,
                customerType: custType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL',
                companyName: d['companyName']?.trim() || null,
                address: d['address']?.trim() || null,
                city: d['city']?.trim() || null,
                state: d['state']?.trim() || null,
                pincode: d['pincode']?.trim() || null,
                gstin: d['gstin']?.trim() || null,
                status: 'ACTIVE',
              },
            });

            if (franchiseId) {
              await tx.customerFranchise.create({
                data: {
                  customerId: newCust.id,
                  franchiseId,
                },
              }).catch(() => {});
            }
            importedCount++;
          }
        });
        break;
      }
    }

    // Audit log
    await this.auditService.log({
      actorUserId,
      action: `CSV_IMPORT_${normalized.toUpperCase()}`,
      entityType: normalized,
      metadata: {
        totalRows: preview.totalRows,
        importedCount,
        skippedOrFailedCount: failedRows.length,
      },
    }).catch(() => {});

    // Generate error report CSV if there are any failures or skipped duplicates
    let errorReportCsv: string | undefined = undefined;
    if (failedRows.length > 0) {
      const errorReportRows: string[][] = [
        ['Row Number', 'Reason', ...preview.headers],
      ];
      failedRows.forEach((fr) => {
        const rawFields = preview.headers.map((h) => fr.data[h] || '');
        errorReportRows.push([String(fr.rowNumber), fr.reason, ...rawFields]);
      });
      errorReportCsv = stringifyCsv(errorReportRows);
    }

    return {
      success: importedCount > 0,
      entity: normalized,
      totalRows: preview.totalRows,
      importedCount,
      skippedCount: skipDuplicates ? preview.duplicateRowsCount : 0,
      failedCount: failedRows.length,
      errors: failedRows,
      errorReportCsv,
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================
  private mapRow(headers: string[], row: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx].trim() : '';
    });
    return obj;
  }

  private validateRequiredHeaders(headers: string[], required: string[]) {
    const missing = required.filter(
      (req) => !headers.some((h) => h.toLowerCase() === req.toLowerCase()),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `Malformed CSV: Missing required column headers: [${missing.join(', ')}]. Expected headers: [${required.join(', ')}]`,
      );
    }
  }

  private assertImportAuthorization(entity: string, user: any) {
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');

    if (entity === 'franchises' || entity === 'branches') {
      if (!isSuperAdmin) {
        throw new ForbiddenException(
          `Unauthorized: Only SUPER_ADMIN accounts can import ${entity} into Titan Auto.`,
        );
      }
    } else if (entity === 'employees') {
      const canManageEmp =
        isSuperAdmin ||
        roles.some((r) =>
          ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER'].includes(r),
        );
      if (!canManageEmp) {
        throw new ForbiddenException(
          'Unauthorized: You do not possess employee management privileges to import staff.',
        );
      }
    } else if (entity === 'customers') {
      if (user?.accountType === 'CUSTOMER' && !isSuperAdmin) {
        throw new ForbiddenException('Unauthorized: Customers cannot import customer datasets.');
      }
    }
  }
}
