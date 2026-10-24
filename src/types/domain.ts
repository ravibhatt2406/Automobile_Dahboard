export interface Franchise {
  id: string;
  name: string;
  code: string;
  brand: string;
  logoUrl?: string;
  ownerId?: string;
  ownerName?: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  legalName?: string;
  taxId?: string;
  totalBranches: number;
  status: 'active' | 'inactive';
  branches?: Branch[];
  createdAt: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  franchiseId: string;
  franchiseName: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE' | string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[]; // Support multiple roles e.g. ['BRANCH_MANAGER', 'SALES_EMPLOYEE']
  franchiseId?: string;
  franchiseName?: string;
  branchId?: string;
  branchName?: string;
  department: string;
  designation: string;
  status: 'active' | 'inactive' | 'on_leave' | 'pending_approval';
  joinedAt: string;
}

export interface EmployeeApproval {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedRole: string;
  branchName: string;
  requestedBy: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Customer {
  id: string;
  name?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxId?: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  fleetSize: number;
  customerType: 'corporate' | 'individual' | 'government';
  status: 'active' | 'lead' | 'inactive';
  preferredBranchId?: string | null;
  preferredBranch?: {
    id: string;
    code: string;
    name: string;
    city: string;
    state?: string;
  } | null;
  createdAt: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quotation'
  | 'negotiation'
  | 'booked'
  | 'lost'
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST';

export type LeadActivityType =
  | 'CALL'
  | 'MEETING'
  | 'NOTE'
  | 'TEST_DRIVE'
  | 'FOLLOW_UP'
  | 'STAGE_CHANGE';

export interface LeadActivity {
  id: string;
  leadId: string;
  employeeId?: string | null;
  activityType: LeadActivityType;
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  metadata?: any;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    designation?: string;
  } | null;
}

export interface Lead {
  id: string;
  leadNumber?: string;
  customerName?: string;
  prospectName?: string;
  companyName?: string;
  email?: string;
  prospectEmail?: string;
  phone?: string;
  prospectPhone?: string;
  requirement?: string;
  interestedModel?: string;
  expectedBudget?: number | string;
  estimatedUnits?: number;
  source: string;
  branchId?: string;
  branch?: { id: string; name: string; code?: string; franchise?: { id: string; name: string } };
  customerId?: string | null;
  customer?: any;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedEmployee?: any;
  status: LeadStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedPurchaseDate?: string;
  nextFollowUpDate?: string;
  lostReason?: string;
  notes?: string;
  activities?: LeadActivity[];
  quotations?: any[];
  followUps?: any[];
  createdAt: string;
  updatedAt?: string;
}

export type AnnouncementCategory =
  | 'GENERAL'
  | 'OPERATIONS'
  | 'SALES'
  | 'SERVICE'
  | 'FINANCE'
  | 'HR'
  | 'URGENT';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';

export type AnnouncementAudience =
  | 'PLATFORM_WIDE'
  | 'FRANCHISE'
  | 'BRANCH'
  | 'SELECTED_BRANCHES';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  audienceType: AnnouncementAudience;
  franchiseId?: string | null;
  branchId?: string | null;
  targetBranchIds?: string[];
  startDate?: string | null;
  expiryDate?: string | null;
  publishedAt?: string | null;
  authorId?: string;
  authorEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    email: string;
    employeeProfile?: {
      firstName: string;
      lastName: string;
      designation?: string;
    };
  };
  franchise?: { id: string; name: string; code: string };
  branch?: { id: string; name: string; code: string };
  isRead?: boolean;
  readsCount?: number;
  readAt?: string | null;
}

export type VehicleStatus =
  | 'IN_STOCK'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'PDI_PENDING'
  | 'PDI_COMPLETED'
  | 'SERVICE'
  | 'DELIVERED'
  | 'SOLD'
  | 'TRANSFERRED'
  | 'BLOCKED';

export type ServiceJobStatus =
  | 'OPEN'
  | 'CHECKED_IN'
  | 'DIAGNOSIS'
  | 'WAITING_FOR_APPROVAL'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'QUALITY_CHECK'
  | 'READY_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Vehicle {
  id: string;
  vin: string;
  chassisNumber?: string;
  engineNumber?: string;
  registrationNumber?: string;
  make: string;
  model: string;
  variant?: string;
  vehicleType: string;
  year?: number;
  manufacturingYear?: number; // backend field
  color: string;
  fuelType: string;
  transmission?: string;
  engineSpec?: string;
  gvw?: string; // Gross Vehicle Weight
  franchiseId?: string;
  franchiseName?: string;
  branchId?: string;
  branchName?: string;
  branch?: { id: string; name: string; franchiseId?: string };
  variant_details?: { id: string; name: string; model?: { name: string; manufacturer?: { name: string } } };
  stockLocation?: string;
  purchasePrice?: number;
  baseCost?: number; // backend invoice cost field
  exShowroomPrice?: number;
  sellingPrice?: number;
  gstRate?: number;
  status: VehicleStatus | string;
  photos?: string[]; // List of uploaded image data URLs or file paths
  images?: string[]; // backend field name
  primaryPhoto?: string;
  threeDModelUrl?: string;
  createdAt: string;
}

export type QuotationStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'expired';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleModel: string;
  items: QuotationItem[];
  accessoriesAmount: number;
  insuranceAmount: number;
  financeAmount: number;
  discountAmount: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  status: QuotationStatus;
  validUntil: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  quotationId?: string;
  vehicleId: string;
  vehicleModel: string;
  bookingAmount: number;
  totalPrice: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  financeStatus: 'not_applied' | 'pending' | 'approved' | 'disbursed';
  insuranceStatus: 'pending' | 'active' | 'expired';
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  expectedDeliveryDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  bookingId?: string;
  invoiceId?: string;
  customerName: string;
  amount: number;
  method: 'wire_transfer' | 'credit_card' | 'cheque' | 'cash' | 'net_banking';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  date: string;
}

export interface FinanceApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  customerName: string;
  bookingId?: string;
  provider: string;
  loanAmount: number;
  tenureMonths: number;
  interestRate: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  status: 'applied' | 'under_review' | 'approved' | 'disbursed' | 'rejected';
  createdAt: string;
}

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  provider: string;
  vehicleId?: string;
  vehicleVin: string;
  customerId: string;
  customerName: string;
  type: 'comprehensive' | 'third_party' | 'zero_depth' | 'commercial_carrier';
  premiumAmount: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'pending_renewal' | 'expired';
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  taxableAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  totalAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customer?: {
    id: string;
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstin?: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
  };
  bookingId?: string | null;
  booking?: {
    id: string;
    bookingNumber: string;
    totalAmount: number;
  } | null;
  vehicleId?: string | null;
  vehicle?: {
    id: string;
    vin: string;
    make: string;
    model: string;
    variant?: string;
  } | null;
  serviceJobs?: Array<{
    id: string;
    jobNumber?: string;
    jobCardNumber?: string;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    gateway?: string;
    gatewayPaymentId?: string;
    paidAt?: string;
    createdAt?: string;
  }>;
  billingAddress?: string;
  gstin?: string | null;
  vehicleVin?: string;
  type?: 'vehicle_sale' | 'service' | 'parts' | string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount?: number;
  cgst?: number;
  cgstAmount?: number;
  sgst?: number;
  sgstAmount?: number;
  igst?: number;
  igstAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | string;
  dueDate?: string;
  status:
    | 'draft'
    | 'unpaid'
    | 'partially_paid'
    | 'paid'
    | 'overdue'
    | 'DRAFT'
    | 'ISSUED'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'CANCELLED';
  issuedAt?: string;
  createdAt: string;
}

export interface PdiChecklistItem {
  id: string;
  task: string;
  passed: boolean;
  notes?: string;
}

export interface PdiInspection {
  id: string;
  vehicleVin: string;
  vehicleModel: string;
  inspectorName: string;
  inspectionDate: string;
  checklist: PdiChecklistItem[];
  status: 'passed' | 'failed' | 'in_progress';
  remarks?: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  bookingId: string;
  customerName: string;
  vehicleVin: string;
  vehicleModel: string;
  driverName?: string;
  destinationAddress: string;
  odometerReading?: number;
  documentsVerified: boolean;
  status: 'scheduled' | 'pdi_pending' | 'in_transit' | 'delivered' | 'delayed';
  deliveryDate: string;
}

export type ServiceWorkflowStage =
  | 'appointment'
  | 'job_card'
  | 'diagnosis'
  | 'mechanic_assignment'
  | 'work_in_progress'
  | 'quality_check'
  | 'invoice'
  | 'completed';

export interface ServiceJob {
  id: string;
  jobNumber?: string;
  jobCardNumber: string;
  vehicleVin: string;
  vehicleModel: string;
  vehicle?: any;
  customerId: string;
  customerName: string;
  customer?: any;
  branchId: string;
  branchName: string;
  branch?: any;
  mechanicId?: string;
  mechanicName?: string;
  assignedMechanic?: any;
  serviceAdvisorId?: string;
  serviceAdvisor?: any;
  advisorName?: string;
  complaint: string;
  diagnosis?: string;
  stage: ServiceWorkflowStage;
  serviceType: 'routine' | 'repair' | 'overhaul' | 'inspection' | string;
  status: ServiceJobStatus | 'received' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered';
  estimatedCost: number;
  actualCost?: number;
  hasPendingParts?: boolean;
  pendingPartsCount?: number;
  jobParts?: any[];
  diagnoses?: any[];
  qcInspections?: any[];
  serviceInvoice?: any;
  estimatedCompletionTime?: string;
  actualCompletionTime?: string;
  scheduledDate: string;
  createdAt: string;
}

export interface ServiceAppointment {
  id: string;
  appointmentNumber: string;
  customerId: string;
  customerName: string;
  vehicleVin: string;
  vehicleModel: string;
  preferredDate: string;
  serviceType: string;
  branchId: string;
  branchName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  brand: string;
  branchName?: string;
  compatibleModels: string[];
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  locationRack?: string;
}

export interface StockAdjustment {
  id: string;
  partId: string;
  partName: string;
  previousQuantity: number;
  adjustedQuantity: number;
  reason: string;
  adjustedBy: string;
  date: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TruckModel {
  id: string;
  manufacturerId: string;
  name: string;
  category?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TruckVariant {
  id: string;
  modelId: string;
  name: string;
  engineDetails?: string;
  horsepower?: number;
  fuelType?: string;
  transmission?: string;
  payload?: number;
  basePrice: number;
  gstRate?: number;
  description?: string;
  specifications?: Record<string, any>;
  images?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

