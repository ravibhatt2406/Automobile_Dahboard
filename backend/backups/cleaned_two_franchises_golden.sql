--
-- PostgreSQL database dump
--

\restrict EcJJeAIsS9USx5J3InwmiwD55qrOA5D3FmvEU4zxKL6DN4RWZa9Igf5WsHAKl0j

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AccountType" AS ENUM (
    'CUSTOMER',
    'EMPLOYEE',
    'SUPER_ADMIN'
);


ALTER TYPE public."AccountType" OWNER TO titan_admin;

--
-- Name: AnnouncementAudience; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AnnouncementAudience" AS ENUM (
    'PLATFORM_WIDE',
    'FRANCHISE',
    'BRANCH',
    'SELECTED_BRANCHES'
);


ALTER TYPE public."AnnouncementAudience" OWNER TO titan_admin;

--
-- Name: AnnouncementCategory; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AnnouncementCategory" AS ENUM (
    'GENERAL',
    'OPERATIONS',
    'SALES',
    'SERVICE',
    'FINANCE',
    'HR',
    'URGENT'
);


ALTER TYPE public."AnnouncementCategory" OWNER TO titan_admin;

--
-- Name: AnnouncementPriority; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AnnouncementPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."AnnouncementPriority" OWNER TO titan_admin;

--
-- Name: AnnouncementStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AnnouncementStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."AnnouncementStatus" OWNER TO titan_admin;

--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'REQUESTED',
    'CONFIRMED',
    'RESCHEDULED',
    'CHECKED_IN',
    'CONVERTED_TO_JOB',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."AppointmentStatus" OWNER TO titan_admin;

--
-- Name: ApprovalDecision; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ApprovalDecision" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalDecision" OWNER TO titan_admin;

--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalStatus" OWNER TO titan_admin;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'CONVERTED_TO_DELIVERY'
);


ALTER TYPE public."BookingStatus" OWNER TO titan_admin;

--
-- Name: CampaignStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."CampaignStatus" AS ENUM (
    'UPCOMING',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."CampaignStatus" OWNER TO titan_admin;

--
-- Name: ComplianceDocStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ComplianceDocStatus" AS ENUM (
    'VALID',
    'EXPIRING_SOON',
    'EXPIRED',
    'PENDING_VERIFICATION',
    'REJECTED'
);


ALTER TYPE public."ComplianceDocStatus" OWNER TO titan_admin;

--
-- Name: ComplianceDocType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ComplianceDocType" AS ENUM (
    'INSURANCE',
    'PUC',
    'FITNESS_CERTIFICATE',
    'ROAD_PERMIT',
    'REGISTRATION_RC',
    'ROAD_TAX',
    'OTHER'
);


ALTER TYPE public."ComplianceDocType" OWNER TO titan_admin;

--
-- Name: ConversationStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ConversationStatus" AS ENUM (
    'OPEN',
    'ASSIGNED',
    'CLOSED'
);


ALTER TYPE public."ConversationStatus" OWNER TO titan_admin;

--
-- Name: CustomerStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."CustomerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."CustomerStatus" OWNER TO titan_admin;

--
-- Name: CustomerType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."CustomerType" AS ENUM (
    'INDIVIDUAL',
    'BUSINESS'
);


ALTER TYPE public."CustomerType" OWNER TO titan_admin;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'PENDING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO titan_admin;

--
-- Name: EmiScheduleStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."EmiScheduleStatus" AS ENUM (
    'UPCOMING',
    'DUE',
    'PAID',
    'PARTIALLY_PAID',
    'OVERDUE'
);


ALTER TYPE public."EmiScheduleStatus" OWNER TO titan_admin;

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING_APPROVAL',
    'TERMINATED'
);


ALTER TYPE public."EmployeeStatus" OWNER TO titan_admin;

--
-- Name: FinanceStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."FinanceStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'DISBURSED',
    'CANCELLED'
);


ALTER TYPE public."FinanceStatus" OWNER TO titan_admin;

--
-- Name: InsuranceStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."InsuranceStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."InsuranceStatus" OWNER TO titan_admin;

--
-- Name: InvoicePaymentStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."InvoicePaymentStatus" AS ENUM (
    'UNPAID',
    'PARTIALLY_PAID',
    'PAID'
);


ALTER TYPE public."InvoicePaymentStatus" OWNER TO titan_admin;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'ISSUED',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO titan_admin;

--
-- Name: LeadActivityType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."LeadActivityType" AS ENUM (
    'NOTE',
    'CALL',
    'MEETING',
    'TEST_DRIVE',
    'STAGE_CHANGE',
    'FOLLOW_UP'
);


ALTER TYPE public."LeadActivityType" OWNER TO titan_admin;

--
-- Name: LeadPriority; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."LeadPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."LeadPriority" OWNER TO titan_admin;

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."LeadStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CONVERTED',
    'LOST'
);


ALTER TYPE public."LeadStatus" OWNER TO titan_admin;

--
-- Name: MessageSenderType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."MessageSenderType" AS ENUM (
    'CUSTOMER',
    'EMPLOYEE'
);


ALTER TYPE public."MessageSenderType" OWNER TO titan_admin;

--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS',
    'PUSH',
    'WHATSAPP'
);


ALTER TYPE public."NotificationChannel" OWNER TO titan_admin;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ'
);


ALTER TYPE public."NotificationStatus" OWNER TO titan_admin;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'CREATED',
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO titan_admin;

--
-- Name: PdiStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."PdiStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'PASSED',
    'FAILED'
);


ALTER TYPE public."PdiStatus" OWNER TO titan_admin;

--
-- Name: QcStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."QcStatus" AS ENUM (
    'PENDING',
    'PASSED',
    'FAILED'
);


ALTER TYPE public."QcStatus" OWNER TO titan_admin;

--
-- Name: QuotationStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."QuotationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'CONVERTED'
);


ALTER TYPE public."QuotationStatus" OWNER TO titan_admin;

--
-- Name: ReminderCategory; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ReminderCategory" AS ENUM (
    'SERVICE_DUE',
    'INSURANCE_EXPIRY',
    'COMPLIANCE_EXPIRY',
    'EMI_DUE',
    'GENERAL'
);


ALTER TYPE public."ReminderCategory" OWNER TO titan_admin;

--
-- Name: ReminderStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ReminderStatus" AS ENUM (
    'PREPARED',
    'USER_INITIATED',
    'SENT',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."ReminderStatus" OWNER TO titan_admin;

--
-- Name: ServiceJobStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."ServiceJobStatus" AS ENUM (
    'OPEN',
    'CHECKED_IN',
    'DIAGNOSIS',
    'WAITING_FOR_APPROVAL',
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'QUALITY_CHECK',
    'READY_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ServiceJobStatus" OWNER TO titan_admin;

--
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'PURCHASE',
    'ADJUSTMENT',
    'RESERVATION',
    'RELEASE',
    'ISSUE',
    'RETURN',
    'TRANSFER'
);


ALTER TYPE public."StockMovementType" OWNER TO titan_admin;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING'
);


ALTER TYPE public."UserStatus" OWNER TO titan_admin;

--
-- Name: VehicleStatus; Type: TYPE; Schema: public; Owner: titan_admin
--

CREATE TYPE public."VehicleStatus" AS ENUM (
    'IN_STOCK',
    'RESERVED',
    'ALLOCATED',
    'PDI_PENDING',
    'PDI_COMPLETED',
    'DELIVERED',
    'SOLD',
    'SERVICE',
    'TRANSFERRED',
    'BLOCKED'
);


ALTER TYPE public."VehicleStatus" OWNER TO titan_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.announcement_reads (
    id text NOT NULL,
    announcement_id text NOT NULL,
    user_id text NOT NULL,
    read_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.announcement_reads OWNER TO titan_admin;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.announcements (
    id text NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category public."AnnouncementCategory" DEFAULT 'GENERAL'::public."AnnouncementCategory" NOT NULL,
    priority public."AnnouncementPriority" DEFAULT 'NORMAL'::public."AnnouncementPriority" NOT NULL,
    status public."AnnouncementStatus" DEFAULT 'DRAFT'::public."AnnouncementStatus" NOT NULL,
    target_audience public."AnnouncementAudience" DEFAULT 'PLATFORM_WIDE'::public."AnnouncementAudience" NOT NULL,
    franchise_id text,
    branch_id text,
    target_branch_ids text[] DEFAULT '{}'::text[] NOT NULL,
    author_user_id text NOT NULL,
    author_name character varying(255),
    author_role character varying(100),
    start_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expiry_date timestamp(3) without time zone,
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.announcements OWNER TO titan_admin;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    actor_user_id text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO titan_admin;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    booking_number text NOT NULL,
    customer_id text NOT NULL,
    quotation_id text NOT NULL,
    vehicle_id text,
    branch_id text NOT NULL,
    salesperson_employee_id text NOT NULL,
    booking_amount numeric(65,30) NOT NULL,
    total_amount numeric(65,30) NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    booking_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cancellation_reason text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bookings OWNER TO titan_admin;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.branches (
    id text NOT NULL,
    franchise_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    state text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.branches OWNER TO titan_admin;

--
-- Name: campaign_expenses; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.campaign_expenses (
    id text NOT NULL,
    campaign_id text NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'LOGISTICS'::text NOT NULL,
    amount numeric(65,30) NOT NULL,
    expense_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recorded_by_id text,
    receipt_url text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campaign_expenses OWNER TO titan_admin;

--
-- Name: campaign_members; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.campaign_members (
    id text NOT NULL,
    campaign_id text NOT NULL,
    employee_id text NOT NULL,
    role_in_camp text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campaign_members OWNER TO titan_admin;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    coordinator_id text,
    franchise_id text NOT NULL,
    branch_id text NOT NULL,
    budget numeric(65,30) DEFAULT 0 NOT NULL,
    status public."CampaignStatus" DEFAULT 'UPCOMING'::public."CampaignStatus" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.campaigns OWNER TO titan_admin;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    conversation_id text NOT NULL,
    sender_user_id text NOT NULL,
    sender_type public."MessageSenderType" NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO titan_admin;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    customer_id text NOT NULL,
    branch_id text NOT NULL,
    assigned_employee_id text,
    subject text,
    context_type text DEFAULT 'GENERAL'::text NOT NULL,
    context_id text DEFAULT 'NONE'::text NOT NULL,
    status public."ConversationStatus" DEFAULT 'OPEN'::public."ConversationStatus" NOT NULL,
    last_message_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO titan_admin;

--
-- Name: customer_franchises; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.customer_franchises (
    customer_id text NOT NULL,
    franchise_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.customer_franchises OWNER TO titan_admin;

--
-- Name: customer_reminders; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.customer_reminders (
    id text NOT NULL,
    customer_id text NOT NULL,
    vehicle_id text,
    branch_id text NOT NULL,
    category public."ReminderCategory" NOT NULL,
    recipient_name text NOT NULL,
    recipient_phone text NOT NULL,
    reference_type text DEFAULT 'NONE'::text NOT NULL,
    reference_id text,
    due_date timestamp(3) without time zone,
    message_template text,
    draft_message text NOT NULL,
    channel public."NotificationChannel" DEFAULT 'WHATSAPP'::public."NotificationChannel" NOT NULL,
    status public."ReminderStatus" DEFAULT 'PREPARED'::public."ReminderStatus" NOT NULL,
    initiated_at timestamp(3) without time zone,
    sent_at timestamp(3) without time zone,
    external_message_id text,
    prepared_by_user_id text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customer_reminders OWNER TO titan_admin;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.customers (
    id text NOT NULL,
    user_id text,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    city text,
    state text,
    pincode text,
    gstin text,
    customer_type public."CustomerType" DEFAULT 'INDIVIDUAL'::public."CustomerType" NOT NULL,
    company_name text,
    status public."CustomerStatus" DEFAULT 'ACTIVE'::public."CustomerStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    preferred_branch_id text,
    pan text
);


ALTER TABLE public.customers OWNER TO titan_admin;

--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.deliveries (
    id text NOT NULL,
    delivery_number text NOT NULL,
    customer_id text NOT NULL,
    vehicle_id text NOT NULL,
    booking_id text NOT NULL,
    invoice_id text NOT NULL,
    delivery_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delivery_location text NOT NULL,
    delivery_employee_id text NOT NULL,
    odometer_reading double precision DEFAULT 0 NOT NULL,
    customer_acknowledgement boolean DEFAULT true NOT NULL,
    documents_key text,
    status public."DeliveryStatus" DEFAULT 'COMPLETED'::public."DeliveryStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.deliveries OWNER TO titan_admin;

--
-- Name: employee_approval_requests; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.employee_approval_requests (
    id text NOT NULL,
    employee_id text NOT NULL,
    requested_by_user_id text NOT NULL,
    assigned_role_id text NOT NULL,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    approved_by_user_id text,
    rejection_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employee_approval_requests OWNER TO titan_admin;

--
-- Name: employee_role_assignments; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.employee_role_assignments (
    id text NOT NULL,
    employee_id text NOT NULL,
    role_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by text
);


ALTER TABLE public.employee_role_assignments OWNER TO titan_admin;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.employees (
    id text NOT NULL,
    user_id text NOT NULL,
    branch_id text NOT NULL,
    employee_code text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    designation text,
    status public."EmployeeStatus" DEFAULT 'PENDING_APPROVAL'::public."EmployeeStatus" NOT NULL,
    hired_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employees OWNER TO titan_admin;

--
-- Name: file_attachments; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.file_attachments (
    id text NOT NULL,
    file_id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    storage_key text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    uploaded_by_user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.file_attachments OWNER TO titan_admin;

--
-- Name: finance_applications; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.finance_applications (
    id text NOT NULL,
    application_number text NOT NULL,
    customer_id text NOT NULL,
    booking_id text NOT NULL,
    finance_provider text NOT NULL,
    loan_amount numeric(65,30) NOT NULL,
    down_payment numeric(65,30) NOT NULL,
    tenure_months integer NOT NULL,
    interest_rate numeric(65,30),
    status public."FinanceStatus" DEFAULT 'DRAFT'::public."FinanceStatus" NOT NULL,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    disbursed_at timestamp(3) without time zone,
    emi_amount numeric(65,30),
    first_emi_date timestamp(3) without time zone,
    loan_reference text
);


ALTER TABLE public.finance_applications OWNER TO titan_admin;

--
-- Name: finance_emi_schedules; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.finance_emi_schedules (
    id text NOT NULL,
    finance_application_id text NOT NULL,
    installment_number integer NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    emi_amount numeric(65,30) NOT NULL,
    principal_component numeric(65,30) DEFAULT 0 NOT NULL,
    interest_component numeric(65,30) DEFAULT 0 NOT NULL,
    paid_amount numeric(65,30) DEFAULT 0 NOT NULL,
    status public."EmiScheduleStatus" DEFAULT 'UPCOMING'::public."EmiScheduleStatus" NOT NULL,
    paid_at timestamp(3) without time zone,
    payment_reference text,
    payment_mode text,
    receipt_url text,
    recorded_by_employee_id text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.finance_emi_schedules OWNER TO titan_admin;

--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.follow_ups (
    id text NOT NULL,
    lead_id text NOT NULL,
    employee_id text NOT NULL,
    scheduled_at timestamp(3) without time zone NOT NULL,
    completed_at timestamp(3) without time zone,
    notes text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.follow_ups OWNER TO titan_admin;

--
-- Name: franchises; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.franchises (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    legal_name text,
    tax_id text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.franchises OWNER TO titan_admin;

--
-- Name: insurance_policies; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.insurance_policies (
    id text NOT NULL,
    policy_number text NOT NULL,
    customer_id text NOT NULL,
    booking_id text NOT NULL,
    insurer text NOT NULL,
    policy_type text NOT NULL,
    premium numeric(65,30) NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    expiry_date timestamp(3) without time zone NOT NULL,
    status public."InsuranceStatus" DEFAULT 'PENDING'::public."InsuranceStatus" NOT NULL,
    document_key text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.insurance_policies OWNER TO titan_admin;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.invoice_items (
    id text NOT NULL,
    invoice_id text NOT NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(65,30) NOT NULL,
    taxable_amount numeric(65,30) NOT NULL,
    gst_rate numeric(65,30) DEFAULT 28.00 NOT NULL,
    gst_amount numeric(65,30) NOT NULL,
    total_amount numeric(65,30) NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO titan_admin;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    invoice_number text NOT NULL,
    customer_id text NOT NULL,
    vehicle_id text,
    booking_id text,
    franchise_id text NOT NULL,
    branch_id text NOT NULL,
    billing_address text NOT NULL,
    gstin text,
    subtotal numeric(65,30) NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    taxable_amount numeric(65,30) NOT NULL,
    cgst_amount numeric(65,30) DEFAULT 0 NOT NULL,
    sgst_amount numeric(65,30) DEFAULT 0 NOT NULL,
    igst_amount numeric(65,30) DEFAULT 0 NOT NULL,
    total_amount numeric(65,30) NOT NULL,
    payment_status public."InvoicePaymentStatus" DEFAULT 'UNPAID'::public."InvoicePaymentStatus" NOT NULL,
    status public."InvoiceStatus" DEFAULT 'ISSUED'::public."InvoiceStatus" NOT NULL,
    issued_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoices OWNER TO titan_admin;

--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.lead_activities (
    id text NOT NULL,
    lead_id text NOT NULL,
    employee_id text,
    activity_type public."LeadActivityType" DEFAULT 'NOTE'::public."LeadActivityType" NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    scheduled_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lead_activities OWNER TO titan_admin;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.leads (
    id text NOT NULL,
    customer_id text,
    franchise_id text NOT NULL,
    branch_id text NOT NULL,
    assigned_employee_id text,
    source text DEFAULT 'DIRECT_WALKIN'::text NOT NULL,
    interested_model text,
    expected_purchase_date timestamp(3) without time zone,
    expected_budget numeric(65,30),
    status public."LeadStatus" DEFAULT 'NEW'::public."LeadStatus" NOT NULL,
    priority public."LeadPriority" DEFAULT 'MEDIUM'::public."LeadPriority" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    lost_reason text,
    campaign_id text,
    lead_number character varying(50),
    prospect_name character varying(255),
    prospect_phone character varying(50),
    prospect_email character varying(255),
    company_name character varying(255)
);


ALTER TABLE public.leads OWNER TO titan_admin;

--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.manufacturers (
    id text NOT NULL,
    name text NOT NULL,
    country text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.manufacturers OWNER TO titan_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text,
    customer_id text,
    channel public."NotificationChannel" DEFAULT 'IN_APP'::public."NotificationChannel" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    metadata jsonb,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO titan_admin;

--
-- Name: part_stock_movements; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.part_stock_movements (
    id text NOT NULL,
    part_stock_id text NOT NULL,
    movement_type public."StockMovementType" NOT NULL,
    quantity integer NOT NULL,
    reference_ref text,
    notes text,
    actor_user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.part_stock_movements OWNER TO titan_admin;

--
-- Name: part_stocks; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.part_stocks (
    id text NOT NULL,
    part_id text NOT NULL,
    branch_id text NOT NULL,
    quantity_on_hand integer DEFAULT 0 NOT NULL,
    quantity_reserved integer DEFAULT 0 NOT NULL,
    reorder_threshold integer DEFAULT 5 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.part_stocks OWNER TO titan_admin;

--
-- Name: parts; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.parts (
    id text NOT NULL,
    part_number text NOT NULL,
    name text NOT NULL,
    description text,
    manufacturer text,
    category text,
    unit_price numeric(65,30) NOT NULL,
    gst_rate numeric(65,30) DEFAULT 18.00 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.parts OWNER TO titan_admin;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.payments (
    id text NOT NULL,
    booking_id text NOT NULL,
    invoice_id text,
    gateway text DEFAULT 'BANK_TRANSFER'::text NOT NULL,
    gateway_order_id text,
    gateway_payment_id text,
    idempotency_key text,
    amount numeric(65,30) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'CREATED'::public."PaymentStatus" NOT NULL,
    payment_method text,
    metadata jsonb,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO titan_admin;

--
-- Name: pdi_inspections; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.pdi_inspections (
    id text NOT NULL,
    vehicle_id text NOT NULL,
    booking_id text,
    inspector_user_id text NOT NULL,
    inspection_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."PdiStatus" DEFAULT 'PENDING'::public."PdiStatus" NOT NULL,
    checklist jsonb NOT NULL,
    failed_items text[] DEFAULT ARRAY[]::text[],
    remarks text,
    images text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pdi_inspections OWNER TO titan_admin;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    module text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.permissions OWNER TO titan_admin;

--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.quotation_items (
    id text NOT NULL,
    quotation_id text NOT NULL,
    item_type text NOT NULL,
    description text NOT NULL,
    unit_price numeric(65,30) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(65,30) NOT NULL
);


ALTER TABLE public.quotation_items OWNER TO titan_admin;

--
-- Name: quotations; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.quotations (
    id text NOT NULL,
    quotation_number text NOT NULL,
    customer_id text NOT NULL,
    lead_id text,
    franchise_id text NOT NULL,
    branch_id text NOT NULL,
    salesperson_employee_id text NOT NULL,
    created_by_user_id text NOT NULL,
    variant_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_base_price numeric(65,30) NOT NULL,
    accessories_amount numeric(65,30) DEFAULT 0 NOT NULL,
    insurance_amount numeric(65,30) DEFAULT 0 NOT NULL,
    registration_amount numeric(65,30) DEFAULT 0 NOT NULL,
    finance_charges numeric(65,30) DEFAULT 0 NOT NULL,
    discount_amount numeric(65,30) DEFAULT 0 NOT NULL,
    subtotal numeric(65,30) NOT NULL,
    gst_rate numeric(65,30) DEFAULT 28.00 NOT NULL,
    gst_amount numeric(65,30) NOT NULL,
    total_amount numeric(65,30) NOT NULL,
    validity_date timestamp(3) without time zone NOT NULL,
    status public."QuotationStatus" DEFAULT 'DRAFT'::public."QuotationStatus" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quotations OWNER TO titan_admin;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.role_permissions (
    role_id text NOT NULL,
    permission_id text NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO titan_admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    rank integer DEFAULT 99 NOT NULL,
    is_system boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO titan_admin;

--
-- Name: service_appointments; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_appointments (
    id text NOT NULL,
    appointment_number text NOT NULL,
    customer_id text NOT NULL,
    vehicle_id text NOT NULL,
    branch_id text NOT NULL,
    service_advisor_id text,
    requested_service text NOT NULL,
    preferred_date timestamp(3) without time zone NOT NULL,
    preferred_time text,
    status public."AppointmentStatus" DEFAULT 'REQUESTED'::public."AppointmentStatus" NOT NULL,
    customer_notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_appointments OWNER TO titan_admin;

--
-- Name: service_approvals; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_approvals (
    id text NOT NULL,
    service_job_id text NOT NULL,
    additional_work_desc text NOT NULL,
    estimated_cost numeric(65,30) NOT NULL,
    decision public."ApprovalDecision" DEFAULT 'PENDING'::public."ApprovalDecision" NOT NULL,
    customer_notes text,
    decided_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_approvals OWNER TO titan_admin;

--
-- Name: service_diagnoses; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_diagnoses (
    id text NOT NULL,
    service_job_id text NOT NULL,
    mechanic_id text NOT NULL,
    findings text NOT NULL,
    recommended_work text NOT NULL,
    severity text DEFAULT 'MEDIUM'::text NOT NULL,
    additional_cost numeric(65,30) DEFAULT 0 NOT NULL,
    images text[] DEFAULT ARRAY[]::text[],
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_diagnoses OWNER TO titan_admin;

--
-- Name: service_job_parts; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_job_parts (
    id text NOT NULL,
    service_job_id text NOT NULL,
    part_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(65,30) NOT NULL,
    gst_rate numeric(65,30) DEFAULT 18.00 NOT NULL,
    total_amount numeric(65,30) NOT NULL,
    status text DEFAULT 'REQUESTED'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_job_parts OWNER TO titan_admin;

--
-- Name: service_jobs; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_jobs (
    id text NOT NULL,
    job_number text NOT NULL,
    appointment_id text,
    customer_id text NOT NULL,
    vehicle_id text NOT NULL,
    branch_id text NOT NULL,
    service_advisor_id text NOT NULL,
    assigned_mechanic_id text,
    complaint text NOT NULL,
    diagnosis text,
    odometer double precision DEFAULT 0,
    fuel_level text,
    estimated_completion_time timestamp(3) without time zone,
    actual_completion_time timestamp(3) without time zone,
    estimated_cost numeric(65,30) DEFAULT 0 NOT NULL,
    actual_cost numeric(65,30) DEFAULT 0 NOT NULL,
    status public."ServiceJobStatus" DEFAULT 'OPEN'::public."ServiceJobStatus" NOT NULL,
    notes text,
    warranty_coverage boolean DEFAULT false NOT NULL,
    warranty_claim_ref text,
    service_invoice_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_jobs OWNER TO titan_admin;

--
-- Name: service_labour; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_labour (
    id text NOT NULL,
    service_job_id text NOT NULL,
    labour_type text NOT NULL,
    description text NOT NULL,
    hours double precision DEFAULT 1.0 NOT NULL,
    hourly_rate numeric(65,30) NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    tax_rate numeric(65,30) DEFAULT 18.00 NOT NULL,
    total_amount numeric(65,30) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_labour OWNER TO titan_admin;

--
-- Name: service_qcs; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.service_qcs (
    id text NOT NULL,
    service_job_id text NOT NULL,
    inspector_user_id text NOT NULL,
    status public."QcStatus" DEFAULT 'PENDING'::public."QcStatus" NOT NULL,
    checklist jsonb NOT NULL,
    failed_items text[] DEFAULT ARRAY[]::text[],
    remarks text,
    images text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_qcs OWNER TO titan_admin;

--
-- Name: truck_models; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.truck_models (
    id text NOT NULL,
    manufacturer_id text NOT NULL,
    name text NOT NULL,
    category text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.truck_models OWNER TO titan_admin;

--
-- Name: truck_variants; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.truck_variants (
    id text NOT NULL,
    model_id text NOT NULL,
    name text NOT NULL,
    engine_details text,
    horsepower integer,
    fuel_type text,
    transmission text,
    payload double precision,
    base_price numeric(65,30) NOT NULL,
    gst_rate numeric(65,30) DEFAULT 28.00 NOT NULL,
    description text,
    specifications jsonb,
    images text[] DEFAULT ARRAY[]::text[],
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.truck_variants OWNER TO titan_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    phone text,
    password_hash text NOT NULL,
    account_type public."AccountType" DEFAULT 'EMPLOYEE'::public."AccountType" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    google_id text
);


ALTER TABLE public.users OWNER TO titan_admin;

--
-- Name: vehicle_allocations; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.vehicle_allocations (
    id text NOT NULL,
    booking_id text NOT NULL,
    vehicle_id text NOT NULL,
    allocated_by_user_id text NOT NULL,
    allocated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    previous_vehicle_status public."VehicleStatus" NOT NULL,
    notes text
);


ALTER TABLE public.vehicle_allocations OWNER TO titan_admin;

--
-- Name: vehicle_compliance_documents; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.vehicle_compliance_documents (
    id text NOT NULL,
    vehicle_id text NOT NULL,
    document_type public."ComplianceDocType" NOT NULL,
    document_number text NOT NULL,
    issuing_authority text,
    issue_date timestamp(3) without time zone,
    expiry_date timestamp(3) without time zone,
    status public."ComplianceDocStatus" DEFAULT 'VALID'::public."ComplianceDocStatus" NOT NULL,
    reminder_sent boolean DEFAULT false NOT NULL,
    attachment_url text,
    file_attachment_id text,
    notes text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vehicle_compliance_documents OWNER TO titan_admin;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: titan_admin
--

CREATE TABLE public.vehicles (
    id text NOT NULL,
    vin text NOT NULL,
    engine_number text NOT NULL,
    registration_number text,
    variant_id text NOT NULL,
    branch_id text NOT NULL,
    customer_id text,
    status public."VehicleStatus" DEFAULT 'IN_STOCK'::public."VehicleStatus" NOT NULL,
    purchase_date timestamp(3) without time zone,
    manufacturing_year integer NOT NULL,
    color text,
    mileage double precision DEFAULT 0,
    base_cost numeric(65,30) NOT NULL,
    selling_price numeric(65,30) NOT NULL,
    images text[] DEFAULT ARRAY[]::text[],
    documents jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vehicles OWNER TO titan_admin;

--
-- Data for Name: announcement_reads; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.announcement_reads (id, announcement_id, user_id, read_at) FROM stdin;
07cf29f9-8e38-4ba8-b470-efd3ad8c25db	bb6a2d38-ac89-446f-be87-60d96f801706	e56b8cbe-7db9-4f0b-9272-7495d58969a1	2026-10-21 08:42:30.909
e7beca99-1695-4256-b173-35a8cd9786a7	4a3cd07d-4c4e-493f-aa95-60f5640e9078	3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	2026-10-21 08:42:31.276
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.announcements (id, title, content, category, priority, status, target_audience, franchise_id, branch_id, target_branch_ids, author_user_id, author_name, author_role, start_date, expiry_date, published_at, created_at, updated_at) FROM stdin;
bb6a2d38-ac89-446f-be87-60d96f801706	Tata Commercial Signa Heavy Tipper Delivery Schedule	All dealership sales advisors must ensure RTO Form 20 and temporary permit filings are finalized 48 hours prior to quarry dispatch.	OPERATIONS	HIGH	PUBLISHED	BRANCH	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	{}	d907a25a-84a5-4f3c-ae89-a487f1be6970	Bhanwar Rathore	Branch Manager	2026-10-21 08:42:30.904	\N	2026-10-21 08:42:30.9	2026-10-21 08:42:30.904	2026-10-21 08:42:30.904
7d7787d1-fc6e-447b-bc65-4fcc71ac5320	Udaipur Bay #3 Hydraulic Lift Calibration Completed	Service bay lift certified for 55-ton gross load capacity. Heavy tipper maintenance may proceed at normal throughput.	SERVICE	NORMAL	PUBLISHED	BRANCH	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	{}	7816f86d-eba4-41b8-83b5-bddf62203c49	Mahesh Sharma	Service Advisor	2026-10-21 08:42:30.92	\N	2026-10-21 08:42:30.917	2026-10-21 08:42:30.92	2026-10-21 08:42:30.92
4a3cd07d-4c4e-493f-aa95-60f5640e9078	Ashok Leyland AVTR i-Gen6 Mileage Telematics Advisory	Fleet customers operating on the Delhi-Mumbai Expressway must activate real-time DEF consumption alerts through the customer portal.	OPERATIONS	HIGH	PUBLISHED	BRANCH	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	{}	03b89618-31ed-4668-93bd-a746e950e10d	Devendra Shekhawat	Branch Manager	2026-10-21 08:42:31.273	\N	2026-10-21 08:42:31.269	2026-10-21 08:42:31.273	2026-10-21 08:42:31.273
10ae7985-8e52-425d-8d38-9e10e50564a8	Jaipur Dealership Express LCV Service Bay Launch	Dedicated fast-track servicing for Bada Dost and Dost vehicles operational from 8:00 AM to 8:00 PM on weekdays.	SERVICE	NORMAL	PUBLISHED	BRANCH	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	{}	2140334d-01d2-4ec5-ade8-c3d76d247205	Dinesh Verma	Service Advisor	2026-10-21 08:42:31.283	\N	2026-10-21 08:42:31.28	2026-10-21 08:42:31.283	2026-10-21 08:42:31.283
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.audit_logs (id, actor_user_id, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at) FROM stdin;
b5b044cf-0387-490b-8314-988355231049	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::ffff:127.0.0.1	\N	{"email": "admin@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:16:35.299
6503614a-d984-41ff-abe4-20a8d53ce0b5	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::ffff:127.0.0.1	\N	{"email": "admin@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:16:35.299
d2d30f16-33d3-4e38-9c9f-3fa10a836aec	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::ffff:127.0.0.1	\N	{"email": "admin@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:18:07.766
17d4c01b-e042-4996-9483-0bc5e5c2e34f	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::ffff:127.0.0.1	\N	{"email": "admin@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:19:05.922
e998124e-b3a6-4f23-933a-ca38128460c0	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"email": "customer@titanauto.com", "reason": "Invalid email"}	2026-10-04 15:26:47.024
dd5b2ef2-96d6-43d3-85b7-740435e6d90b	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"email": "customer@titanauto.com", "reason": "Invalid email"}	2026-10-04 15:26:49.628
4c6e9c77-0f48-4b5e-9d7d-6c98a5def8c1	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"email": "customer@titanauto.com", "reason": "Invalid email"}	2026-10-04 15:27:32.354
888ec499-0085-4447-bd77-f0a2a32b6e6b	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"email": "customer@titanauto.com", "reason": "Invalid email"}	2026-10-04 15:27:33.244
a42e42de-7b5b-4f1e-ba14-30a5a368a315	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9444	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:28:59.522
31f32432-1d89-421d-af68-45b53561b0b7	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9444	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:30:27.304
b0e97b0c-cb18-41ad-a57c-f9adb7c4c365	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:31:27.036
6124380e-164c-4ed3-bbe0-e4b0dd202163	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:33:14.23
8d2861a7-fd49-4bfc-8ffe-e086386885f9	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	89da0cbc-3236-4751-a49d-2dd32f4b0614	\N	\N	{"phone": "919876558196", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:18:30.228
0638f03f-37d6-4312-a775-292dc8253d40	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"reason": "Invalid password", "identifier": "admin@titanauto.com"}	2026-10-20 06:44:45.388
61e64b01-979a-4f49-9267-96f35343eabd	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"roles": ["SUPER_ADMIN"]}	2026-10-20 06:44:50.786
6e0b2cb6-1b87-4c84-9830-114566356133	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"reason": "Invalid email or phone", "identifier": "branchmanager@titanauto.com"}	2026-10-20 06:44:57.357
dd702b8e-ae7e-4632-a638-ceb051bc5aa9	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"roles": ["SUPER_ADMIN"]}	2026-10-20 06:45:27.811
4a23fd76-aa7b-420c-8fcf-2ebfd63bfbec	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	{"roles": ["SUPER_ADMIN"]}	2026-10-20 06:53:43.565
f4c95762-0324-427f-8db1-b087f340931c	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 07:47:46.365
fdef3812-3a3f-4288-8bad-e65f3d94e4e8	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	f1fbbcef-7755-41d4-bcaa-081b57e0a12f	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "b5ad2e89-6380-4430-8034-a8a3ccee16a2"}	2026-10-20 07:47:46.906
0ecad065-5398-41f6-a96b-20b036384c93	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	f1fbbcef-7755-41d4-bcaa-081b57e0a12f	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 07:47:47.047
6585e134-cf64-46d0-ae15-adad193cf025	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	f1fbbcef-7755-41d4-bcaa-081b57e0a12f	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 07:47:47.15
aa6a6f33-b7b7-4871-af8c-547888262389	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	1ac41b4f-1ea3-431b-b8c2-f366e6dc8a17	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-467623"}	2026-10-20 07:47:47.761
5598230a-44c9-4ca2-92df-03d6579aebaf	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	59967bd8-852e-485f-b47e-a0f2ea0e8702	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-467768"}	2026-10-20 07:47:47.877
3234f827-c416-4d6c-ac6b-a3defef24c43	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 07:50:59.824
9db3e067-b849-4ef6-b3cb-454079802ca2	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	5bce053c-39aa-43af-848c-d1ca3f3feba9	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "bd6fab94-7563-478d-9bae-5318904cdafb"}	2026-10-20 07:51:00.74
a1f83200-4c5b-411e-97c5-eb19ec2bc52d	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	5bce053c-39aa-43af-848c-d1ca3f3feba9	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 07:51:00.827
9dfe24ef-5a94-4344-b202-3d4c7e308bfd	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	5bce053c-39aa-43af-848c-d1ca3f3feba9	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 07:51:00.91
19fe2ada-d9c0-4ca6-91df-464d7cfe185f	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	bbd3aac7-3109-426a-abb6-489a621fdef5	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-661171"}	2026-10-20 07:51:01.257
5a1238e0-6d31-4f13-a50f-b5015439cf45	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	8d6e5701-3c45-4757-a0d8-65ff12ef60b7	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-661260"}	2026-10-20 07:51:01.348
35f4db68-11ba-4890-a97d-7ffaa8b55061	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	6e8c5946-8236-4c01-a82d-931f3632d321	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-661351"}	2026-10-20 07:51:01.439
9b198a97-e016-4fa4-bb82-bebdc027bd60	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 07:51:33.223
5e911d19-a10d-45fd-b813-7a575f77c112	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	280f9794-c868-4218-8b63-6231c48c1896	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "d7b49541-fccd-41b1-8167-5f87a81b0199"}	2026-10-20 07:51:34.037
61c15bcc-a413-4156-adfc-2f8fc113ce62	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	280f9794-c868-4218-8b63-6231c48c1896	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 07:51:34.115
2253e469-0651-4d0d-b07d-c41c4ca98aeb	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	280f9794-c868-4218-8b63-6231c48c1896	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 07:51:34.192
531470be-aa95-46a7-837e-967914370ceb	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	fe53b382-fdd6-4627-a484-75f829e73a5f	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-694436"}	2026-10-20 07:51:34.519
ff4a3a32-0361-45b5-8981-6cccce1617fc	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	ffaa1bec-e5c1-4aba-a394-34eddc1914b2	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-694523"}	2026-10-20 07:51:34.613
5c0bb9de-f803-44b1-a0ad-af9a8ab70ace	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	5e98fef1-44b5-48e6-8999-7c7baaf20b08	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-694616"}	2026-10-20 07:51:34.699
054066de-7245-473b-9a39-713fcc19061e	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 07:52:19.951
3649466a-afdc-49d4-857a-e145f708979e	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	42c10b3d-e95c-41c9-a172-b6a5b81c9158	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9833211370", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 07:52:20.21
4df7f678-c494-4df4-9926-9cf9e4ea51b5	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	7caa8504-a4c0-4a9c-9ec7-d4a9d7a0ab0a	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "af19a5eb-d91a-47ce-9537-6345db0a7164"}	2026-10-20 07:52:20.916
e6876df1-5013-415b-8127-05a193622752	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	7caa8504-a4c0-4a9c-9ec7-d4a9d7a0ab0a	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 07:52:21.007
c4f4508d-219d-4a70-9f1b-fbe2ce628864	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	7caa8504-a4c0-4a9c-9ec7-d4a9d7a0ab0a	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 07:52:21.082
c6757ed0-2ddf-42ef-a3b9-391576987cbf	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	dd09a414-37a3-4b9c-87b6-1b9d38756866	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-741437"}	2026-10-20 07:52:21.538
91a43e0a-90ee-47da-93b9-0f36a3228165	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	193555ed-4f23-40e2-b7c7-d6a14271d61d	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-741542"}	2026-10-20 07:52:21.632
72c51e1f-a96b-4695-a546-35f0c665f847	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	d5dadec1-82cb-4b8d-be0a-7fc9d3623ebc	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-741638"}	2026-10-20 07:52:21.733
1f274376-de2f-4f9c-a745-b1e6775e7286	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"reason": "Invalid password", "identifier": "admin@titanauto.com"}	2026-10-20 08:12:30.712
49cb7626-a5d4-481f-a8ac-8865a8997403	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:12:52.666
3ba97538-e29d-4fea-ad22-a0e08a53a10c	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	0b3cdbee-037d-451a-99fa-54b313a08d28	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792483972850", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:12:52.927
bff26cfc-399a-4755-b970-935641d89dbd	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	553b607a-d5bc-4fa9-82af-afdf313fa918	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "0b3cdbee-037d-451a-99fa-54b313a08d28"}	2026-10-20 08:12:53.002
62068ac5-8d8f-4184-9405-ea36a6d59d6c	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	1ce5b1dd-a01f-4b29-b86f-95f322eeea29	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "f7af2273-b210-4e85-bed6-668aaca65be3"}	2026-10-20 08:12:53.201
215c8b69-0e8a-49c5-8f81-ff75b0c076b6	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_SCHEDULE_GENERATED	FinanceApplication	14f17bc5-05f9-4f57-919d-fff1a1414ec9	\N	\N	{"tenure": 48, "monthlyEmi": 92350, "firstDueDate": {}}	2026-10-20 08:12:53.563
fb13a333-e68e-4329-b4e8-16cb045ecf6a	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	4da45d6a-b866-476b-9d3a-7ac38055e570	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792483973648", "installmentNumber": 1, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:12:53.713
ca712f12-6a15-4def-9462-a1d4878d8d54	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	b6897065-f049-4650-a4b8-8aca37316ca4	\N	\N	{"phone": "919876512345", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:12:53.941
58b2a7a7-75e7-4c20-a4d1-82cacd620b7a	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	b6897065-f049-4650-a4b8-8aca37316ca4	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876512345"}	2026-10-20 08:12:53.989
dced3e1d-5d06-4741-a414-a4b3d1057239	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:13:07.127
93a8fede-4cc5-4e18-9006-8d579cf57784	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	84ebfbcf-43ad-4a5e-8f0b-5e04b13b6276	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792483987234", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:13:07.286
6a327a88-83df-4269-83fe-361f838ba426	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	0f1ab9a0-eacb-4a8c-9546-163013572761	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "84ebfbcf-43ad-4a5e-8f0b-5e04b13b6276"}	2026-10-20 08:13:07.332
1986876c-c6ce-488e-aa3b-b023c9553a4c	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	d08a01c7-554c-4367-b9c5-b0cc8b289c10	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "d6faa343-4e00-4bd2-9f89-be8e9cd39b7f"}	2026-10-20 08:13:07.424
988b8ff2-3208-4524-986a-768ac351d164	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	339ff708-2ffc-4ba1-9600-e30102d6855d	\N	\N	{"phone": "919876523098", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 09:06:15.688
9a05f07e-9568-4018-80b3-ebd75be1faf3	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	4da45d6a-b866-476b-9d3a-7ac38055e570	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792483987680", "installmentNumber": 1, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:13:07.756
7508e48f-8507-4613-9b0c-7a11ddd19fc7	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:14:54.793
dad518e6-d50c-4e52-b241-a3f6ff3b47a1	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	749a3918-a49f-49c1-b6da-ca19cbfacf23	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484094960", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:14:55.053
871f022e-aadf-48d3-93a4-74451fc2b1a9	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	f3c6aa99-527e-4dac-b55a-8e9e4b1a60e3	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "749a3918-a49f-49c1-b6da-ca19cbfacf23"}	2026-10-20 08:14:55.142
af83628e-3573-45e7-9b9d-d0a7c50f16e4	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	83a7d97c-e66b-41b1-9929-459052d4a2df	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "8f04f195-71c2-48bf-94a0-e40825f5df79"}	2026-10-20 08:14:55.294
07ae1e3d-159d-4289-9dd2-cd1b1f4b7431	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	a17aa22c-ab27-415e-b1e6-8010b04bd490	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484095589", "installmentNumber": 2, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:14:55.637
aab4061c-4128-47f8-81bd-564c178f802d	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:16:07.024
a348dc05-4c0f-4c75-ae01-ff8f7432243e	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	f639f59c-1f2f-427e-825e-9c50010001f8	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484167172", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:16:07.236
9d0e7849-0d09-4a58-8341-4d09cc2acfd8	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	1a87d458-a122-4743-a04a-82d0b4ce518e	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "f639f59c-1f2f-427e-825e-9c50010001f8"}	2026-10-20 08:16:07.286
89117777-fc3c-4df0-ba9d-e412e5f51f92	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	2e348b84-c5c8-4472-8485-17ff6d997f65	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "ab2163ab-b818-4cdc-853d-c408954a0022"}	2026-10-20 08:16:07.397
64537a54-f496-4b0c-8487-e2ed06cc5bbd	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	ef14322d-acaa-4f80-ab1f-07c03956e327	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484167607", "installmentNumber": 3, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:16:07.652
071513a4-5709-44fe-ac33-e991a8f843e1	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	9c47a5b2-90aa-4520-9128-54bdda6822ea	\N	\N	{"phone": "919876571139", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:16:07.805
c09a530e-9b76-453f-8c1c-1f2070b2dbb5	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	9c47a5b2-90aa-4520-9128-54bdda6822ea	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876571139"}	2026-10-20 08:16:07.847
bb2544a5-49c6-48f8-b9c0-dc002d5b7d81	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:16:41.135
1c3665b9-d1f1-48d6-90a0-a6e472d05552	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	3cf0cb92-d9c1-4ddd-b700-5b05bca88a94	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484201228", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:16:41.266
57875f82-1f44-4603-b28a-305b5e150f29	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	c23ace38-f30a-4386-8c70-bb338817b29c	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "3cf0cb92-d9c1-4ddd-b700-5b05bca88a94"}	2026-10-20 08:16:41.299
4010bd35-4910-48b9-8edb-297d5f855760	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	d04695d0-dca4-4279-845d-f795fa3f89e2	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "6bc0c5ca-354c-4dfd-9d0a-232723cfcf0e"}	2026-10-20 08:16:41.399
02ca0010-0e7a-4a6a-981f-7fbd97420c31	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	95a7a414-d1ab-48ad-ad75-5fb4c71b989f	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484201602", "installmentNumber": 4, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:16:41.652
fb727aeb-8272-42cf-ae61-8b1248935c49	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	eacc5e22-304a-4a76-a868-1517bcd14c30	\N	\N	{"phone": "919876538148", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:16:41.833
084e696b-6757-42b1-858c-c64d7babeafd	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	eacc5e22-304a-4a76-a868-1517bcd14c30	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876538148"}	2026-10-20 08:16:41.874
1aa2ebc5-cd23-47db-b677-8a644fe3f204	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:16:53.752
140fa223-75b2-4f36-894c-7987db412425	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:18:29.472
eea8f2e1-005b-4363-898e-8f1170235825	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	bf5a5f8e-e426-4194-b90b-779f808c5120	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484309598", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:18:29.657
ad0b7a7b-d11f-4112-aa9f-6612ff67abd2	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	8c0faf05-d9c6-419c-a694-c21d8c0f5a7f	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "bf5a5f8e-e426-4194-b90b-779f808c5120"}	2026-10-20 08:18:29.706
9ce45153-bbfa-48e9-8a28-073158c49eaf	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	58a3aae3-df13-48eb-b4bf-31224534bc5f	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "7b6cc387-63fb-4d77-be20-412e73207324"}	2026-10-20 08:18:29.817
28bb5f32-d0a0-4770-8c8b-cb813e004887	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	5fca80f9-8818-4f9f-9f2e-fae149abe566	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484310020", "installmentNumber": 5, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:18:30.066
16179a78-3d49-4e5d-839b-3a8617908dba	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	a6dd1ae8-d5f8-4452-a74e-9f5eaa501d9c	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484380705", "installmentNumber": 6, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:19:40.765
37b0bddb-6430-4e82-8457-6774c7242559	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	4a6234ed-c18d-4a49-ab49-a951cf488657	\N	\N	{"phone": "919876538279", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:19:40.939
385b46ee-9422-4c6a-a594-b51f39f731fd	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	4a6234ed-c18d-4a49-ab49-a951cf488657	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876538279"}	2026-10-20 08:19:40.991
75b51ded-e23c-433a-bdd6-1fd2a0028021	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2.1792484381031@titanauto.com"}	2026-10-20 08:19:41.121
949ef373-e75a-4ecd-9903-0f5874679beb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:20:04.401
b740fa9b-041f-480b-a469-d801cd428c28	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	b9da1415-198a-4758-a00e-98914565fb98	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484404516", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:20:04.573
27baca90-0147-4896-9073-17c815c7ee95	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	8fa776a1-2a26-4c1e-b39f-fbb47529756b	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "b9da1415-198a-4758-a00e-98914565fb98"}	2026-10-20 08:20:04.625
56155b41-8937-4a26-bdbf-84669e143381	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	bd7bfba6-e4e0-4b8e-ae76-14f0d30b95fd	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "ec352d3a-4e9a-4daf-9cac-bc4683c72cb5"}	2026-10-20 08:20:04.75
f915f831-236f-40da-8511-473b16e7ea7e	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	4b230c52-13f8-4e8d-897f-9588445f5962	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484404986", "installmentNumber": 7, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:20:05.028
93ae5a5e-d3c1-4418-95ce-f7bb589332ce	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	67264f17-fbcf-467b-ac83-3d7999c23670	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484426109", "installmentNumber": 8, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:20:26.161
803c92d4-6b5c-4b76-b079-30ffdbd82e85	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	e2f593b1-754e-4d9c-873b-ae7dedd2f6ee	\N	\N	{"phone": "919876548977", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:20:26.323
b8bafbba-071c-46b6-a4da-8a8b8ba4bef4	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	e2f593b1-754e-4d9c-873b-ae7dedd2f6ee	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876548977"}	2026-10-20 08:20:26.372
4dc50100-66b2-430f-846d-943d590bbc9d	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	89da0cbc-3236-4751-a49d-2dd32f4b0614	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876558196"}	2026-10-20 08:18:30.28
c8296836-5394-4656-828f-aa5dd77eb71e	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2.1792484310320@titanauto.com"}	2026-10-20 08:18:30.407
a2ad051c-09db-4b85-856d-1f88bb74538c	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:19:40.07
d9814764-c91b-4399-a7a9-a24bbd37a235	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	5b651317-dc20-4780-b4a6-3c68fd6758c9	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484380198", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:19:40.258
09fb91e5-55ad-4812-adbc-eff6bd60f91e	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	509008d2-6d17-4d37-b9a8-255613c4e8c1	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "5b651317-dc20-4780-b4a6-3c68fd6758c9"}	2026-10-20 08:19:40.317
b443d72f-1ac1-4fb4-b2ec-82166d14bf3f	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	682a9573-3531-4667-a9ce-2701bcccf29b	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "415ae2c8-c041-4b49-a843-a20ce591cbc5"}	2026-10-20 08:19:40.469
bf8cec18-87bf-447f-ad16-bcafbd5e42a6	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	32bf5d66-4ae3-43b1-ab5e-59efec3d5b6b	\N	\N	{"phone": "919876512950", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:20:05.21
c20fd0cf-2372-47a1-aaee-2929037f18bc	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	32bf5d66-4ae3-43b1-ab5e-59efec3d5b6b	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876512950"}	2026-10-20 08:20:05.248
6d5193bf-f61a-4f2d-8e48-181106b664e8	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2.1792484405289@titanauto.com"}	2026-10-20 08:20:05.353
65ace2f8-3a52-432f-bcd5-59341ea696e4	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:20:25.574
0cf9c418-8ebd-4ac2-b48c-68f065b1f516	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	e631065f-1e50-494f-ba12-3f8158e37464	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484425663", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:20:25.712
5e893c44-25cc-4d89-a72c-32824261d95e	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	8f5eb435-fc3c-4895-b705-e36cd8951d42	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "e631065f-1e50-494f-ba12-3f8158e37464"}	2026-10-20 08:20:25.761
42bcb4e4-4a75-483a-b358-8db26c2ddd95	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	519faacb-b154-4ce4-843e-60d25c98d56f	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "6e81b0cb-cfbb-414d-b275-614011caa9a9"}	2026-10-20 08:20:25.873
dc650346-c6f2-43ad-bde6-a620c1c0ec63	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	015c4b60-8dba-4c37-9637-99ffeda6ef22	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-426413"}	2026-10-20 08:20:26.699
59bcee2e-d2c7-4b75-a807-f6790487153f	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	b677e796-189a-4929-b3d7-79a0b1088fef	\N	\N	{"employeeId": "015c4b60-8dba-4c37-9637-99ffeda6ef22", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:20:26.702
078c91d4-91b2-4cea-9d9d-4e73d139df8b	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	b677e796-189a-4929-b3d7-79a0b1088fef	\N	\N	{"employeeId": "015c4b60-8dba-4c37-9637-99ffeda6ef22", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:20:26.795
40dd0670-bd1e-4213-89c4-15abba04381b	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	015c4b60-8dba-4c37-9637-99ffeda6ef22	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "015c4b60-8dba-4c37-9637-99ffeda6ef22"}	2026-10-20 08:20:26.798
36d8a7ed-18c0-45e2-9e46-c83b145cf700	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:28:05.216
e0199f40-5dbb-4f2d-b1a9-7895d30f245e	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	700520a8-9300-46aa-8b2b-863619d8e952	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9856599268", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 08:28:05.263
df3b3029-69a3-4b8c-9914-ec0241b4fbe0	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	6aecf90d-a6e4-4dc7-9ca0-7248f4899613	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "a2f6ceaa-ef19-4b90-9530-4608b3fe9aad"}	2026-10-20 08:28:05.433
2ef8ecf3-4e27-4d94-aac9-02b3cc54e035	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	6aecf90d-a6e4-4dc7-9ca0-7248f4899613	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 08:28:05.451
bb69ebb9-8895-4968-89dc-564ca6979398	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	6aecf90d-a6e4-4dc7-9ca0-7248f4899613	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 08:28:05.467
baebba31-aa78-439d-a4d5-a9ed3f64322c	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	23484497-5738-42e4-b42c-246942ac1826	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-885563"}	2026-10-20 08:28:05.589
da408f81-804f-4ad7-bb5b-5e929cff032c	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	3416234c-ffe9-437d-acef-1067dfe0bb46	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-885590"}	2026-10-20 08:28:05.606
694c3b9c-3294-4861-9b8c-b8bcae13ad96	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	b2884388-42d8-4875-9a4c-9029ad8aa92f	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-885608"}	2026-10-20 08:28:05.635
519e4b24-eb4c-4229-b068-c58b23b630c9	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:28:09.684
ed847606-579f-4d7d-9334-8f82aab2d443	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	d50be8c2-cd6b-4038-9e3e-1ba517f7565f	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792484889737", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:28:09.759
d0446e52-6dbf-43cd-a59e-e4951d0fa9f2	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	9fb88e74-9378-4e1c-a375-134e323a1542	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "d50be8c2-cd6b-4038-9e3e-1ba517f7565f"}	2026-10-20 08:28:09.78
6535081f-1c0f-445b-9f5f-18fb16859496	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	729cff73-846e-440a-8622-8995d0c76697	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "554f1862-d1ca-4ca3-9839-dd4972669028"}	2026-10-20 08:28:09.825
582e2096-3942-4a20-b05b-ea5b9cff9d31	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	7d673da7-6774-4af9-a6f4-84a74106b095	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792484889927", "installmentNumber": 9, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:28:09.958
23c515c8-07e0-432a-9ff4-b55d6ca21b8b	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	9d798da1-16ac-4b1d-8b09-ce8f5440d8de	\N	\N	{"phone": "919876563415", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:28:10.037
3ed0efc9-5e22-4c40-8c54-9eea202c1a4d	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	9d798da1-16ac-4b1d-8b09-ce8f5440d8de	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876563415"}	2026-10-20 08:28:10.054
44940acf-46a2-4e58-a7e5-8c5967009404	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	e6a4f556-2044-4872-a46f-bc27c7df743e	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-890066"}	2026-10-20 08:28:10.166
27d2eade-e452-4666-bd6b-7829d6e96cd7	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	a8249e51-8de2-4bd3-a4db-0138cef1a5e4	\N	\N	{"employeeId": "e6a4f556-2044-4872-a46f-bc27c7df743e", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:28:10.167
c65986c2-6860-446e-b841-ad2dfe9114f1	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	a8249e51-8de2-4bd3-a4db-0138cef1a5e4	\N	\N	{"employeeId": "e6a4f556-2044-4872-a46f-bc27c7df743e", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:28:10.198
f8e1b6c0-7d20-4d02-a073-46b7b1c538b5	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	e6a4f556-2044-4872-a46f-bc27c7df743e	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "e6a4f556-2044-4872-a46f-bc27c7df743e"}	2026-10-20 08:28:10.199
a607bfae-24ee-425e-94de-0c00747f5a1b	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:39:11.397
0fdb6069-f83d-4ad0-b52c-80e35dcdcc2c	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	17ace423-e5f8-48b0-a4b3-7dad978b086a	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9848258023", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 08:39:11.441
0fbd6de9-a9bd-4473-ae39-4c58e25b8508	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	268ebe9a-1116-4f05-bab9-1fb356ad9279	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "ac13143f-9ec8-4020-8942-e0ce91240b54"}	2026-10-20 08:39:11.616
3f14b565-7a45-4353-bbcf-0cead369d2b8	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	268ebe9a-1116-4f05-bab9-1fb356ad9279	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 08:39:11.636
ee324a0a-f6a4-441d-bab7-bd1219f33e4a	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	268ebe9a-1116-4f05-bab9-1fb356ad9279	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 08:39:11.655
c21eb9b4-41a4-455f-b34c-9201539e7004	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	25c78e91-837e-4cb8-8aa8-d2908df45683	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-551720"}	2026-10-20 08:39:11.744
ff4da9a4-a05f-48c7-abff-c5e371b01cdf	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	c33709c3-7fd1-4ed4-9d59-18cb51abdeaf	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-551740"}	2026-10-20 08:39:11.761
323a3741-2c37-49e5-a82d-d97feed515ef	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	645389b4-7b2e-42fd-8a39-94649165a1f9	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-551757"}	2026-10-20 08:39:11.778
40e8b6f5-2b03-495a-8d89-c7392bf25feb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:39:15.997
096f8b0c-7459-44ea-86f5-0faea565f8cc	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	8b9d873e-d98e-4618-8324-2667c5bfd618	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792485556039", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 08:39:16.061
baeb16c5-5956-46b9-a305-aaf4f9a83e3d	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	62044a34-e6e5-4823-a134-49c7f456fe06	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "8b9d873e-d98e-4618-8324-2667c5bfd618"}	2026-10-20 08:39:16.079
54837677-141f-4286-a1ac-e685bbf9c5f2	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	d267a61e-25f4-4c9c-9cb4-10ce60388ce2	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "86f1e334-d8fe-48fb-b926-4cb51d0fe4ca"}	2026-10-20 08:39:16.12
1cacc6df-ef63-4a94-a424-707b333d74c5	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	d68dd1bc-4db7-444d-8368-d84288bd51ed	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792485556201", "installmentNumber": 10, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 08:39:16.219
a67d9f91-1685-4b04-8759-f4cc9cad29e4	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	b88857a6-393f-48e4-8650-967a408859d1	\N	\N	{"phone": "919876514455", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 08:39:16.283
816f3ca7-16fe-4770-b30e-665fc6a3caec	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	b88857a6-393f-48e4-8650-967a408859d1	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876514455"}	2026-10-20 08:39:16.3
c669a90c-4e94-4a92-8705-c7ba979389a3	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	16d1008a-1aff-4ff7-93f3-3daa259a27db	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-556312"}	2026-10-20 08:39:16.44
6c1fe020-88fb-4ebd-82fd-68ae2553d754	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	eafcd6a9-edee-4807-bce6-f07df48d08e8	\N	\N	{"employeeId": "16d1008a-1aff-4ff7-93f3-3daa259a27db", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:39:16.441
5538086c-9c10-4c0a-86f3-1e955e6ed6fb	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	eafcd6a9-edee-4807-bce6-f07df48d08e8	\N	\N	{"employeeId": "16d1008a-1aff-4ff7-93f3-3daa259a27db", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 08:39:16.471
22a1488f-18af-4b66-a0ab-4eef8916224d	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	16d1008a-1aff-4ff7-93f3-3daa259a27db	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "16d1008a-1aff-4ff7-93f3-3daa259a27db"}	2026-10-20 08:39:16.472
5a07bb12-94fd-4a0c-9bc0-9658c15d41af	6e615919-94c1-4d29-bc5b-c87849479355	FAILED_LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"reason": "Invalid password", "identifier": "admin@titanauto.com"}	2026-10-20 08:56:56.394
6c11e3f0-8bb1-412b-b68b-1a550b03b870	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:58:08.728
7fa6f855-90ee-4d3e-a61d-cc9144c1deb7	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "customer.phase3.1792486688922@titanfleet.in"}	2026-10-20 08:58:08.937
7132ce20-f626-4fda-9bc3-1d850248cbdb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 08:58:23.405
66899c67-7e19-46f4-a05c-ebf393209ff5	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:02:06.738
766ec149-fb76-4209-ad9c-a30b159924a2	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:02:13.367
b70c8eee-9d3a-46a4-bd40-66baed051012	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:05:10.858
453d7c1e-dd8b-40b6-8d30-9469c2471c29	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "test.manager.b2.1792487111386@titanauto.com"}	2026-10-20 09:05:11.413
024337df-0f9e-4a13-a400-812f816258e0	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:05:46.067
89b156d5-f8b2-4936-b250-17733361673c	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:06:03.872
e8eabf5d-3389-4145-a024-9002bbdc1006	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	cb845e65-d194-463e-9435-fab96d03e693	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-164343"}	2026-10-20 09:06:04.452
f30fcbe4-9298-4502-b872-7fe442e5e2df	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	b0e75cb1-2e5c-4920-982a-085ef117365e	\N	\N	{"employeeId": "cb845e65-d194-463e-9435-fab96d03e693", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:06:04.455
bfde0c39-fc93-4f11-aa9e-24ab5a9d8b54	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	b0e75cb1-2e5c-4920-982a-085ef117365e	\N	\N	{"employeeId": "cb845e65-d194-463e-9435-fab96d03e693", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:06:04.486
01dc0267-52dd-4f60-be29-cc3a3656a603	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	cb845e65-d194-463e-9435-fab96d03e693	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "cb845e65-d194-463e-9435-fab96d03e693"}	2026-10-20 09:06:04.488
a1cbaa92-e501-40ee-833b-da980012fbe6	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:06:08.881
9bc1592e-8704-40e9-be46-d60ef93618f0	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	20340904-4675-4c53-815e-40b078b0a26d	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9833944842", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 09:06:08.923
93e9ca83-9030-435b-9a2d-f244797d0a4e	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	c97b3879-04aa-45af-98cb-c4d7bbfd9311	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "f7c38f37-d880-4a80-9074-af36b7de77d9"}	2026-10-20 09:06:09.09
a475b6a9-2785-4f61-9e62-ab76bbf228d5	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	c97b3879-04aa-45af-98cb-c4d7bbfd9311	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 09:06:09.108
bdc4d7a5-2219-493e-8428-9eccc5ebfb82	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	c97b3879-04aa-45af-98cb-c4d7bbfd9311	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 09:06:09.124
648dc122-af5e-46ec-a250-f4a8b0ddf9b2	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	732f0bb5-7dee-4444-a4a2-8e6288ff72a9	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-169181"}	2026-10-20 09:06:09.208
f4912650-2078-4fdc-b5fb-77950b9e436f	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	b5bb3a7b-13aa-43dc-a114-f7037f7a8d47	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-169206"}	2026-10-20 09:06:09.227
aa48e6e2-3e9f-491e-8ade-eb28490399af	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	65c7b400-68a4-4500-b3e1-54a56553ea07	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-169225"}	2026-10-20 09:06:09.245
41f991d6-ab0f-492f-85f6-a665230d6104	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:06:15.405
e7c33aa7-4fe0-47a8-9939-6fa648e97f1f	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	504d84ae-6260-4471-b46d-f3ef7aaa2f63	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792487175443", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 09:06:15.466
4c0d0688-c1e8-43f3-bf18-330332965a9c	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	86450dbc-5b6d-4f46-84a9-7c3f50cb5868	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "504d84ae-6260-4471-b46d-f3ef7aaa2f63"}	2026-10-20 09:06:15.485
c88a16f6-d4b3-42e0-9006-876309dac684	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	b0d6d778-efd5-44e9-83ee-dfac8610bd22	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": "97cad3c1-ff47-4e84-afbe-20c694cad4b8"}	2026-10-20 09:06:15.527
b257ea7a-7060-4510-8c94-f83bf3962b6e	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	850e09be-d20b-4126-8a77-e67f56af4629	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792487175608", "installmentNumber": 11, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 09:06:15.627
dacd90f4-5de4-4e69-bb5b-0aa171025637	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	19cd5258-e0eb-4532-88cc-d8dde9780d82	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-175719"}	2026-10-20 09:06:15.819
39b385ab-9bd1-4ab8-8b6d-3a0e2f1a33bf	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	9be6e96c-cde9-4ca3-9ca6-4a3b76a85878	\N	\N	{"employeeId": "19cd5258-e0eb-4532-88cc-d8dde9780d82", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:06:15.82
557abe13-f3f9-4d3a-9f31-3778be74d540	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	9be6e96c-cde9-4ca3-9ca6-4a3b76a85878	\N	\N	{"employeeId": "19cd5258-e0eb-4532-88cc-d8dde9780d82", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:06:15.848
6f2cdb90-ab4a-4640-95d1-e861ec2728db	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	19cd5258-e0eb-4532-88cc-d8dde9780d82	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "19cd5258-e0eb-4532-88cc-d8dde9780d82"}	2026-10-20 09:06:15.849
0a361e65-861c-4795-886b-81f396b241df	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	339ff708-2ffc-4ba1-9600-e30102d6855d	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876523098"}	2026-10-20 09:06:15.707
4711ddab-1842-48e3-bd7d-2e8a5a4438a8	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:39:12.027
4a5666fa-53be-408d-a1ce-9d9fd50fa142	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	cb660482-95b5-4743-8592-112602f49290	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-152536"}	2026-10-20 09:39:12.642
cf4f95f3-2011-46c3-bf1b-97c8848fc683	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	b404fb0f-7260-42d2-a2cd-2cc3481881fb	\N	\N	{"employeeId": "cb660482-95b5-4743-8592-112602f49290", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:39:12.644
8d7226c3-622f-4c2a-a14c-f302988f6685	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	b404fb0f-7260-42d2-a2cd-2cc3481881fb	\N	\N	{"employeeId": "cb660482-95b5-4743-8592-112602f49290", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:39:12.674
c9f3b835-6b21-4e9c-bde8-6e4e48a8e191	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	cb660482-95b5-4743-8592-112602f49290	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "cb660482-95b5-4743-8592-112602f49290"}	2026-10-20 09:39:12.675
a8337d49-f55d-4a63-8070-3a4cf6b77306	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:44:53.6
e30f6fc0-1a2f-4951-8fda-5ead707a0c8e	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	b9014893-55ff-464d-9528-564a8040d616	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00022"}	2026-10-20 09:44:53.665
66beca6f-5d1e-42b1-a11c-33071664c0c0	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:46:04.307
c93fcf3d-b70a-4348-ae9a-39bfa6c9169b	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	2675259c-947e-4b98-97dc-10a6ce3d3ada	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00023"}	2026-10-20 09:46:04.396
10b788c0-39e5-43dc-a40c-e943f9205f42	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:46:55.857
1754dc0b-79e0-428e-8ad0-7934f910bf92	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:47:06.191
4550696d-f8fb-4398-a5e3-358015430f3e	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	2675259c-947e-4b98-97dc-10a6ce3d3ada	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 09:47:06.236
a80a7aab-871a-42f7-8da4-0948737a8d44	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:47:20.364
3e2d80d2-5c40-42bb-928a-34ca285fd87c	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	036cb2e7-9af9-42de-88bc-73c5bc71fc05	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00024"}	2026-10-20 09:47:20.403
99ce983e-e795-4b8f-941d-955e9c8cddbb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:48:15.822
8e2f642b-92a7-4d1c-ad50-cb9fceaefdb2	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	5136fd27-6284-4e6b-a40e-43bfbfb4169d	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00025"}	2026-10-20 09:48:15.861
43d47c33-b942-482a-9d3e-a14dff88032e	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:49:13.252
5263f2d8-1727-4475-a5da-5ee61e205f37	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	1d2e0f1c-9119-4943-af20-e4ccade55ad5	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00026"}	2026-10-20 09:49:13.291
a26d30de-2607-48d5-b1c1-d7e4b36a03e9	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	1d2e0f1c-9119-4943-af20-e4ccade55ad5	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 09:49:13.355
f740db2a-d546-4bef-83c1-925df7920f41	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	1d2e0f1c-9119-4943-af20-e4ccade55ad5	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 09:49:13.372
d29d815a-4204-448c-9a6c-0b2e838b9c4b	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	1d2e0f1c-9119-4943-af20-e4ccade55ad5	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 09:49:13.42
20005c63-2a20-45ca-9663-8b2ce2d40b99	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	1d2e0f1c-9119-4943-af20-e4ccade55ad5	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 09:49:13.437
d9b06732-8c83-4f27-acdd-ccc1ad57502a	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	ba3d02cc-a516-42b5-86f2-1056ca66bafe	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792489753523", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 09:49:13.6
bb74672f-b924-451e-8060-fede5417e3d5	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:50:02.879
eaf8e05f-a4d9-4957-88f7-a7c0ca18f60c	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	6dfd3433-0f28-46de-81fb-aa8e59785097	\N	\N	{"title": "Internal Draft Policy Revision 1792489753615", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 09:49:13.629
de0d6b05-1105-4bdf-9926-935090bb5916	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	6dfd3433-0f28-46de-81fb-aa8e59785097	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 09:49:13.699
f1f778a3-8562-44e1-90c8-e1c0c40826a9	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	20f7dabc-4b8b-42af-9162-563df613286c	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-753700"}	2026-10-20 09:49:13.8
c7df1619-99cc-4bfa-b84e-8ddc60b31294	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	99c35a39-2e53-468b-89df-c26cd5f457d6	\N	\N	{"employeeId": "20f7dabc-4b8b-42af-9162-563df613286c", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:49:13.801
9a597baf-4f7a-49be-8cf8-0d2397bbf407	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 09:50:11.384
7cde06a7-dc83-47ae-9ded-fe12374edf57	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	3ad7c577-bf36-4c34-bb98-52d23365ab17	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00027"}	2026-10-20 09:50:11.453
fe953ceb-738b-44cd-8286-87bc2edc9987	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	3ad7c577-bf36-4c34-bb98-52d23365ab17	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 09:50:11.556
b3b59953-8e89-4303-821d-6526fa75ee78	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	3ad7c577-bf36-4c34-bb98-52d23365ab17	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 09:50:11.592
5e5421f8-a6e8-43f5-82c4-cf377e4909a7	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	3ad7c577-bf36-4c34-bb98-52d23365ab17	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 09:50:11.657
94886337-0a66-48d6-b895-b518bf345daf	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	3ad7c577-bf36-4c34-bb98-52d23365ab17	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 09:50:11.675
4c747fd0-b9b3-4691-8456-b8ecc0a15408	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	882b598f-6e4d-458e-a3f2-f5bd6f062840	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792489811786", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 09:50:11.859
094b55dd-7151-479d-84a3-81b728d13244	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	57c2e095-226c-4ada-864c-eabc4020d520	\N	\N	{"title": "Internal Draft Policy Revision 1792489811879", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 09:50:11.893
42d45040-6cfe-44c5-8830-c16b13e19385	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	57c2e095-226c-4ada-864c-eabc4020d520	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 09:50:11.964
96b3a6d3-f2f9-4953-b65e-c395a48c44cc	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	7eecf63d-b984-40f1-b5d2-a835051bea8b	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-811965"}	2026-10-20 09:50:12.069
f099fcc5-a108-44f2-b6f2-085ec9a965f9	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	74136074-01c1-44ad-8c05-d92919fff6e1	\N	\N	{"employeeId": "7eecf63d-b984-40f1-b5d2-a835051bea8b", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:50:12.07
3de70633-45a5-4b25-8ff4-d468917cb6eb	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	74136074-01c1-44ad-8c05-d92919fff6e1	\N	\N	{"employeeId": "7eecf63d-b984-40f1-b5d2-a835051bea8b", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 09:50:12.098
a769e0ea-833f-4cac-8a42-63a6fd26c475	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	7eecf63d-b984-40f1-b5d2-a835051bea8b	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "7eecf63d-b984-40f1-b5d2-a835051bea8b"}	2026-10-20 09:50:12.1
0428f3c9-1f07-4f2c-a953-6b80dfad062c	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:00:56.328
85a96256-f489-4d09-8c20-50ea8f300f49	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	2df8a2e2-80d1-4657-97c8-97a3ca6d8183	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00028"}	2026-10-20 10:00:56.39
aa0a596c-f2cd-4ec8-b6b0-6265818b9b06	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	2df8a2e2-80d1-4657-97c8-97a3ca6d8183	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:00:56.463
cefe7ae9-0b0a-4fbf-9e63-737912fc18e9	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	2df8a2e2-80d1-4657-97c8-97a3ca6d8183	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:00:56.481
3df7ef25-eb87-465d-bbdc-7252ffdc8587	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	2df8a2e2-80d1-4657-97c8-97a3ca6d8183	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 10:00:56.53
bd1ae83a-1195-4960-a62d-6ec2dfbca576	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	2df8a2e2-80d1-4657-97c8-97a3ca6d8183	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:00:56.547
cccb2e49-dac7-4da8-abc4-c3ef1c24f396	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	e92fd4e8-9c6e-4583-b770-374e7668f5fc	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792490456654", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 10:00:56.728
4443a3d6-8e2d-4c6e-8864-22b3ed0f56fe	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	82ce264b-5dd9-4876-bf95-36788e1af135	\N	\N	{"title": "Internal Draft Policy Revision 1792490456747", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 10:00:56.761
2bfa5cd0-2e17-4b94-8b00-dea2f35d5422	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	82ce264b-5dd9-4876-bf95-36788e1af135	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 10:00:56.827
6fb5e3e6-4cbe-46d8-a570-f41a25972a25	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	cecbbe9d-d04f-4279-9f3c-6bd2bc82d5f3	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-456827"}	2026-10-20 10:00:56.929
3a537d0d-deb6-4faf-984a-59d2d40de4ce	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	54963432-8328-4936-a98f-e920879ffdad	\N	\N	{"employeeId": "cecbbe9d-d04f-4279-9f3c-6bd2bc82d5f3", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:00:56.93
5da76936-044e-456b-953a-6de0f24bdc7e	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	54963432-8328-4936-a98f-e920879ffdad	\N	\N	{"employeeId": "cecbbe9d-d04f-4279-9f3c-6bd2bc82d5f3", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:00:56.955
a9b34550-094a-44e1-9bb0-fe64e5c5ec5a	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	cecbbe9d-d04f-4279-9f3c-6bd2bc82d5f3	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "cecbbe9d-d04f-4279-9f3c-6bd2bc82d5f3"}	2026-10-20 10:00:56.957
bfc16f03-794b-4854-a293-4aba122b36e7	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:01:01.604
ed3a7afb-665c-4466-8bd7-b105f905a115	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	7fbdc6fe-eba9-4748-9359-bcad95162dcc	\N	\N	{"phone": "919876558001", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 10:01:06.487
a8b1875e-44aa-4ef1-aa03-fbd8cdeceb8b	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	d9a18da8-0406-4f3d-867a-53da6ab0de6c	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9814591478", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 10:01:01.642
4e0d95ee-294a-482c-b10a-6a1d4317f150	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	55ddfbdd-68e8-4aac-a49b-a11925e0be22	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00029"}	2026-10-20 10:01:01.797
77bd0831-f037-4623-981b-71e5518b11f0	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	55ddfbdd-68e8-4aac-a49b-a11925e0be22	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:01:01.813
2f47f5cc-14a1-40a3-9247-d1a69becf1b7	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	55ddfbdd-68e8-4aac-a49b-a11925e0be22	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:01:01.829
a5fd5f8e-9470-4e50-bb92-146b9c8fd912	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	4323fb62-a9e2-4065-b2c4-3258cf72a183	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-461886"}	2026-10-20 10:01:01.904
cb090d7f-fd2e-4c05-a55d-c36f7815daa4	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	47cde45b-0c83-47b5-b22a-e681be33d442	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-461904"}	2026-10-20 10:01:01.919
8583582c-ea2b-430f-87b9-901e6662591b	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	d317b2e2-faa3-4d21-aa67-4aaf506af547	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-461919"}	2026-10-20 10:01:01.934
f93cdd21-d7a6-45c7-89a6-518041d12ae2	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:01:06.219
7ba34513-be5e-4cfc-a23e-a0fbb1b9a4eb	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	dccbe718-0776-4338-81e4-534f58f83817	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792490466259", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 10:01:06.282
f2a78dec-21fe-4740-bf78-7df81a860fb3	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	e348aa90-baee-41d6-9de0-79707157b40a	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "dccbe718-0776-4338-81e4-534f58f83817"}	2026-10-20 10:01:06.3
e6b55e00-1f4c-48cb-9d35-9431e0e87369	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	7d08e029-e510-4ef5-a72e-9c4b70ec4291	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00030"}	2026-10-20 10:01:06.335
e92d0b8c-dfb4-418f-af19-bbe53d0869a7	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	99b2aa35-215c-464f-ad7d-ee81bef87706	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792490466410", "installmentNumber": 12, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 10:01:06.427
1a6a20ac-c2aa-4216-b02c-bbec6dc0919e	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	bc1b15bf-4d98-43ad-acc2-d51ae2a97a1a	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-466514"}	2026-10-20 10:01:06.614
b51d055f-fd3b-479c-9fdf-8090a9955de5	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	3c1f6784-ba9b-47af-a148-89aa33c988db	\N	\N	{"employeeId": "bc1b15bf-4d98-43ad-acc2-d51ae2a97a1a", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:01:06.615
85c85306-0a49-4440-9cef-4644646fc1d3	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	3c1f6784-ba9b-47af-a148-89aa33c988db	\N	\N	{"employeeId": "bc1b15bf-4d98-43ad-acc2-d51ae2a97a1a", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:01:06.639
f91ef6a2-cae7-4fbf-b810-a4f4c172810f	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	bc1b15bf-4d98-43ad-acc2-d51ae2a97a1a	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "bc1b15bf-4d98-43ad-acc2-d51ae2a97a1a"}	2026-10-20 10:01:06.64
bd785185-d02f-46df-92a5-2ee9e170969c	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	7fbdc6fe-eba9-4748-9359-bcad95162dcc	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876558001"}	2026-10-20 10:01:06.502
5aed00b8-3ce3-483b-b6f0-7ba1b2ebc13b	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:01:12.871
ebfdc4f0-9757-4fb9-83d5-ebf7ea9bdb2d	\N	LOGIN	User	d82fe409-98c5-4d96-8686-8036081c6399	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:01:13.181
0438fa72-b7c7-450c-9fc8-239daa0b3ae7	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	52730fb6-7bd8-4829-ae32-93e9df089c41	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-473374"}	2026-10-20 10:01:13.477
6fbe4777-c5d8-4024-b797-813969ededd7	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	0995b721-b26f-4f3d-acb9-dafc9210dffd	\N	\N	{"employeeId": "52730fb6-7bd8-4829-ae32-93e9df089c41", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:01:13.479
f04ab3ad-43ce-41db-b904-73b9ce0f9ebc	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	0995b721-b26f-4f3d-acb9-dafc9210dffd	\N	\N	{"employeeId": "52730fb6-7bd8-4829-ae32-93e9df089c41", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:01:13.509
d20372bb-d087-41ab-a239-48e48e63bb93	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	52730fb6-7bd8-4829-ae32-93e9df089c41	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "52730fb6-7bd8-4829-ae32-93e9df089c41"}	2026-10-20 10:01:13.51
3a8f232d-4a38-446c-ae5f-209eabbe8f70	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:02:04.906
91ae9ca2-ff33-4aab-9b67-cedf2e4bdd43	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:43:40.393
a0dfa84b-9744-4fa8-ae87-edc5b5ee9ae1	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	e2afafba-2ccc-499b-a58c-0594ca512ee5	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9855782052", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 10:43:40.438
5a485858-fc1c-4767-9218-c6f9aa929f98	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	5d5a668d-d489-4f10-a3fd-13bc8fc5efbc	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00031"}	2026-10-20 10:43:40.604
5383dd7d-7552-4e05-88f1-c8a0dafbb73a	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	5d5a668d-d489-4f10-a3fd-13bc8fc5efbc	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:43:40.624
764d7000-5810-4994-ae06-8c244b13ce37	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	5d5a668d-d489-4f10-a3fd-13bc8fc5efbc	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:43:40.643
929d901d-f560-46cc-8fcd-7b23a32cb211	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	0dff8f89-5c37-491b-b52b-bf2299798bde	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-020724"}	2026-10-20 10:43:40.747
d1d067e6-814d-4f4c-bce6-ca4027173150	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	437ceadd-1ec5-4e28-bebc-fac4a4e1cd77	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-020747"}	2026-10-20 10:43:40.763
d6ae5f67-9e92-4967-b8b7-6e0f898b35a3	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	fa626cc1-4cae-4772-bfae-16417829eeea	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-020763"}	2026-10-20 10:43:40.78
75b9ab39-616f-428a-b959-e61f3a048033	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:43:45.922
d6613682-5c1d-48d8-9fab-241bb94e763c	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	8e00654f-e4d8-45e7-9d9e-46b4381338d6	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792493025961", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 10:43:45.98
56fb2374-9dc3-4032-b1f7-9f5944dc668a	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	2117f709-33b5-4552-b5d5-c799fdfc6242	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "8e00654f-e4d8-45e7-9d9e-46b4381338d6"}	2026-10-20 10:43:46.002
3a9c2847-01c0-424b-b6f7-bc634e31d6f9	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	d4ada832-181f-4dc6-be44-7dfb8c06f662	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00032"}	2026-10-20 10:43:46.04
aa9bc2bb-a2d0-429e-b8d8-849c314f4bb0	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	9cc49262-a52c-4f59-81e7-66d8c1a0d80f	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792493026116", "installmentNumber": 13, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 10:43:46.132
a5201e76-6d98-4620-87e1-f71d9dfdab60	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	29218885-ab67-4f43-ac92-6a0565d2e836	\N	\N	{"phone": "919876556393", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 10:43:46.192
ed7d0723-6915-4689-99cb-8fe34dc607bb	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	29218885-ab67-4f43-ac92-6a0565d2e836	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876556393"}	2026-10-20 10:43:46.21
294db4bc-4a7d-4daf-a193-42745e6f5cc4	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	59b8eac4-ddbd-44d4-987c-41d86884c5b9	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-026225"}	2026-10-20 10:43:46.33
71bf3944-fd02-41a0-9c48-e1a4f7ba9878	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	d09662eb-0f8b-477f-957a-0c1b920f7b49	\N	\N	{"employeeId": "59b8eac4-ddbd-44d4-987c-41d86884c5b9", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:46.333
d402f79e-89b9-4821-ab2f-b1e2fe8f7069	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	d09662eb-0f8b-477f-957a-0c1b920f7b49	\N	\N	{"employeeId": "59b8eac4-ddbd-44d4-987c-41d86884c5b9", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:46.358
8c2f5ad5-244b-457f-a7fb-aa3eaabfb240	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	59b8eac4-ddbd-44d4-987c-41d86884c5b9	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "59b8eac4-ddbd-44d4-987c-41d86884c5b9"}	2026-10-20 10:43:46.359
cfb539ec-f545-46ca-8389-e605e01594fe	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:43:50.953
facd32bc-d3e6-478d-a5c3-9957f8c2d0c6	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	1d28f789-b7d1-43b4-a082-665e1580c7d7	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-031452"}	2026-10-20 10:43:51.543
181934e1-ea9e-47f6-b09d-2518888fb40e	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	ee9bdc28-28c0-43c5-9877-bdab3ecec4e5	\N	\N	{"employeeId": "1d28f789-b7d1-43b4-a082-665e1580c7d7", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:51.545
31868e5b-7f09-4eed-a165-5f2012d4a7e1	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	ee9bdc28-28c0-43c5-9877-bdab3ecec4e5	\N	\N	{"employeeId": "1d28f789-b7d1-43b4-a082-665e1580c7d7", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:51.565
07a8a6f1-99ef-4392-bfc6-f36668e18917	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	1d28f789-b7d1-43b4-a082-665e1580c7d7	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "1d28f789-b7d1-43b4-a082-665e1580c7d7"}	2026-10-20 10:43:51.566
289a0216-171e-4248-b5f2-fa7f1eb24ef3	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:43:55.998
f96ec99d-99e5-4468-ab6a-1a9db498fe93	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	4358bb20-e3bd-49e0-b566-ccb4e24e445d	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00033"}	2026-10-20 10:43:56.043
988d2ce4-74b1-4cac-b0ae-1f36e0dc92e2	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	4358bb20-e3bd-49e0-b566-ccb4e24e445d	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:43:56.11
32d84b1c-e4b8-4feb-9cc1-c5bf26c67cec	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	4358bb20-e3bd-49e0-b566-ccb4e24e445d	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:43:56.127
b44ecd2f-2388-4b97-bac9-b44855942a8d	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	4358bb20-e3bd-49e0-b566-ccb4e24e445d	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 10:43:56.173
ab35681a-e984-46b6-880d-26542f1fa1df	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	4358bb20-e3bd-49e0-b566-ccb4e24e445d	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:43:56.19
1d788ae7-fd87-45e3-8ca1-cb478b255f75	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	44395fce-2718-483e-8e36-87beb6aed82b	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792493036278", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 10:43:56.351
ae034d21-487b-400b-a12b-dd9ff4708d91	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	eda9b4c2-658f-4638-96c0-630543fa1be7	\N	\N	{"title": "Internal Draft Policy Revision 1792493036370", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 10:43:56.389
34a2632a-589e-4032-900d-3c888c826be5	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	eda9b4c2-658f-4638-96c0-630543fa1be7	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 10:43:56.458
e7f5751a-3158-4f93-8957-df6676c50c3b	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	3313dfe6-ebf2-4657-ba1d-fe63115cfa09	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-036458"}	2026-10-20 10:43:56.559
cf14771b-913a-4f0d-81f1-9d949d626be1	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	aac554c4-1057-4a17-9272-4398c11e86a0	\N	\N	{"employeeId": "3313dfe6-ebf2-4657-ba1d-fe63115cfa09", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:56.56
914d1fb3-5114-461e-ab47-da5f83413b12	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	aac554c4-1057-4a17-9272-4398c11e86a0	\N	\N	{"employeeId": "3313dfe6-ebf2-4657-ba1d-fe63115cfa09", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:43:56.589
485674e8-49f9-4430-8690-128e4c44583e	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	3313dfe6-ebf2-4657-ba1d-fe63115cfa09	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "3313dfe6-ebf2-4657-ba1d-fe63115cfa09"}	2026-10-20 10:43:56.59
1724762c-97c4-4d09-898f-a504ebd2e61c	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:47:21.524
b0c3a2e5-2f39-45e7-a2a5-d2301c9d2995	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	a41e01ee-4c87-4085-923f-0a350db3bb55	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9896388525", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 10:47:21.578
8f072fcd-00c2-4e9e-b8e3-18d47c432415	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	32999f2d-5f4a-415e-9c78-8a73b8e7ad66	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00034"}	2026-10-20 10:47:21.752
d2af7f22-f24d-405b-8667-99d48a115ed6	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	32999f2d-5f4a-415e-9c78-8a73b8e7ad66	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:47:21.784
c122e913-7242-40e1-a724-9feb5d3283b7	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	32999f2d-5f4a-415e-9c78-8a73b8e7ad66	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:47:21.818
9c1bb53b-1ba6-430f-9caa-cab4e3d408cb	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	362cd4bf-17f3-4bbb-a102-ca28bd4ff3c3	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-241936"}	2026-10-20 10:47:21.958
bba86d34-4733-470b-93d3-938de57756ec	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	738b6138-d6ee-4d0e-b352-6e4b0e01ae75	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-241959"}	2026-10-20 10:47:21.977
9eaf0d67-b9a1-4f11-b13b-f8b875833302	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	57b27ce1-22b3-4cf7-aef2-8a919964302d	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-241980"}	2026-10-20 10:47:21.997
ac739ba8-98b3-4a54-8972-f55600990fa6	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:47:25.701
3af6f8a6-94f8-4bb4-91fa-c5dd24cc3212	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	b4c4b26e-3a7b-4732-b91a-a7a90aba3fad	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792493245741", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 10:47:25.761
0b789e10-c202-4445-bc5b-003fd602dd27	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	d9e73b3b-5c42-4feb-a05d-b9bf36a53948	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "b4c4b26e-3a7b-4732-b91a-a7a90aba3fad"}	2026-10-20 10:47:25.778
82caaf4e-b54f-4e7a-bb7a-00152c9f815e	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	cabc49ad-7f06-4500-83f1-252cb12cd7af	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00035"}	2026-10-20 10:47:25.816
b4367d66-9036-47f0-b19e-a8c7c6eeba1c	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	3925a5c3-d8cc-476d-ab76-1081d12e2b6e	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792493245897", "installmentNumber": 14, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 10:47:25.913
74b3a5df-7426-42e8-a5e4-a3bb8eb4945d	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	ad2bcd00-f868-4335-9e7e-9b6296391ea3	\N	\N	{"phone": "919876537152", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 10:47:25.974
e4c9ed72-40c3-4962-ac4a-1d0f87ccdd2d	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	ad2bcd00-f868-4335-9e7e-9b6296391ea3	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876537152"}	2026-10-20 10:47:25.991
ef92f855-29b0-4437-9790-a62c8249490d	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	4a3a0d99-44df-43af-8c13-7b6bb702613d	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-246002"}	2026-10-20 10:47:26.107
fcd237b5-cdc1-462b-8389-572f8ff88294	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	58cc244a-adcf-449c-a0b8-42eed23cf285	\N	\N	{"employeeId": "4a3a0d99-44df-43af-8c13-7b6bb702613d", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:26.108
f583d44e-51a6-419a-b702-63347d6e196a	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	58cc244a-adcf-449c-a0b8-42eed23cf285	\N	\N	{"employeeId": "4a3a0d99-44df-43af-8c13-7b6bb702613d", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:26.135
9815701a-3da4-451a-bf86-6bcc9c11ca46	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	4a3a0d99-44df-43af-8c13-7b6bb702613d	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "4a3a0d99-44df-43af-8c13-7b6bb702613d"}	2026-10-20 10:47:26.136
29de1bc0-66fc-4b09-b943-258dba720fcc	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:47:29.727
e11c268b-4350-4551-b8a0-1f072b3ff984	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	d7f9de5b-f5ba-482b-aa4e-13a65dfc9869	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-250219"}	2026-10-20 10:47:30.322
966c2721-c211-4d9e-93fa-91664ea04168	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	73fde521-db71-4aec-81c7-2ce497900c5e	\N	\N	{"employeeId": "d7f9de5b-f5ba-482b-aa4e-13a65dfc9869", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:30.324
eaf2e6ce-b3f6-4ee7-8805-7a652f84c2e1	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	73fde521-db71-4aec-81c7-2ce497900c5e	\N	\N	{"employeeId": "d7f9de5b-f5ba-482b-aa4e-13a65dfc9869", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:30.353
a8019864-34a5-4a1c-88fb-e3dec7988816	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	d7f9de5b-f5ba-482b-aa4e-13a65dfc9869	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "d7f9de5b-f5ba-482b-aa4e-13a65dfc9869"}	2026-10-20 10:47:30.354
e043aaba-1047-430a-b7dd-943ac0ac8e36	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:47:34.393
3e2704bf-3d24-47dd-a990-464256bffc5b	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	774d557c-f59a-470e-b89a-db8641ab22d3	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00036"}	2026-10-20 10:47:34.437
f37f236b-fd4c-4a33-80fe-198c2a74194c	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	774d557c-f59a-470e-b89a-db8641ab22d3	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:47:34.507
3a68468d-b075-45b2-b492-3eec63063db6	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	774d557c-f59a-470e-b89a-db8641ab22d3	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:47:34.524
bd7c7cf8-98ad-4bdb-8bca-50285a9c9760	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	774d557c-f59a-470e-b89a-db8641ab22d3	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 10:47:34.571
fcd75126-f6fe-4d7b-8479-322fa2d43293	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	774d557c-f59a-470e-b89a-db8641ab22d3	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:47:34.587
c2ca52ac-8142-40df-9a83-af9e09f03d13	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	da2faa21-3e37-4c99-8e4a-2f9043242128	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-254917"}	2026-10-20 10:47:35.016
a28401ea-e028-410e-bd74-89290718e42f	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	6e06d5ed-b18c-42a3-9228-256b4d1ae039	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792493254741", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 10:47:34.815
8e804fcf-aaba-4779-b782-286b6f581648	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	d32198f6-b3cb-484f-8777-98fcdf1e04e2	\N	\N	{"title": "Internal Draft Policy Revision 1792493254828", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 10:47:34.842
528b5277-e4ca-4c56-9a13-1d093ece2431	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	d32198f6-b3cb-484f-8777-98fcdf1e04e2	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 10:47:34.917
cff04ede-2aa8-4988-895a-982eb5514da8	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:48:20.011
dee630e5-e103-49b6-a4ff-aabc8d104cf6	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2@titanauto.com"}	2026-10-20 10:48:20.045
1b7af7d4-9c3e-4fba-a9d8-efec8b148e20	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "customer1@example.com"}	2026-10-20 10:48:20.05
dd3e045c-6248-49fe-a8d9-1a64dbe004ac	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:49:31.819
61c717e7-2fad-46dd-995c-e71c7b334511	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2.1792493371837@titanauto.com"}	2026-10-20 10:49:31.861
9cf4ebc8-0d8e-4156-802f-4f07b5e6b4f5	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	3e0adc40-ae26-42b7-8b4a-c2ba0fcc63a5	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-402878"}	2026-10-20 10:50:02.99
7341f1cb-e954-4f9f-a826-9fc32cc6b9f5	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	f14940d6-4abb-47e7-a03d-b9d52a1632b0	\N	\N	{"employeeId": "3e0adc40-ae26-42b7-8b4a-c2ba0fcc63a5", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:50:02.991
dee3ed8b-6b93-4798-96dd-0d8cc22c55b0	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	f14940d6-4abb-47e7-a03d-b9d52a1632b0	\N	\N	{"employeeId": "3e0adc40-ae26-42b7-8b4a-c2ba0fcc63a5", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:50:09.355
682aa54c-8fe4-463a-9ce3-58a2feaa2c62	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	3e0adc40-ae26-42b7-8b4a-c2ba0fcc63a5	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "3e0adc40-ae26-42b7-8b4a-c2ba0fcc63a5"}	2026-10-20 10:50:09.356
f9f15b22-7539-4d7c-8479-6414f7a39cd0	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	21e3012d-6df7-4672-8e5d-ad9f99d307d1	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "EM-457215"}	2026-10-20 10:50:57.311
d5cb617b-2934-4512-a41d-2f44b070f424	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	bab42189-2fc9-4228-afda-a015c4f2514e	\N	\N	{"employeeId": "21e3012d-6df7-4672-8e5d-ad9f99d307d1", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:50:57.313
26500d0b-6ebe-44c6-a9e5-384ba9bc612d	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	bab42189-2fc9-4228-afda-a015c4f2514e	\N	\N	{"employeeId": "21e3012d-6df7-4672-8e5d-ad9f99d307d1", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:50:57.333
30af7349-75f7-49e3-a7bf-69c174740183	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	21e3012d-6df7-4672-8e5d-ad9f99d307d1	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "21e3012d-6df7-4672-8e5d-ad9f99d307d1"}	2026-10-20 10:50:57.334
f73ff11d-26fd-4e10-8f15-ae30c58a2d60	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	a731f54e-c381-4796-9f55-e09aaa99c2af	\N	\N	{"phone": "919876583614", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 10:51:09.072
4de38e6a-3c9e-4f6b-a523-a1ea9b136655	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	a731f54e-c381-4796-9f55-e09aaa99c2af	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876583614"}	2026-10-20 10:51:09.087
4db337e2-0e48-4b56-9781-661f5246b47d	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:51:09.447
f372ccef-c02d-42e8-966c-6d9a939f799c	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	f78c62c3-9bd5-4ae2-bbe0-e5e5020b2665	\N	\N	{"employeeId": "da2faa21-3e37-4c99-8e4a-2f9043242128", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:35.017
2464b31e-dc5b-48bc-9456-0909a596d195	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	f78c62c3-9bd5-4ae2-bbe0-e5e5020b2665	\N	\N	{"employeeId": "da2faa21-3e37-4c99-8e4a-2f9043242128", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:47:35.042
61a0c70f-4cf0-4279-8528-4b0b6f9b0462	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	da2faa21-3e37-4c99-8e4a-2f9043242128	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "da2faa21-3e37-4c99-8e4a-2f9043242128"}	2026-10-20 10:47:35.045
60c0ccfe-1f5d-4205-a1a9-16c619432ceb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:49:10.501
b81ce422-008c-4e19-9909-a0b11e258abb	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "manager.branch2.1792493350517@titanauto.com"}	2026-10-20 10:49:10.536
4cf6f636-361f-4de5-8dab-0db17357cb70	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:49:38.412
038298a1-4e78-41b5-a5ce-ac67754601f8	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:49:47.953
3bee6c3a-e120-4bf5-be55-73f8e6ea079f	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:49:54.533
6d10ff1b-661f-435d-b635-af585f3ad1b4	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:50:09.331
24c2837a-39f6-494b-a41b-756b1c485651	\N	FAILED_LOGIN	User	\N	::1	\N	{"reason": "Invalid email or phone", "identifier": "test.sales.1792493402688@titanauto.com"}	2026-10-20 10:50:13.975
20d44511-671a-4b32-ace8-b21c1405e91a	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:50:57.201
3b546c26-ea81-4cfd-8f99-e0f2056690fe	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:51:08.284
34567f9c-ac27-4bc4-9fac-a238102c8729	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	44ab6f96-fd48-4e17-8816-0bec6b685960	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9858483500", "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerType": "BUSINESS"}	2026-10-20 10:51:08.32
e8821216-de3e-43c4-b04d-9a226fa66ed7	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	df5f1b11-5499-4d96-bd95-08a309146930	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00037"}	2026-10-20 10:51:08.472
551e0e75-fb94-4cec-8a5e-d4cd9b752a4a	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	df5f1b11-5499-4d96-bd95-08a309146930	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:51:08.488
775e142a-a536-44bc-8fd1-4e707a9850f1	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	df5f1b11-5499-4d96-bd95-08a309146930	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:51:08.504
bd195346-e53c-4a59-aef4-689bdf3639a1	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	5224861d-627c-473e-b499-7bed0d11f428	\N	\N	{"status": "VALID", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "PUC", "documentNumber": "PUC-RJ-468554"}	2026-10-20 10:51:08.572
11affe6d-c4f7-49dd-957f-19a5b91c56c5	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	5d05563c-c723-4bd2-8aea-bd55cba9d8ff	\N	\N	{"status": "EXPIRED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-468573"}	2026-10-20 10:51:08.588
9dcfe59c-f157-4236-9a3d-97c9dce18fa1	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	a4f25dca-07a6-4fde-b997-4613b77aebfa	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-468588"}	2026-10-20 10:51:08.604
21d0aef8-1e2d-496a-9675-425985c24207	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:51:08.769
365efc6d-af9b-42bd-8e1b-51491e787266	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	a85a7fb3-4056-4fc8-bc79-a28ada9406d6	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792493468831", "budget": 200000, "branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549"}	2026-10-20 10:51:08.85
72635610-cda9-475e-b392-bcf5dbee3c9a	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	5411074e-d5b6-4e08-b2cb-ef2b419bde03	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "a85a7fb3-4056-4fc8-bc79-a28ada9406d6"}	2026-10-20 10:51:08.88
98b68846-654a-43ad-86d0-4526a311d006	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	1d275212-7ba4-4004-a26f-54f831f04c05	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00038"}	2026-10-20 10:51:08.917
eb9cbd22-14d1-49e2-b469-2cf105e75300	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	df54f7e4-ab84-4c40-90d2-24513636f297	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792493468992", "installmentNumber": 15, "financeApplicationId": "14f17bc5-05f9-4f57-919d-fff1a1414ec9"}	2026-10-20 10:51:09.008
5cbdc02b-111d-4ba4-8d55-a5bdb2884708	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	7138fa1e-b154-44b7-b35b-becbefc1aae4	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-469098"}	2026-10-20 10:51:09.192
f699f660-67b7-4f74-b9bb-c0fe1c03f017	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	2b16935d-f26c-49ee-8368-5c4e06016f63	\N	\N	{"employeeId": "7138fa1e-b154-44b7-b35b-becbefc1aae4", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:09.193
d53ca065-e917-4ba3-83d7-e19a5a0b232d	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	2b16935d-f26c-49ee-8368-5c4e06016f63	\N	\N	{"employeeId": "7138fa1e-b154-44b7-b35b-becbefc1aae4", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:09.216
2f837672-7ab7-43c1-98c1-dde067eaf0c7	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	7138fa1e-b154-44b7-b35b-becbefc1aae4	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "7138fa1e-b154-44b7-b35b-becbefc1aae4"}	2026-10-20 10:51:09.216
fba40f7c-a095-4e55-95f8-6988ac304798	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	8e4f1fa5-403f-4b9f-835d-2efae5773f35	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-469901"}	2026-10-20 10:51:10.005
d6060c90-bfbd-43c6-a529-23da9320cf4e	\N	FAILED_LOGIN	User	9fc202ea-8a60-414b-8a6c-ad3262ee9baa	::1	\N	{"reason": "Account is PENDING", "status": "PENDING", "identifier": "manager.ann.b2.1792489753700@titanauto.com"}	2026-10-20 09:49:13.807
f76446e4-134f-40f1-9dce-43f610d980aa	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	1fd17372-ad3a-4e6b-bca0-7c8fdba0f2b3	\N	\N	{"employeeId": "8e4f1fa5-403f-4b9f-835d-2efae5773f35", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:10.006
fb1ddf50-a7f4-4126-bde3-add351369234	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	1fd17372-ad3a-4e6b-bca0-7c8fdba0f2b3	\N	\N	{"employeeId": "8e4f1fa5-403f-4b9f-835d-2efae5773f35", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:10.031
bb039c1e-6f51-4a0e-b571-86d821ad2ac2	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	8e4f1fa5-403f-4b9f-835d-2efae5773f35	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "8e4f1fa5-403f-4b9f-835d-2efae5773f35"}	2026-10-20 10:51:10.032
25bb34e2-aefe-4497-99a1-7d5c921ccae4	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:51:10.239
76ac423f-f21a-4bb6-953d-ffcae8fb45fc	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	62ffa760-b2cb-4bc6-b04b-aece87655f31	\N	\N	{"branchId": "7e8800ac-0399-4c81-8c7f-15a7009c1549", "customerId": null, "leadNumber": "LD-2026-00039"}	2026-10-20 10:51:10.283
67989bd5-20be-43b7-882a-e1b66ac41fb6	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	62ffa760-b2cb-4bc6-b04b-aece87655f31	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 10:51:10.353
f1d92c40-4340-47cd-82f9-6fb9013a66b6	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	62ffa760-b2cb-4bc6-b04b-aece87655f31	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:51:10.37
b0d3a128-ec05-44ce-b849-5f0b5ab7088d	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	62ffa760-b2cb-4bc6-b04b-aece87655f31	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 10:51:10.416
12b25f38-aa79-47ef-93c4-aa60039ef1a6	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	62ffa760-b2cb-4bc6-b04b-aece87655f31	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 10:51:10.432
4fc36158-bbb1-4e48-aa31-d9e87015a43c	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	5c49ebd5-7d5a-4e0a-bfb7-4ba3990bdd7e	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792493470524", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 10:51:10.553
ac776ce5-56e8-4188-b558-ae35369522ea	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	7477dd19-20cf-4999-b488-922f73070bf2	\N	\N	{"title": "Internal Draft Policy Revision 1792493470568", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 10:51:10.581
00f5c489-f982-44e8-a2a3-2c2422b9da0c	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	7477dd19-20cf-4999-b488-922f73070bf2	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 10:51:10.606
eced657c-7aeb-432e-aaf6-7cf8fdbded77	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	20cc6c4f-8b6d-4289-9c57-ed410064f82d	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-470606"}	2026-10-20 10:51:10.702
1cd6b3b8-26b9-4341-92a2-c8172e699013	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	48772b49-3e88-43a0-8242-d48651c26e30	\N	\N	{"employeeId": "20cc6c4f-8b6d-4289-9c57-ed410064f82d", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:10.703
653eef4e-d1f5-44da-a8b0-e2f0b38041a3	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	48772b49-3e88-43a0-8242-d48651c26e30	\N	\N	{"employeeId": "20cc6c4f-8b6d-4289-9c57-ed410064f82d", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:10.726
86098d18-4aae-499b-87a0-35fff96c5fd9	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	20cc6c4f-8b6d-4289-9c57-ed410064f82d	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "20cc6c4f-8b6d-4289-9c57-ed410064f82d"}	2026-10-20 10:51:10.727
7f6f7b90-b11a-4688-be32-763865bc2c8b	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 10:51:10.977
29d3fa60-1bc7-4fa3-a603-30a9a2764fb4	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	c3eef865-5e82-4064-a21b-38f775fcc3e1	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "EM-470996"}	2026-10-20 10:51:11.092
32cf019e-28f3-47ed-bb6c-c403d42568b8	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	17b8da31-0b9d-4814-b1f4-61db7f0c64a9	\N	\N	{"employeeId": "c3eef865-5e82-4064-a21b-38f775fcc3e1", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:11.093
9132cb13-151a-43ef-8e58-e0a030792df7	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	17b8da31-0b9d-4814-b1f4-61db7f0c64a9	\N	\N	{"employeeId": "c3eef865-5e82-4064-a21b-38f775fcc3e1", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 10:51:11.116
d3f29cb1-a7ca-4844-b03f-aa1879c5fd66	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	c3eef865-5e82-4064-a21b-38f775fcc3e1	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "c3eef865-5e82-4064-a21b-38f775fcc3e1"}	2026-10-20 10:51:11.117
ea43193e-0fab-4e9c-ac61-0c9c65dd63ff	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	{"roles": ["SUPER_ADMIN"]}	2026-10-20 12:57:29.356
5315510e-1da2-488c-970d-46a2287a72ae	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	a5ce767c-e293-42b0-9008-b04b2227337d	\N	\N	{"name": "uhg", "budget": 100000, "branchId": "8f146f47-f6d8-4909-8b85-996f444f701b"}	2026-10-20 12:58:48.065
9ea91477-bd6a-463f-875f-da3c20426ac8	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	{"roles": ["SUPER_ADMIN"]}	2026-10-20 15:26:16.309
d5f783cb-91b0-4638-8025-3e397749af18	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"roles": ["SUPER_ADMIN"]}	2026-10-20 15:37:46.651
3c49f87c-03b8-485f-a9f9-9782374c17da	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:11:33.966
105ba1e7-36fc-4a7e-9e32-9bef363e6148	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	3505f7b0-62c1-4653-9eb3-315cbc90e4f5	\N	\N	{"branchId": "03777e88-eb9a-4eeb-acc4-7140cd3a2e42", "roleName": "SALES_EMPLOYEE", "employeeCode": "EM-693993"}	2026-10-20 16:11:34.124
f97b5670-dd59-400a-980e-66784769053f	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	9442e9e5-3835-4cd4-be0f-fa9b2675b64d	\N	\N	{"employeeId": "3505f7b0-62c1-4653-9eb3-315cbc90e4f5", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:11:34.134
f747abac-1405-4b8e-a8c7-f0601dcc0ee2	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	9442e9e5-3835-4cd4-be0f-fa9b2675b64d	\N	\N	{"employeeId": "3505f7b0-62c1-4653-9eb3-315cbc90e4f5", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:11:34.174
4c0bbe46-247b-4672-9f26-780274af0158	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	3505f7b0-62c1-4653-9eb3-315cbc90e4f5	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "3505f7b0-62c1-4653-9eb3-315cbc90e4f5"}	2026-10-20 16:11:34.176
9568172b-6e13-4ba7-a8c4-47495fa3b8d2	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:22:28.152
2faac2ea-8be4-4abb-a0f8-2faf76781efe	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_CREATED	Customer	279b4d5c-721c-4309-b8e4-89f8341a3ab6	\N	\N	{"name": "Singhania Logistics Ltd", "phone": "9822276022", "branchId": "c040709f-e409-4917-9769-ff54506eb9d5", "customerType": "BUSINESS"}	2026-10-20 16:22:28.386
ed2c5b57-5eec-43da-8d28-4196d74a60b4	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	cf1f279c-31a1-4945-91bf-cad4d864c1a3	\N	\N	{"branchId": "c040709f-e409-4917-9769-ff54506eb9d5", "customerId": null, "leadNumber": "LD-2026-00042"}	2026-10-20 16:22:28.879
f92b85a6-7704-499a-b8a3-a0779d556acf	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	cf1f279c-31a1-4945-91bf-cad4d864c1a3	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 16:22:28.964
2fa98ba9-07d0-425e-b165-543a75460b50	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	cf1f279c-31a1-4945-91bf-cad4d864c1a3	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 16:22:29.02
b97b52c9-e8e6-40ab-97dc-b03217a30050	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	0ac53568-bea2-4579-aed7-2411deda84d4	\N	\N	{"status": "VALID", "vehicleId": "0014e141-c54a-426a-a410-441b86a16842", "documentType": "PUC", "documentNumber": "PUC-RJ-349201"}	2026-10-20 16:22:29.286
4a58bb75-f91d-4d5b-8059-5210c13b0cb6	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	1a6f822a-3b70-4b60-a8f1-1d005abd929e	\N	\N	{"status": "EXPIRED", "vehicleId": "0014e141-c54a-426a-a410-441b86a16842", "documentType": "FITNESS_CERTIFICATE", "documentNumber": "FIT-RJ-349288"}	2026-10-20 16:22:29.353
7d7824d3-33f5-4f7d-b55d-5e15235d820a	\N	LOGIN	User	7a0c4d74-81cf-4f69-8717-492eb01aab78	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:01:06.704
42ddfe47-e592-40af-9ebf-81e00743cbf7	6e615919-94c1-4d29-bc5b-c87849479355	COMPLIANCE_DOC_CREATED	VehicleComplianceDocument	e9c17afc-8588-433d-9938-e10113db574a	\N	\N	{"status": "EXPIRING_SOON", "vehicleId": "0014e141-c54a-426a-a410-441b86a16842", "documentType": "ROAD_PERMIT", "documentNumber": "RP-IND-349357"}	2026-10-20 16:22:29.414
19dc9fc5-573c-4ec9-bbac-bfda53069edc	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:22:35.576
5f779959-05c2-4b92-b254-04081746263c	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_CREATED	Campaign	45bb5030-c464-4a04-9585-5088d22dc542	\N	\N	{"name": "Kharadi Highway Fleet Expo 1792513355718", "budget": 200000, "branchId": "c040709f-e409-4917-9769-ff54506eb9d5"}	2026-10-20 16:22:35.785
279bec9b-7874-46d4-a585-4846902395b4	6e615919-94c1-4d29-bc5b-c87849479355	CAMPAIGN_EXPENSE_RECORDED	CampaignExpense	d7dd2ace-1e87-4ef8-8f78-da6870ca09a0	\N	\N	{"title": "Stall Fabrication & Canopy Setup", "amount": 45000, "campaignId": "45bb5030-c464-4a04-9585-5088d22dc542"}	2026-10-20 16:22:35.874
91f5b21f-2a02-4033-bfaf-80587fb5310f	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	ad55a9ed-7b1d-4956-9a72-a601766f61bb	\N	\N	{"branchId": "c040709f-e409-4917-9769-ff54506eb9d5", "customerId": null, "leadNumber": "LD-2026-00043"}	2026-10-20 16:22:35.993
c06a64e8-965d-4277-bd37-2cbbef534254	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_APPLICATION_SUBMITTED	FinanceApplication	a5222278-fd05-40fe-9665-d1d0d62e4f59	\N	\N	{"provider": "Tata Capital Commercial Vehicle Finance", "loanAmount": 3600000, "loanReference": "TC-LN-1792513356162", "applicationNumber": "FIN-1792513356185-817"}	2026-10-20 16:22:36.211
2dc50267-ef05-4e2f-8a39-3ef6dd7b3d9f	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_SCHEDULE_GENERATED	FinanceApplication	a5222278-fd05-40fe-9665-d1d0d62e4f59	\N	\N	{"tenure": 48, "monthlyEmi": 92350, "firstDueDate": {}}	2026-10-20 16:22:36.396
533c14e9-3c2f-43a3-b85c-769a2ba18713	6e615919-94c1-4d29-bc5b-c87849479355	FINANCE_EMI_PAYMENT_RECORDED	FinanceEmiSchedule	8f46f065-b0cc-463a-a6c3-d160333acdef	\N	\N	{"amount": 92350, "newStatus": "PAID", "paymentMode": "NACH_ECS", "paymentReference": "NACH-1792513356464", "installmentNumber": 1, "financeApplicationId": "a5222278-fd05-40fe-9665-d1d0d62e4f59"}	2026-10-20 16:22:36.512
e9ae5043-8afc-4ee2-9da5-dcaea9268bbf	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_PREPARED	CustomerReminder	dcb26374-890f-4444-8908-402f23fd41f1	\N	\N	{"phone": "919876591569", "category": "SERVICE_DUE", "recipient": "Harpreet Singh"}	2026-10-20 16:22:36.694
d1908462-08a4-40d4-97d5-c16755d4e09d	6e615919-94c1-4d29-bc5b-c87849479355	CUSTOMER_REMINDER_WHATSAPP_OPENED	CustomerReminder	dcb26374-890f-4444-8908-402f23fd41f1	\N	\N	{"status": "USER_INITIATED", "category": "SERVICE_DUE", "recipientPhone": "919876591569"}	2026-10-20 16:22:36.736
e44c2051-ec50-460f-a3af-bb89fd97ed04	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	282484e6-8968-4d5e-b0b0-f7fc58e9ed59	\N	\N	{"branchId": "afbdfbbf-a027-49ea-b148-0aecf2f4a754", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-356765"}	2026-10-20 16:22:37.046
78ad2186-879c-43f8-a5fa-b7385606b125	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	b2b3f53d-5dbd-4df8-8bfb-e83b53c52b4a	\N	\N	{"employeeId": "282484e6-8968-4d5e-b0b0-f7fc58e9ed59", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:37.05
7626d096-db2a-4929-b36d-2c0261799f75	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	b2b3f53d-5dbd-4df8-8bfb-e83b53c52b4a	\N	\N	{"employeeId": "282484e6-8968-4d5e-b0b0-f7fc58e9ed59", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:37.126
ea2296d1-573d-4532-b3ac-dd80457dc8d9	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	282484e6-8968-4d5e-b0b0-f7fc58e9ed59	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "282484e6-8968-4d5e-b0b0-f7fc58e9ed59"}	2026-10-20 16:22:37.128
e55d9c34-bdfc-47ea-b139-394e77394e11	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:22:42.719
a432a35f-85e8-479c-819b-c81593e11eda	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	716d076b-4c39-4bde-90ad-e021cd8ab26f	\N	\N	{"branchId": "afbdfbbf-a027-49ea-b148-0aecf2f4a754", "roleName": "SALES_EMPLOYEE", "employeeCode": "SE-363971"}	2026-10-20 16:22:44.253
2e28e36e-1479-4ab2-9ec2-3a347eea72c4	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	eab00564-f99c-4327-ac27-ffa22e908656	\N	\N	{"employeeId": "716d076b-4c39-4bde-90ad-e021cd8ab26f", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:44.256
3cc6c43f-4d40-40a2-bde4-8c43a503f728	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	eab00564-f99c-4327-ac27-ffa22e908656	\N	\N	{"employeeId": "716d076b-4c39-4bde-90ad-e021cd8ab26f", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:44.365
15acf1f1-4133-4032-8a18-3881c993ef68	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	716d076b-4c39-4bde-90ad-e021cd8ab26f	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "716d076b-4c39-4bde-90ad-e021cd8ab26f"}	2026-10-20 16:22:44.368
fd9fa14e-7f73-4911-9682-7d7b837b0924	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:22:52.145
e713811f-f2d7-4b5f-9583-83b2a05f0d11	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_CREATED	Lead	d0aa6560-ea1d-46e4-87b5-332a89bee9ec	\N	\N	{"branchId": "c040709f-e409-4917-9769-ff54506eb9d5", "customerId": null, "leadNumber": "LD-2026-00044"}	2026-10-20 16:22:52.269
76305e4c-2130-423b-b814-ed4ee6eebaba	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	d0aa6560-ea1d-46e4-87b5-332a89bee9ec	\N	\N	{"newStatus": "CONTACTED"}	2026-10-20 16:22:52.525
fabd5a86-8062-4776-b659-55f98e27ba68	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	d0aa6560-ea1d-46e4-87b5-332a89bee9ec	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 16:22:52.579
86d85873-2060-4555-89fa-9180b12ee2a2	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	d0aa6560-ea1d-46e4-87b5-332a89bee9ec	\N	\N	{"newStatus": "LOST", "lostReason": "Client postponed fleet expansion due to mining concession renewal delay."}	2026-10-20 16:22:52.717
9e9f7508-dbc5-4c7d-a45c-6e23b28858cc	6e615919-94c1-4d29-bc5b-c87849479355	LEAD_STATUS_UPDATED	Lead	d0aa6560-ea1d-46e4-87b5-332a89bee9ec	\N	\N	{"newStatus": "QUALIFIED"}	2026-10-20 16:22:52.764
223aec8f-a4d8-4ae6-8ad4-93ae02246377	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	0545539f-062e-4944-881e-79d68bb3597d	\N	\N	{"title": "Q4 National Commercial Fleet Incentive Program 1792513373033", "status": "PUBLISHED", "audience": "PLATFORM_WIDE"}	2026-10-20 16:22:53.201
47deb436-60b6-49d1-9de9-e439df3c240e	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_CREATED	Announcement	d53ae3b2-0af2-44ed-a625-d58c9ed67655	\N	\N	{"title": "Internal Draft Policy Revision 1792513373236", "status": "DRAFT", "audience": "PLATFORM_WIDE"}	2026-10-20 16:22:53.288
a0d52043-3fc2-41ba-b938-430cd21f670a	6e615919-94c1-4d29-bc5b-c87849479355	ANNOUNCEMENT_UPDATED	Announcement	d53ae3b2-0af2-44ed-a625-d58c9ed67655	\N	\N	{"changes": {"status": "PUBLISHED"}}	2026-10-20 16:22:53.426
4b020da8-4888-4c94-860e-91b2f126c6f3	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	254e199b-cdac-4c33-aa88-2035f42d101e	\N	\N	{"branchId": "afbdfbbf-a027-49ea-b148-0aecf2f4a754", "roleName": "SALES_EMPLOYEE", "employeeCode": "BO-373425"}	2026-10-20 16:22:53.709
9d475982-fc05-4e1b-a384-5598445687f1	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	9121f6f6-1e85-454c-867a-bc7f6dd6dbba	\N	\N	{"employeeId": "254e199b-cdac-4c33-aa88-2035f42d101e", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:53.711
8a59126a-4690-4646-a5c2-d35ddb11e45b	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	9121f6f6-1e85-454c-867a-bc7f6dd6dbba	\N	\N	{"employeeId": "254e199b-cdac-4c33-aa88-2035f42d101e", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:22:53.786
6e9477e2-31b8-43d4-aa25-bb1eba500100	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	254e199b-cdac-4c33-aa88-2035f42d101e	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "254e199b-cdac-4c33-aa88-2035f42d101e"}	2026-10-20 16:22:53.788
25014e99-efa3-42cd-bcd1-e02f2d9b6504	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:24:06.186
935193f2-7b8f-4ba7-b1f6-8e102b535877	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_CREATED	Employee	4ad6a60d-5850-49a5-815f-41da0e61f028	\N	\N	{"branchId": "afbdfbbf-a027-49ea-b148-0aecf2f4a754", "roleName": "SALES_EMPLOYEE", "employeeCode": "EM-446242"}	2026-10-20 16:24:06.519
ff231b19-05fd-44df-882c-f9cb254356d6	6e615919-94c1-4d29-bc5b-c87849479355	APPROVAL_REQUESTED	EmployeeApprovalRequest	5d34c6b5-9b79-4317-a88c-61a18af4a41c	\N	\N	{"employeeId": "4ad6a60d-5850-49a5-815f-41da0e61f028", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:24:06.526
1cfd8968-a814-46b1-ba2b-9da323e228d6	6e615919-94c1-4d29-bc5b-c87849479355	EMPLOYEE_APPROVED	EmployeeApprovalRequest	5d34c6b5-9b79-4317-a88c-61a18af4a41c	\N	\N	{"employeeId": "4ad6a60d-5850-49a5-815f-41da0e61f028", "assignedRole": "SALES_EMPLOYEE"}	2026-10-20 16:24:06.624
5ae80857-c0b9-4aac-b8cd-55b88d01fb49	6e615919-94c1-4d29-bc5b-c87849479355	ROLE_ASSIGNED	Employee	4ad6a60d-5850-49a5-815f-41da0e61f028	\N	\N	{"roleName": "SALES_EMPLOYEE", "employeeId": "4ad6a60d-5850-49a5-815f-41da0e61f028"}	2026-10-20 16:24:06.627
aa297e29-c467-48a6-8afe-3c9b5ab43fdb	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"reason": "Invalid email or phone", "identifier": "branchmanager@titanauto.com"}	2026-10-20 16:26:37.794
bcde89ed-8a36-40f4-a398-a4f810534932	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"reason": "Invalid email or phone", "identifier": "mechanic@titanauto.com"}	2026-10-20 16:26:45.491
bd2320f2-0b68-43ce-acf9-f1bcc09794e3	\N	FAILED_LOGIN	User	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"reason": "Invalid email or phone", "identifier": "sales@titanauto.com"}	2026-10-20 16:26:48.541
ada4c8c3-1b03-4d62-8680-12645269a5cb	6e615919-94c1-4d29-bc5b-c87849479355	LOGIN	User	6e615919-94c1-4d29-bc5b-c87849479355	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:26:51.21
ed6c8489-e9e2-4967-8e7a-2c1eb18143a3	\N	LOGIN	User	bcd70ed7-835a-4b33-ad7f-f760299f05f2	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:24:36.803
b281da96-3b09-461b-8468-812b8f85ef95	\N	LOGIN	User	f4c394ca-deb7-459a-a151-063507c4b7b0	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:24:36.952
a3541e27-ab68-45c5-aad8-45eef3a1aff6	\N	LOGIN	User	eb222699-a0b6-442b-91cb-57c766f587c2	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:24:37.158
7a46dd7f-2ea9-4083-944a-8ae1c9309155	\N	LOGIN	User	273dd53e-503a-4885-8c2d-47fa1f078d95	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:24:37.304
e61487d3-ef91-4f26-89d7-0a3dc243c744	\N	LOGIN	User	e0afd672-bb99-4e3b-b8d5-b237ec382230	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:24:38.015
c9829fa0-aa2c-4af1-bc7c-888e3fbc7381	\N	CUSTOMER_REGISTERED	Customer	81c00ddb-e48d-41c1-a0ec-8d27c31e4934	::1	\N	{"email": "public_1792493020511@fleetuser.in", "customerId": "81c00ddb-e48d-41c1-a0ec-8d27c31e4934", "linkedExisting": false}	2026-10-20 10:43:40.575
4114be50-e478-4d4a-a002-4e292a227b4b	\N	LOGIN	User	29b2c8ed-b080-4290-a0cc-4c5ce13a3d3f	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:43:56.655
5914fc26-bf66-4e97-8a4a-4e76166f14df	\N	CUSTOMER_REGISTERED	Customer	9df3f95c-ffef-49d6-b457-58ff8588e171	::1	\N	{"email": "customer.phase3.1792493249900@titanfleet.in", "customerId": "9df3f95c-ffef-49d6-b457-58ff8588e171", "linkedExisting": false}	2026-10-20 10:47:29.967
99fa0879-dd8c-4eee-9b99-b4040f147961	\N	LOGIN	User	14bf4660-d508-4d0c-8e81-cdaefdf1d6bb	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:47:30.041
d54d3502-7233-4236-b854-60108b6ed3ca	\N	CUSTOMER_REGISTERED	Customer	d224e2c3-5abd-4e80-a78c-5b3332474a5b	::1	\N	{"email": "customer.sec.1792493350534@titanfleet.in", "customerId": "d224e2c3-5abd-4e80-a78c-5b3332474a5b", "linkedExisting": false}	2026-10-20 10:49:10.599
c799154b-4c93-4c9a-9abd-4b6261cb318b	\N	LOGIN	User	00d21da0-7998-45bb-b7ca-437d3a091752	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:49:10.674
0594ff27-f691-4d8e-9774-ad5982106ee7	\N	LOGIN	User	3cd1f172-7ec5-48e9-ba5b-ec65a91fb838	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:50:57.398
00a242eb-49cc-4e83-8b19-23f4fa5b8999	\N	CUSTOMER_REGISTERED	Customer	40a7817c-ae77-4022-8b91-6a02f8c4c6e7	::1	\N	{"email": "customer.sec.1792493457394@titanfleet.in", "customerId": "40a7817c-ae77-4022-8b91-6a02f8c4c6e7", "linkedExisting": false}	2026-10-20 10:50:57.459
62640777-a2bd-449d-add1-972ea1aa1286	\N	LOGIN	User	3018b15d-2b26-437b-b54d-2e6aa2d421bf	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:50:57.523
45d170eb-8898-4f6b-bb51-b851f0aca445	\N	CUSTOMER_REGISTERED	Customer	2b5b58f1-4781-4c06-a555-297fb2d417f8	::1	\N	{"email": "public_1792493468391@fleetuser.in", "customerId": "2b5b58f1-4781-4c06-a555-297fb2d417f8", "linkedExisting": false}	2026-10-20 10:51:08.451
92d65521-0bd5-4e90-b5ab-034d3726ad86	\N	LOGIN	User	89380630-4617-4239-962f-488bc83c7e83	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:51:10.791
5ecfd2e9-c396-4ca2-af59-b354b21b4f82	\N	LOGIN	User	5faa9852-e005-4c9e-8637-46adb876c915	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:51:11.183
8dd436f7-bd39-4138-8601-ffb62d174c87	\N	CUSTOMER_REGISTERED	Customer	0e837df8-659e-4c3c-b1c3-f468b1f111b7	::1	\N	{"email": "customer.sec.1792493471184@titanfleet.in", "customerId": "0e837df8-659e-4c3c-b1c3-f468b1f111b7", "linkedExisting": false}	2026-10-20 10:51:11.248
d55601d5-bde4-442d-9212-33803f6bd1e4	\N	LOGIN	User	c0fb589f-dcbc-4a5e-85cb-0b13129d692e	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:51:11.31
d822f1c6-03a7-462b-8cb9-34f837ec58ab	\N	LOGIN	User	7e23224a-b606-4996-b44f-393180f86263	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 16:11:34.25
504b588f-820a-429d-a37c-4b6f35d2f94c	\N	CUSTOMER_REGISTERED	Customer	02a7d3ed-b42f-4b8e-9ffb-89a3a43be727	::1	\N	{"email": "customer.sec.1792512694249@titanfleet.in", "customerId": "02a7d3ed-b42f-4b8e-9ffb-89a3a43be727", "linkedExisting": false}	2026-10-20 16:11:34.325
eea319f4-6b9a-48e1-b99a-9db4a651b285	\N	LOGIN	User	5125beba-a78a-4e96-9130-5db247a145eb	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:11:34.398
ccf5f66e-fa6c-4ca6-b359-54fe77d902ac	\N	LOGIN	User	1e345464-869f-4050-9809-965e952bd759	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:15:50.731
f1fb6b4a-8841-40c6-b277-e3f2d875a10d	\N	LOGIN	User	3d512abb-4721-4c74-b63c-08fb2c284702	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:15:50.885
6fb61eab-a1f7-4164-8454-bfc5e3427964	\N	LOGIN	User	00071550-a60d-4725-bc1a-150b75efa3bd	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:15:51.027
bad08aae-ff68-4ccf-b907-94b530f94b93	\N	LOGIN	User	cc039bf8-da7f-4940-baed-c5d096666f69	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:15:51.172
7445c99a-d2bd-4eba-b972-c2634b448cc6	\N	LOGIN	User	95385ce5-408f-4d48-b02f-138c3a2d4c91	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:15:51.342
9f1c27b8-d945-4591-8e2d-8ca4c5df4972	\N	LOGIN	User	3e2c2dc5-ecad-4f8e-b068-faa93b78f457	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:15:51.498
f0929027-31ba-448d-a946-1b0ad6be664b	\N	LOGIN	User	18d12cb9-a98b-471e-adcb-b18b9774e39f	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:15:51.644
649d6510-c360-4e01-9568-1b05ea745220	\N	FAILED_LOGIN	User	c10b1665-bb44-42f5-a4e5-18a78e197b2e	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"reason": "Invalid password", "identifier": "sales.jaipur@titanauto.com"}	2026-10-20 06:44:22.025
4dcae56b-7b7a-4052-bf18-a4e486fd4653	\N	FAILED_LOGIN	User	c10b1665-bb44-42f5-a4e5-18a78e197b2e	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"reason": "Invalid password", "identifier": "sales.jaipur@titanauto.com"}	2026-10-20 06:45:09.68
1c64e004-b7ea-403f-a101-569fabab11c4	\N	LOGIN	User	c10b1665-bb44-42f5-a4e5-18a78e197b2e	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9711	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 06:45:23.425
2eae43a6-53f9-4c10-b0e4-6fada91d8c65	\N	LOGIN	User	dcd5f6c7-3c17-4412-b962-2839898e05e7	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 16:22:37.316
4d8016c1-51b3-4144-b6ab-282bd21269e8	\N	LOGIN	User	b6791a02-7cb3-4eb5-a98d-ce499d13efc5	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 16:22:44.515
a50bc6b2-57c8-40f8-bcce-7ec37f9c7f5e	\N	LOGIN	User	f060a6c6-8de9-4731-a34c-093a710ac8b2	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:24:37.659
002a9db1-057e-468b-8a5a-1920e05fdaee	\N	LOGIN	User	f6a23e1b-b764-4235-aaff-762d17692356	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:24:37.854
f5eefe3e-c78e-4275-b1dd-789b925d226b	\N	LOGIN	User	c288a356-7bbe-4ff0-be89-6b0156f50474	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:43:51.63
a21ca384-ad6d-4cd9-ac4b-384cf94c7642	\N	LOGIN	User	622b90d4-5bb1-4fa9-a2de-330c3fa296d9	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 09:50:12.163
4a5a6ab9-02e8-4f89-aaa8-ec42e28093f1	\N	CUSTOMER_REGISTERED	Customer	b96c0d03-f05b-4d67-9bfa-7b66c3ff3185	::1	\N	{"email": "customer.phase3.1792490473049@titanfleet.in", "customerId": "b96c0d03-f05b-4d67-9bfa-7b66c3ff3185", "linkedExisting": false}	2026-10-20 10:01:13.115
d39536ad-f2f5-4d4f-9d0e-01578bec96c0	\N	CUSTOMER_REGISTERED	Customer	8d9473ee-ed5a-48f9-82e8-48c1634ae165	::1	\N	{"email": "public_1792493241653@fleetuser.in", "customerId": "8d9473ee-ed5a-48f9-82e8-48c1634ae165", "linkedExisting": false}	2026-10-20 10:47:21.722
a27f2cc0-68fc-4cd4-898b-65d568ed076a	\N	LOGIN	User	e941f8f4-2d9b-4e92-8342-360bc7aee703	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:43:46.426
27da1d9f-50a1-41f2-ba5a-2fc5d97fd8ce	\N	CUSTOMER_REGISTERED	Customer	f9fe6ffe-1f07-4215-bce4-9774474a3636	::1	\N	{"email": "customer.sec.1792493371861@titanfleet.in", "customerId": "f9fe6ffe-1f07-4215-bce4-9774474a3636", "linkedExisting": false}	2026-10-20 10:49:31.924
6e97c0d4-bd67-4fae-a94b-a5036fe4db80	\N	LOGIN	User	00e30f4b-c562-45ad-9bf7-6f30eb59a522	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:49:31.988
4f7607d2-311f-492d-be7d-ecab412318d6	\N	LOGIN	User	53f21852-d894-4701-9601-149ed2855375	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:47:30.42
456eea76-cec5-4faf-8f16-512a4fb0f7f4	\N	FAILED_LOGIN	User	45203f79-9fa6-41ff-95bb-6b136489fb72	::ffff:127.0.0.1	\N	{"email": "inactive-test-1791126995111@titanauto.com", "reason": "Account is INACTIVE", "status": "INACTIVE"}	2026-10-04 15:16:35.607
c99b3045-b543-488e-8a65-120cf07b2573	\N	FAILED_LOGIN	User	2dc6ae3a-9665-411b-97f1-ee3676ab739c	::ffff:127.0.0.1	\N	{"email": "suspended-test-1791126995114@titanauto.com", "reason": "Account is SUSPENDED", "status": "SUSPENDED"}	2026-10-04 15:16:35.616
3c8a89b6-8457-4fc2-9e5d-00e3750a9645	\N	LOGIN	User	14bdd18b-6ddf-498f-9f51-9a55c242cc82	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:16:35.213
f9a4571a-7a6c-4804-be80-06183f914163	\N	LOGIN	User	51b3c6f4-fee2-424b-8372-6a4e6a7329e9	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:16:35.216
4688c4dd-d6c3-4428-b061-691f5816bb76	\N	LOGIN	User	39a50ae8-4dcc-4f2c-a1f7-f0db828711ec	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:16:35.229
10016e64-671b-4267-a12d-8f16a5ae6ddd	\N	FAILED_LOGIN	User	39a50ae8-4dcc-4f2c-a1f7-f0db828711ec	::ffff:127.0.0.1	\N	{"email": "admin-test-1791126995075@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:16:35.575
367f616f-cef1-402f-a7e8-dd27e463d47c	\N	FAILED_LOGIN	User	39a50ae8-4dcc-4f2c-a1f7-f0db828711ec	::ffff:127.0.0.1	\N	{"email": "admin-test-1791126995075@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:16:35.598
03be1c7b-0930-41d3-9793-3689a5edfefe	\N	FAILED_LOGIN	User	39a50ae8-4dcc-4f2c-a1f7-f0db828711ec	::ffff:127.0.0.1	\N	{"email": "admin-test-1791126995075@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:16:35.707
1ff2e5f6-1794-4512-bf18-70ef26241014	\N	EMPLOYEE_APPROVED	EmployeeApprovalRequest	cac0bdd3-f20b-430c-9ae6-36fdb2972295	\N	\N	{"employeeId": "f1944515-2f51-4319-8a25-5dfe9586d723", "assignedRole": "MECHANIC"}	2026-10-04 15:16:35.912
bad48ec8-abca-435c-a999-981bc5090c1d	\N	EMPLOYEE_DEACTIVATED	Employee	f1944515-2f51-4319-8a25-5dfe9586d723	\N	\N	{"email": "new-mechanic-1791126995749@titanauto.com", "employeeCode": "EMP-JD-1791126995749"}	2026-10-04 15:16:35.954
cd34fe8d-6507-4774-8c43-440510210a63	\N	LOGIN	User	472e393f-be24-4de1-87c5-e7b57ca20c5a	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:16:35.237
4f69f1e7-156b-401e-91f1-12ae4e7f07e9	\N	EMPLOYEE_APPROVED	EmployeeApprovalRequest	7b376d7c-1d4d-47de-b8e3-00ce8e91393c	\N	\N	{"employeeId": "41f126f9-f512-42fa-b680-ed9e623a8c4d", "assignedRole": "MECHANIC"}	2026-10-04 15:16:35.785
5ae73683-51a2-4f74-93de-501b11157517	\N	LOGIN	User	49930e50-c62f-4f8a-86e3-67604c1cfd6a	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:16:35.319
eefd0b0d-18a1-4a19-9093-5a00bdd31b57	\N	LOGIN	User	71b0479a-3c15-4da8-90e9-eb105502fd7a	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:16:35.325
d2c9e178-8f26-42ba-a230-2088c0c91587	\N	LOGIN	User	4b8bbd0b-9018-4155-987c-ed5f1e6b5af9	::ffff:127.0.0.1	\N	{"roles": ["MECHANIC"]}	2026-10-04 15:16:35.403
ba718ad5-1923-41e9-8037-efbe7af1f77f	\N	LOGIN	User	0942be4a-5ac5-4266-994e-6aafbe423fb0	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:16:35.412
5113637e-f8fe-4760-b0a8-a2f6d646950d	\N	LOGIN	User	e443f3c3-8beb-4055-9e6a-2f8503c16fe5	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-04 15:16:35.486
9b04a06a-8e46-4390-a454-f8ee7107de7e	\N	LOGIN	User	093f2068-1e1c-4b0f-8ccc-de3183a1f65c	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-04 15:16:35.491
9eb98808-8d60-4589-8701-ec6b214da192	\N	LOGIN	User	05e8c815-d669-44cb-a78d-8b7831ccc9b9	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:18:07.668
c1cd1e5d-71f8-4d68-beee-46824b70a712	\N	LOGIN	User	5236f2a2-1670-403f-aa88-75c7b17a8345	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:18:53.251
01567ff9-4e9b-48a6-bb1f-d827bbda8c2c	\N	CUSTOMER_CREATED	Customer	8c7cb425-73e0-432f-9051-0925d08e9493	\N	\N	{"name": "Fleet Logistics Ltd", "phone": "+919876543210"}	2026-10-04 15:18:53.303
fbbd420c-4f5e-48eb-90c0-9752fd45fb82	\N	LEAD_CREATED	Lead	5479a2fa-2461-42f8-af3d-d9c66cff3824	\N	\N	{"branchId": "8b54c2ab-fa8a-4051-a8ee-40bb27a17bdd", "customerId": "8c7cb425-73e0-432f-9051-0925d08e9493"}	2026-10-04 15:18:53.349
e748685a-4b02-4445-b607-52e355c4a8a8	\N	VEHICLE_CREATED	Vehicle	cb1a0f7f-c384-4456-942e-c96f3f70c522	\N	\N	{"vin": "VINPHASE21791127132704", "branchId": "8b54c2ab-fa8a-4051-a8ee-40bb27a17bdd"}	2026-10-04 15:18:53.515
ec7cdc6c-4b64-4cd4-ab3a-4067f39bc2de	\N	QUOTATION_CREATED	Quotation	f53537ce-7e81-45b0-a4f0-6f9e3339f6d4	\N	\N	{"status": "SUBMITTED", "totalAmount": 5529600, "quotationNumber": "QT-1791127133545-754"}	2026-10-04 15:18:53.562
d137e54a-5f85-49d0-ae87-890605b1cf9a	\N	QUOTATION_APPROVED	Quotation	f53537ce-7e81-45b0-a4f0-6f9e3339f6d4	\N	\N	{"quotationNumber": "QT-1791127133545-754"}	2026-10-04 15:18:53.603
0a49d968-20b0-427a-a6cc-97a1f317eeaf	\N	BOOKING_CONFIRMED	Booking	2eb8cf97-8dc3-4520-88d3-10f2116ed86c	\N	\N	{"vehicleId": "cb1a0f7f-c384-4456-942e-c96f3f70c522", "totalAmount": 5529600, "bookingNumber": "BK-1791127133628-452"}	2026-10-04 15:18:53.658
63cece6d-4fb0-4380-8421-3a2fb4e0a22c	\N	PAYMENT_ORDER_CREATED	Payment	c98fc56b-d7bb-47d6-b998-a68799ed33e5	\N	\N	{"amount": 500000, "bookingId": "2eb8cf97-8dc3-4520-88d3-10f2116ed86c", "gatewayOrderId": "ORD-1791127133742-2432"}	2026-10-04 15:18:53.756
df92297d-89fd-4d9a-8da1-eb18a6e80d8d	\N	PAYMENT_VERIFIED_SUCCESS	Payment	c98fc56b-d7bb-47d6-b998-a68799ed33e5	\N	\N	{"amount": 500000, "bookingId": "2eb8cf97-8dc3-4520-88d3-10f2116ed86c", "gatewayPaymentId": "PAY_RZP_1791127133756"}	2026-10-04 15:18:53.789
e1855c82-e525-4cad-9926-a1f2af33d524	\N	FINANCE_APPLICATION_SUBMITTED	FinanceApplication	35d2d058-8332-4171-90b5-79bbaef3646f	\N	\N	{"provider": "HDFC Commercial Vehicle Finance", "loanAmount": 4000000, "applicationNumber": "FIN-1791127133850-584"}	2026-10-04 15:18:53.867
4cfe8876-cea5-423c-a3ff-b8c2b1012d78	\N	INSURANCE_POLICY_CREATED	InsurancePolicy	a5d6a941-938c-48ac-934e-1fe7113dcb8c	\N	\N	{"insurer": "ICICI Lombard General Insurance", "premium": 45000, "policyNumber": "POL-1791127133886-860"}	2026-10-04 15:18:53.901
9c3144e9-efff-4cf3-8647-8f3df5e7818f	\N	VEHICLE_ALLOCATED	Vehicle	cb1a0f7f-c384-4456-942e-c96f3f70c522	\N	\N	{"bookingId": "2eb8cf97-8dc3-4520-88d3-10f2116ed86c"}	2026-10-04 15:18:53.954
df6ad970-369e-4031-bc18-25a6f653cb29	\N	PDI_INSPECTION_PASSED	PdiInspection	b2f65097-0759-4835-bc81-c867b059fad5	\N	\N	{"status": "PASSED", "vehicleId": "cb1a0f7f-c384-4456-942e-c96f3f70c522"}	2026-10-04 15:18:53.988
d113476b-952a-4623-a8c6-dd7d0471b010	\N	INVOICE_ISSUED	Invoice	c49ce0f5-cc13-4a1a-a78b-3ca352428127	\N	\N	{"gstin": "27AAAAA0000A1Z5", "totalAmount": 5376000, "invoiceNumber": "INV-1791127134043-500"}	2026-10-04 15:18:54.062
cecb8d3c-6a53-4468-9fb5-718f204afee1	\N	VEHICLE_DELIVERY_COMPLETED	Delivery	eb68e4d4-4f38-488d-935d-5cedc1b20f58	\N	\N	{"vin": "VINPHASE21791127132704", "bookingId": "2eb8cf97-8dc3-4520-88d3-10f2116ed86c", "customerId": "8c7cb425-73e0-432f-9051-0925d08e9493", "deliveryNumber": "DEL-1791127134082-815"}	2026-10-04 15:18:54.106
cbf8409b-ea8f-4ff0-bde4-99dc63b78d44	\N	LOGIN	User	14d98604-b9e3-4815-abd0-76d4d73d2d3e	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:19:05.82
439a7a07-f655-46ed-8815-f689b672a57e	\N	LOGIN	User	8a1baedc-49f9-4065-b15e-29b97a958b62	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:20:34.114
e195cc83-cfa0-4ad7-a234-88a500d17326	\N	SERVICE_APPOINTMENT_REQUESTED	ServiceAppointment	e4876d46-19f8-4cfc-95a0-9f1416f10756	\N	\N	{"vehicleId": "b3f2d80d-dcdb-4f36-bc7e-bd8e86bb8008", "customerId": "45276e08-adac-44d9-ad60-fc8c08129bfb", "appointmentNumber": "APT-1791127234192-633"}	2026-10-04 15:20:34.215
c3612e16-a21f-40b4-acb9-afb14968a61e	\N	SERVICE_APPOINTMENT_CONFIRMED	ServiceAppointment	e4876d46-19f8-4cfc-95a0-9f1416f10756	\N	\N	{"status": "CONFIRMED", "appointmentNumber": "APT-1791127234192-633"}	2026-10-04 15:20:34.256
80e3d792-6870-44bc-ae90-f5b0b37f0a40	\N	SERVICE_JOB_CREATED	ServiceJob	65b9bf01-951e-427f-8e3e-def26eb86148	\N	\N	{"jobNumber": "JOB-1791127234277-850", "vehicleId": "b3f2d80d-dcdb-4f36-bc7e-bd8e86bb8008", "customerId": "45276e08-adac-44d9-ad60-fc8c08129bfb"}	2026-10-04 15:20:34.307
2f187d26-ba24-4596-842e-e5a6e66ce136	\N	SERVICE_DIAGNOSIS_RECORDED	ServiceDiagnosis	5ceb161c-2ced-4105-b339-74484c122a9d	\N	\N	{"serviceJobId": "65b9bf01-951e-427f-8e3e-def26eb86148", "additionalCost": 12500}	2026-10-04 15:20:34.341
8b2d9d05-0dec-4710-81a5-aa45a84488a4	\N	CUSTOMER_WORK_APPROVAL_APPROVED	ServiceApproval	f89663f0-516a-4092-ace9-f46db2319d39	\N	\N	{"decision": "APPROVED", "serviceJobId": "65b9bf01-951e-427f-8e3e-def26eb86148"}	2026-10-04 15:20:34.408
cb79d5c7-019f-463d-ac05-88ee7dca748b	\N	SERVICE_JOB_PART_ISSUED	ServiceJobPart	7b9155c7-32e7-4804-bf4b-9a416d00c1a9	\N	\N	{"qty": 1, "partId": "c95a5b21-d075-446c-9a1a-41ebcdab2bf9", "serviceJobId": "65b9bf01-951e-427f-8e3e-def26eb86148"}	2026-10-04 15:20:34.475
c6c4781b-7176-4617-9233-6b4925c5eee5	\N	SERVICE_LABOUR_ADDED	ServiceLabour	a9b6ad40-cd5a-4b1f-b1ad-a7fd2d44a303	\N	\N	{"totalAmount": 3894, "serviceJobId": "65b9bf01-951e-427f-8e3e-def26eb86148"}	2026-10-04 15:20:34.501
704958d4-f5cc-4e96-a73e-5d6d8ed6796b	\N	SERVICE_QC_PASSED	ServiceQc	2bec0f5d-814f-44b0-98e9-d360890f9b6a	\N	\N	{"status": "PASSED", "serviceJobId": "65b9bf01-951e-427f-8e3e-def26eb86148"}	2026-10-04 15:20:34.531
5626a44d-852e-4044-a097-34a6829f3f5a	\N	INVOICE_ISSUED	Invoice	62cf6729-24ae-4619-b77d-b956d45af3ff	\N	\N	{"totalAmount": 21830, "invoiceNumber": "INV-1791127234573-666"}	2026-10-04 15:20:34.587
99f67367-da35-45bd-a736-2c858e4b754e	\N	SERVICE_JOB_STATUS_COMPLETED	ServiceJob	65b9bf01-951e-427f-8e3e-def26eb86148	\N	\N	{"jobNumber": "JOB-1791127234277-850", "newStatus": "COMPLETED", "previousStatus": "READY_FOR_DELIVERY"}	2026-10-04 15:20:34.617
b02b3452-b440-4c80-b874-5388b09680c5	\N	FAILED_LOGIN	User	8e8e3690-56f0-4e57-95ff-6ad1b1dafeb2	::ffff:127.0.0.1	\N	{"email": "inactive-test-1791127345128@titanauto.com", "reason": "Account is INACTIVE", "status": "INACTIVE"}	2026-10-04 15:22:25.596
a10a23d2-0c47-4c11-aed1-dd35e295561a	\N	LOGIN	User	f60852f1-6382-4cd0-ac2d-78c9af234883	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:51:09.279
e14b4dcf-4a5c-4a49-a98a-a88a52cef0d4	\N	LOGIN	User	755b2211-9586-4bfe-95bb-f66f06f177a1	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:13:08.629
79e5424f-e8ec-4644-b181-0a0b9868adae	\N	LOGIN	User	74f40bc5-d038-4695-a18d-50e667c5b942	::ffff:127.0.0.1	\N	{"roles": ["FRANCHISE_MANAGER"]}	2026-10-20 16:13:08.707
bba79431-6848-42ac-b4c3-5dcace107c68	\N	LOGIN	User	cce5016c-992e-4d06-85d8-2dec58e3a239	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:13:08.783
75c6d413-69ba-4adb-8083-920ca5d3461d	\N	LOGIN	User	5b76e6df-53e1-4302-b3da-cd52fc9b6350	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:13:08.861
98305043-5bfe-4411-922d-382857940f27	\N	FAILED_LOGIN	User	8b39c2f9-7e5a-40d5-9f90-da034078e991	::ffff:127.0.0.1	\N	{"email": "suspended-test-1791127345131@titanauto.com", "reason": "Account is SUSPENDED", "status": "SUSPENDED"}	2026-10-04 15:22:25.607
3379d436-9014-4ac0-8481-02830ea8a8e2	\N	LOGIN	User	8f0e4196-0388-4890-a037-630de09ea22a	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:22:25.332
47d579cd-1a44-4808-9220-f5be8ffa2ca9	\N	LOGIN	User	eb56280c-8e1c-4544-bf47-f0e6d7092802	::ffff:127.0.0.1	\N	{"roles": ["MECHANIC"]}	2026-10-04 15:22:25.413
837a5d34-72cd-4937-9366-8e066156ca09	\N	LOGIN	User	2689f569-76bf-4254-a58a-de74488362f4	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-04 15:22:25.487
b753bd03-be08-4057-b697-2f700627ad85	\N	LOGIN	User	1171c82c-dd78-4f82-bee7-d1de19a02811	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:25.245
741d57fc-1a34-4e0b-b79e-cce0fe7922d1	\N	LOGIN	User	1171c82c-dd78-4f82-bee7-d1de19a02811	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:25.57
0bde51bd-672c-431b-8d98-36d9a96ff831	\N	FAILED_LOGIN	User	1171c82c-dd78-4f82-bee7-d1de19a02811	::ffff:127.0.0.1	\N	{"email": "admin-test-1791127345097@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:22:25.584
cdea7562-757e-456e-b0fc-5803d8b13144	\N	LOGIN	User	1171c82c-dd78-4f82-bee7-d1de19a02811	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:25.715
5e35a5c2-96f4-465b-8b78-0ab1dec5958a	\N	EMPLOYEE_APPROVED	EmployeeApprovalRequest	f1bd7842-c7b9-48a8-9d02-aaaf2d29664e	\N	\N	{"employeeId": "da77abfd-82f0-46ab-aea0-775ee5811f93", "assignedRole": "MECHANIC"}	2026-10-04 15:22:25.986
a429d38a-b302-40af-96f1-c0b350e49952	\N	EMPLOYEE_DEACTIVATED	Employee	da77abfd-82f0-46ab-aea0-775ee5811f93	\N	\N	{"email": "new-mechanic-1791127345773@titanauto.com", "employeeCode": "EMP-JD-1791127345773"}	2026-10-04 15:22:26.028
cf5b5017-c024-429d-9ff1-68444f3eccf7	\N	LOGIN	User	fafb1c6d-f163-4aef-9899-f8d66860a66f	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:36.999
19f9c01d-fbda-4e9f-a7cd-e13945333e78	\N	SERVICE_APPOINTMENT_REQUESTED	ServiceAppointment	4f0daaea-bb6d-4051-b4fe-14f92a6f0f13	\N	\N	{"vehicleId": "3a8517b0-e9b7-4949-9ff2-3edd540cda73", "customerId": "cd7effaa-ccc6-400f-b898-03ebf90ab301", "appointmentNumber": "APT-1791127357085-681"}	2026-10-04 15:22:37.109
270facdd-bb92-4010-87b4-9807f5ff7e1a	\N	SERVICE_APPOINTMENT_CONFIRMED	ServiceAppointment	4f0daaea-bb6d-4051-b4fe-14f92a6f0f13	\N	\N	{"status": "CONFIRMED", "appointmentNumber": "APT-1791127357085-681"}	2026-10-04 15:22:37.155
e2afbc47-14eb-4dbd-8391-ad9553aba4e2	\N	SERVICE_JOB_CREATED	ServiceJob	687ec447-e00a-4749-a510-d371ce12775c	\N	\N	{"jobNumber": "JOB-1791127357178-749", "vehicleId": "3a8517b0-e9b7-4949-9ff2-3edd540cda73", "customerId": "cd7effaa-ccc6-400f-b898-03ebf90ab301"}	2026-10-04 15:22:37.21
3ef8297e-670e-4d57-9c6e-26ee6285bf47	\N	SERVICE_DIAGNOSIS_RECORDED	ServiceDiagnosis	72015c32-dff3-48f3-a7f8-328ea56954f2	\N	\N	{"serviceJobId": "687ec447-e00a-4749-a510-d371ce12775c", "additionalCost": 12500}	2026-10-04 15:22:37.246
b9cd64d0-ca41-495c-a031-d629432f51f1	\N	CUSTOMER_WORK_APPROVAL_APPROVED	ServiceApproval	5c369a2f-25f0-4108-8c31-d4a62f733262	\N	\N	{"decision": "APPROVED", "serviceJobId": "687ec447-e00a-4749-a510-d371ce12775c"}	2026-10-04 15:22:37.316
671ef012-a661-47a0-a88e-107c5852308a	\N	SERVICE_JOB_PART_ISSUED	ServiceJobPart	27c5fcc5-17f3-4228-90b2-125ec9916a5f	\N	\N	{"qty": 1, "partId": "34e258cc-b689-4023-a608-eeb58d79ee37", "serviceJobId": "687ec447-e00a-4749-a510-d371ce12775c"}	2026-10-04 15:22:37.392
ec215023-a200-464a-a88c-81ce7c13d1bd	\N	SERVICE_LABOUR_ADDED	ServiceLabour	e3740779-aa00-4206-bb27-2aace9e93975	\N	\N	{"totalAmount": 3894, "serviceJobId": "687ec447-e00a-4749-a510-d371ce12775c"}	2026-10-04 15:22:37.425
ce5dec75-55cf-4142-b9c3-d2c4bf240d9f	\N	SERVICE_QC_PASSED	ServiceQc	c6e9662e-8d2d-4a10-9233-9b631253ce47	\N	\N	{"status": "PASSED", "serviceJobId": "687ec447-e00a-4749-a510-d371ce12775c"}	2026-10-04 15:22:37.461
f935c23a-faf7-4b59-8fc6-3e7cf9ffa0b4	\N	INVOICE_ISSUED	Invoice	6e581031-d0ce-494f-8e49-cb28afccaf39	\N	\N	{"totalAmount": 21830, "invoiceNumber": "INV-1791127357520-884"}	2026-10-04 15:22:37.537
ed8550c9-d787-4ad5-b34f-d307bba0008a	\N	SERVICE_JOB_STATUS_COMPLETED	ServiceJob	687ec447-e00a-4749-a510-d371ce12775c	\N	\N	{"jobNumber": "JOB-1791127357178-749", "newStatus": "COMPLETED", "previousStatus": "READY_FOR_DELIVERY"}	2026-10-04 15:22:37.577
01f121b6-8e5f-4261-9366-9233f353fd75	\N	LOGIN	User	4f27a0ec-6ace-4dd9-bf10-85f7d8f49265	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:37.037
95c9ad40-8bf4-450b-88ac-c11ff82d9d59	\N	EMPLOYEE_APPROVED	EmployeeApprovalRequest	0b9c3a9e-3e24-436e-b74a-13e9c4426db1	\N	\N	{"employeeId": "edf678f9-d36c-402a-8b0d-16aa6e91a8f2", "assignedRole": "MECHANIC"}	2026-10-04 15:22:37.628
a1401e05-a6e1-4c9c-9f86-3acf359103ee	\N	LOGIN	User	0d2a4ae0-8301-4dcf-8ce8-e0694e16d0dc	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9444	{"roles": ["CUSTOMER"]}	2026-10-04 15:30:31.189
c0324181-b898-4109-a121-c2fcfbc9c882	\N	LOGIN	User	0d2a4ae0-8301-4dcf-8ce8-e0694e16d0dc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"roles": ["CUSTOMER"]}	2026-10-04 15:31:44.837
c0c37aaa-21b0-439f-b989-58cc9174bed0	\N	LOGIN	User	0d2a4ae0-8301-4dcf-8ce8-e0694e16d0dc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	{"roles": ["CUSTOMER"]}	2026-10-04 15:31:56.938
e0f291e9-5331-4a3c-8a16-6c7c68206c20	\N	LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9444	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:29:03.064
c436b8dd-8fe0-4b6a-89cc-6f5eb27a3f5f	\N	LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9444	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:30:22.984
bb925485-1e77-4dcc-879c-6581665cb431	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 07:51:00.301
990ae0cc-c3c3-4e16-9024-1efe3c614ff9	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 07:51:33.658
7cd048c6-fc39-47a1-a471-ae17fab69a72	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 07:52:20.514
646ce638-c305-4750-ac8c-63ab2270d187	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 08:16:42.014
ab9a8bf7-60ad-4f9c-b5be-4eb852a1dc81	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 08:28:05.339
e8386aae-6618-4652-8b53-e1c0c5526bd6	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 08:39:11.512
b9f7d87d-6bec-4003-aebb-9e5cee2a017e	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 09:06:08.995
58530579-bbc8-4661-84a4-fb2e52c628e4	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 10:01:01.711
9376fb64-e11d-4a05-b5ee-620181c75ee5	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 10:43:40.51
9140d540-e6f1-4faf-8e3c-6fb76b135bb8	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 10:47:21.652
4d70184d-9a3e-495c-a98f-458d830f03e2	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 10:51:08.389
47ee081b-5c5c-42b5-90b5-68153ee7850a	\N	FAILED_LOGIN	User	c24780fe-a575-41a5-9052-c9cd3b860c58	::1	\N	{"reason": "Invalid password", "identifier": "manager.jaipur@titanauto.com"}	2026-10-20 16:22:28.615
9361d0bf-9810-4780-826f-e1e046332262	\N	FAILED_LOGIN	User	4d720454-ac2f-49e3-8643-ec0b7914de1f	::ffff:127.0.0.1	\N	{"email": "inactive-test-1791127356970@titanauto.com", "reason": "Account is INACTIVE", "status": "INACTIVE"}	2026-10-04 15:22:37.443
1719d352-e331-4aa0-8a9c-e8a3d3252491	\N	FAILED_LOGIN	User	84a602d7-7fc0-4620-9601-1d96f2d02547	::ffff:127.0.0.1	\N	{"email": "suspended-test-1791127356972@titanauto.com", "reason": "Account is SUSPENDED", "status": "SUSPENDED"}	2026-10-04 15:22:37.453
adc82863-6755-48a6-a39d-4aa313119b56	\N	LOGIN	User	2affdce9-2b86-4784-a954-50ac061c75e8	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:22:37.125
591c2a6e-0a3f-467d-9573-5c49fa4e1cb9	\N	LOGIN	User	894ab54f-8858-409f-858a-8c4ddad39250	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:22:37.179
40fbb7b3-32ec-4ada-adc8-e1c0ff691db6	\N	LOGIN	User	c043b1d1-147d-4b43-a308-368c15d9c04f	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-04 15:22:37.204
c0fc51ab-f96c-4b81-bd68-b9500be7dd29	\N	LOGIN	User	69548009-9ccb-4fcb-8e2d-5dc8079df0b7	::ffff:127.0.0.1	\N	{"roles": ["MECHANIC"]}	2026-10-04 15:22:37.259
a7036f2f-628f-4168-8ae0-59d6338c11b9	\N	LOGIN	User	e27871c2-44c9-4bb3-87b9-051b6dff9a42	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-04 15:22:37.281
3dd58ead-2f34-4d0f-b2a1-8f465baf6949	\N	LOGIN	User	4cc90016-01e2-49ef-ae67-c2281c4db94e	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-04 15:22:37.331
98bff182-7fee-4967-b935-256946bde1d4	\N	LOGIN	User	fce85911-decc-4551-9902-6f7832f8e19a	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:37.092
288248f9-1786-4e41-81a3-eda4ac566080	\N	LOGIN	User	fce85911-decc-4551-9902-6f7832f8e19a	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:37.417
3d176233-ee63-4dff-8ad0-0d0a55019adf	\N	FAILED_LOGIN	User	fce85911-decc-4551-9902-6f7832f8e19a	::ffff:127.0.0.1	\N	{"email": "admin-test-1791127356933@titanauto.com", "reason": "Invalid password"}	2026-10-04 15:22:37.432
f27d4d4a-bf3d-4c91-85f4-27dab253568a	\N	LOGIN	User	fce85911-decc-4551-9902-6f7832f8e19a	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:37.569
fc65618d-0267-4ad9-bc83-f1e60f8e9a96	\N	EMPLOYEE_APPROVED	EmployeeApprovalRequest	a2cce12c-3fcc-4b5d-a118-d85d1198dfc3	\N	\N	{"employeeId": "b3f224e4-387c-430e-bbc1-363b20833f3e", "assignedRole": "MECHANIC"}	2026-10-04 15:22:37.827
d9e46dde-2759-413e-8ca8-dbf051e7a0ef	\N	EMPLOYEE_DEACTIVATED	Employee	b3f224e4-387c-430e-bbc1-363b20833f3e	\N	\N	{"email": "new-mechanic-1791127357637@titanauto.com", "employeeCode": "EMP-JD-1791127357637"}	2026-10-04 15:22:37.863
a441def7-354f-40e1-bae3-8ac3d2eaf6ce	\N	LOGIN	User	c8352fec-b73c-4f4b-a130-75a910c29e67	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-04 15:22:36.964
10501487-7978-4238-be9f-bc2dd1b1522b	\N	CUSTOMER_CREATED	Customer	06cc032d-6c71-4188-af9a-f979d5c800ea	\N	\N	{"name": "Fleet Logistics Ltd", "phone": "+919876543210"}	2026-10-04 15:22:37.021
87c3b26f-dce0-4f2f-a1eb-6ee53fe462aa	\N	LEAD_CREATED	Lead	000f3589-d203-4373-a5f5-9fbaa5bce63c	\N	\N	{"branchId": "f7c975f3-eeb9-413f-80a4-d59b094dea21", "customerId": "06cc032d-6c71-4188-af9a-f979d5c800ea"}	2026-10-04 15:22:37.061
6dfb40fa-ddd7-4c43-898a-e184b9363202	\N	VEHICLE_CREATED	Vehicle	89fabeae-dd90-4910-8406-2c14b36b453f	\N	\N	{"vin": "VINPHASE21791127356528", "branchId": "f7c975f3-eeb9-413f-80a4-d59b094dea21"}	2026-10-04 15:22:37.193
a9202d22-50aa-4876-b209-03dc068acf35	\N	QUOTATION_CREATED	Quotation	6d1c63e3-9410-4e5d-994c-fdcae464da61	\N	\N	{"status": "SUBMITTED", "totalAmount": 5529600, "quotationNumber": "QT-1791127357223-266"}	2026-10-04 15:22:37.239
af92e242-5ea9-4d1a-b80a-bce64302591f	\N	QUOTATION_APPROVED	Quotation	6d1c63e3-9410-4e5d-994c-fdcae464da61	\N	\N	{"quotationNumber": "QT-1791127357223-266"}	2026-10-04 15:22:37.278
ee812ef4-fb9a-40d5-aa8f-54d3cd8fffdc	\N	PAYMENT_ORDER_CREATED	Payment	4c27cf82-b6f1-4bdb-a722-c12d236210e5	\N	\N	{"amount": 500000, "bookingId": "abec11f1-f6c0-4b3c-8731-5b09fedade23", "gatewayOrderId": "ORD-1791127357412-4646"}	2026-10-04 15:22:37.425
d307d3e9-44cf-4d76-ab92-c18d9afe5c7e	\N	PAYMENT_VERIFIED_SUCCESS	Payment	4c27cf82-b6f1-4bdb-a722-c12d236210e5	\N	\N	{"amount": 500000, "bookingId": "abec11f1-f6c0-4b3c-8731-5b09fedade23", "gatewayPaymentId": "PAY_RZP_1791127357426"}	2026-10-04 15:22:37.461
2674d92e-58e7-4839-ac57-496e8a2b236f	\N	FINANCE_APPLICATION_SUBMITTED	FinanceApplication	14f17bc5-05f9-4f57-919d-fff1a1414ec9	\N	\N	{"provider": "HDFC Commercial Vehicle Finance", "loanAmount": 4000000, "applicationNumber": "FIN-1791127357530-357"}	2026-10-04 15:22:37.544
347e2719-e4f5-4620-bf89-aa19d6617fa5	\N	INSURANCE_POLICY_CREATED	InsurancePolicy	c25a420e-d87f-41db-bffa-5f5b89f15b28	\N	\N	{"insurer": "ICICI Lombard General Insurance", "premium": 45000, "policyNumber": "POL-1791127357566-777"}	2026-10-04 15:22:37.58
7c94cbed-75fe-4b72-a18a-817d1a4de97b	\N	PDI_INSPECTION_PASSED	PdiInspection	43b65461-914a-4120-af91-622e6a577a7f	\N	\N	{"status": "PASSED", "vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f"}	2026-10-04 15:22:37.656
1a61db58-dd2c-4c10-8e9c-f63af7c7146b	\N	INVOICE_ISSUED	Invoice	b2e94cf5-e044-4502-8205-a49ffabeef4e	\N	\N	{"gstin": "27AAAAA0000A1Z5", "totalAmount": 5376000, "invoiceNumber": "INV-1791127357705-317"}	2026-10-04 15:22:37.718
72ff7a83-72f5-4329-9242-207d142022f7	\N	VEHICLE_DELIVERY_COMPLETED	Delivery	b704b7d3-9764-4999-bfc5-a8b015fff766	\N	\N	{"vin": "VINPHASE21791127356528", "bookingId": "abec11f1-f6c0-4b3c-8731-5b09fedade23", "customerId": "06cc032d-6c71-4188-af9a-f979d5c800ea", "deliveryNumber": "DEL-1791127357736-871"}	2026-10-04 15:22:37.754
9c3915f5-41c8-47ab-8d1b-7ca3836e08d6	\N	BOOKING_CONFIRMED	Booking	abec11f1-f6c0-4b3c-8731-5b09fedade23	\N	\N	{"vehicleId": "89fabeae-dd90-4910-8406-2c14b36b453f", "totalAmount": 5529600, "bookingNumber": "BK-1791127357308-931"}	2026-10-04 15:22:37.331
ea8c8937-3d7d-43a8-bd87-eb9e5eb01ee6	\N	VEHICLE_ALLOCATED	Vehicle	89fabeae-dd90-4910-8406-2c14b36b453f	\N	\N	{"bookingId": "abec11f1-f6c0-4b3c-8731-5b09fedade23"}	2026-10-04 15:22:37.623
46dfe462-b2f6-4270-b673-61be43a2e3d5	\N	LOGIN	User	2da68072-bdc2-4dd3-9023-f827fa11b947	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 08:20:26.939
5dc664d4-9b96-4d1b-abd3-7e15a4202083	\N	CUSTOMER_REGISTERED	Customer	d81d3576-7665-4210-ad54-f7db00c13b5c	::1	\N	{"email": "public_1792484885340@fleetuser.in", "customerId": "d81d3576-7665-4210-ad54-f7db00c13b5c", "linkedExisting": false}	2026-10-20 08:28:05.407
e2d60a27-75a7-43e4-90c4-2c9f3f6e2fe5	\N	CUSTOMER_REGISTERED	Customer	911153ec-92dd-4931-ac4a-0945f09bbe15	::1	\N	{"email": "public_1792485551508@fleetuser.in", "customerId": "911153ec-92dd-4931-ac4a-0945f09bbe15", "linkedExisting": false}	2026-10-20 08:39:11.58
2df8dcad-1e0e-4307-a2d9-45262cef4adc	\N	CUSTOMER_REGISTERED	Customer	ee62d867-cb2d-4165-ac53-17cbe8a9a1f9	::1	\N	{"email": "public_1792482660304@fleetuser.in", "customerId": "ee62d867-cb2d-4165-ac53-17cbe8a9a1f9", "linkedExisting": false}	2026-10-20 07:51:00.594
a4beb94c-bac6-4348-b583-a31196f9ac15	\N	CUSTOMER_REGISTERED	Customer	5272339d-00a0-4d1c-b472-aece1c9f5bfe	::1	\N	{"email": "public_1792482693662@fleetuser.in", "customerId": "5272339d-00a0-4d1c-b472-aece1c9f5bfe", "linkedExisting": false}	2026-10-20 07:51:33.914
109f7f66-135d-45f8-9278-7609d58a6145	\N	LOGIN	User	6f5a6ada-e4b7-43c3-b374-1707dcc69207	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 08:28:10.265
6f76a709-3a8e-44a1-b509-0baf8c20314d	\N	CUSTOMER_REGISTERED	Customer	37861c98-8a84-47bf-b58f-dc301452e1de	::1	\N	{"email": "public_1792482740520@fleetuser.in", "customerId": "37861c98-8a84-47bf-b58f-dc301452e1de", "linkedExisting": false}	2026-10-20 07:52:20.776
f837000e-3d8a-464c-82f3-690ad240e671	\N	LOGIN	User	d79e13de-9984-4cfc-a95f-03edf8022920	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 08:39:16.537
23e40f84-7095-4251-b84d-4bb86b0590d8	\N	CUSTOMER_REGISTERED	Customer	68644b64-a261-40b9-83d3-d57f30953c94	::1	\N	{"email": "customer.phase3.1792486926875@titanfleet.in", "customerId": "68644b64-a261-40b9-83d3-d57f30953c94", "linkedExisting": false}	2026-10-20 09:02:06.945
700836dd-4ca6-44b2-99f7-6af28feccbfa	\N	LOGIN	User	169e6188-8f7c-435e-bed9-1bdb81926379	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 09:02:07.014
45a264e9-ddad-48c1-a118-3d29b5a97369	\N	CUSTOMER_REGISTERED	Customer	18fc005a-0f64-4e8f-86c9-cbb48111f69b	::1	\N	{"email": "customer.phase3.1792487111041@titanfleet.in", "customerId": "18fc005a-0f64-4e8f-86c9-cbb48111f69b", "linkedExisting": false}	2026-10-20 09:05:11.111
ff073001-9bde-4869-9caf-4b89b274e02d	\N	LOGIN	User	eff13cc5-ca3c-4120-a11a-73a1456e15ad	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 09:05:11.178
4cec4a05-d0a7-437a-b0e2-933ef1be6d4b	\N	CUSTOMER_REGISTERED	Customer	a1febbcd-b9ef-48b1-8d31-8332709fcd23	::1	\N	{"email": "customer.phase3.1792487164008@titanfleet.in", "customerId": "a1febbcd-b9ef-48b1-8d31-8332709fcd23", "linkedExisting": false}	2026-10-20 09:06:04.084
f253a624-3265-43a9-88eb-7be40f3f57a8	\N	LOGIN	User	629be998-0276-4d30-be67-870f3d1ecda7	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 09:06:04.169
90424e64-90c9-4ac6-9b18-fa34b5c9f903	\N	LOGIN	User	e53275ce-2b27-4e44-889c-55d5609c3298	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 09:06:04.554
ff2daae6-d812-4ef6-8bc0-6ca27eb13f54	\N	CUSTOMER_REGISTERED	Customer	101dcf23-82ae-40a2-a26a-32dcea9a96cd	::1	\N	{"email": "public_1792487168993@fleetuser.in", "customerId": "101dcf23-82ae-40a2-a26a-32dcea9a96cd", "linkedExisting": false}	2026-10-20 09:06:09.06
4a8c291f-f5e3-492d-b936-4cd3d07da4fe	\N	LOGIN	User	81495843-ed69-4e43-ad12-0502e03029a3	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:00:57.02
795de547-90c8-485a-a7b7-ac80c5079baf	\N	LOGIN	User	e10bfe7a-8800-4175-a15d-1d0c9d6f071d	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 09:06:15.916
cad3babb-1b8c-48d6-afc6-a7d526e82b96	\N	CUSTOMER_REGISTERED	Customer	69dc7c0b-d860-4421-909a-81a2f4e95636	::1	\N	{"email": "customer.phase3.1792489152219@titanfleet.in", "customerId": "69dc7c0b-d860-4421-909a-81a2f4e95636", "linkedExisting": false}	2026-10-20 09:39:12.292
213c333b-6fb8-4dc5-82c4-e0f232a0899c	\N	LOGIN	User	15106a80-00f3-491b-b1b7-738dc6ec7afc	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 09:39:12.359
950bcbae-6278-4eb0-b2d4-826d35b01f3e	\N	CUSTOMER_REGISTERED	Customer	8ee125a3-99a1-4707-9a1b-53a6d9d3a444	::1	\N	{"email": "public_1792490461711@fleetuser.in", "customerId": "8ee125a3-99a1-4707-9a1b-53a6d9d3a444", "linkedExisting": false}	2026-10-20 10:01:01.774
bdf9e80c-0d23-496d-902f-b00f84803052	\N	LOGIN	User	a81d4cb4-f018-428b-8c6d-d9e5372b9e0e	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 09:39:12.74
a9ee0e8c-47ec-45b9-8e9b-8489fabaab9c	\N	LOGIN	User	0286b1be-386c-4062-b4ef-33b9083c20f0	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 16:22:53.926
405d7075-b7b8-43b4-94f5-621e3bf31720	\N	LOGIN	User	63c245d9-a61e-41d7-b876-c411c488cd73	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:01:13.579
59d9bcd5-c65a-4c25-ac2c-d6c1202c6fa7	\N	CUSTOMER_REGISTERED	Customer	102ae0f8-d6cc-4ae8-88ff-f51d467542bc	::1	\N	{"email": "customer.phase3.1792493031125@titanfleet.in", "customerId": "102ae0f8-d6cc-4ae8-88ff-f51d467542bc", "linkedExisting": false}	2026-10-20 10:43:51.193
f25f275b-c307-4def-82ac-9d85592e183b	\N	LOGIN	User	60d3955a-6a7f-4215-9332-a9728766331c	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:43:51.262
e6190d49-e33f-4239-bc76-7dd87207916c	\N	LOGIN	User	537d7deb-435d-45ef-a164-61fbbcc4cfcd	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:47:26.201
f16bb2d3-7bb5-4f56-9535-5d9ca333f562	\N	LOGIN	User	5d78b38d-8e26-4ed1-9386-1ec3581f8327	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:47:35.111
c5238905-80bd-4072-a224-5ae733326681	\N	CUSTOMER_REGISTERED	Customer	0bd474fd-5e7e-4cef-95b3-251d56147b16	::1	\N	{"email": "customer.phase3.1792493469596@titanfleet.in", "customerId": "0bd474fd-5e7e-4cef-95b3-251d56147b16", "linkedExisting": false}	2026-10-20 10:51:09.661
adb2ce2d-ad45-4410-bdff-61b46254baa5	\N	LOGIN	User	0309d1b1-12eb-4bca-a101-a36f211efd5a	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 10:51:09.728
cf77775f-1267-4d7c-80f5-01acd3be0dad	\N	LOGIN	User	d8b49d0f-f328-41f6-8dcf-cc1ce049881c	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 16:24:06.77
a62a2592-f6ba-45e9-aa96-af6946384121	\N	LOGIN	User	e3f5a116-38ed-415f-94ca-4d17eda72d38	::1	\N	{"roles": ["SALES_EMPLOYEE"]}	2026-10-20 10:51:10.097
82ba5b19-0c93-4e64-8413-afdc1029be25	\N	LOGIN	User	ac96efe1-ab03-4e60-a64b-321a0dbd57db	::ffff:127.0.0.1	\N	{"roles": ["SUPER_ADMIN"]}	2026-10-20 16:13:08.547
e7f5d1f3-c457-4bc0-b67c-4b4c1c236a55	\N	LOGIN	User	1fbeb8bf-ea54-46b2-89c6-7029da3d44b1	::ffff:127.0.0.1	\N	{"roles": ["BRANCH_MANAGER"]}	2026-10-20 16:13:08.939
120bb51a-9b96-458d-961d-ae26a6b1235b	\N	LOGIN	User	73d5940d-d09c-4989-b758-bc134c31e8f9	::ffff:127.0.0.1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:13:09.009
11af64d6-b23c-49dc-8599-ab343c401b45	\N	CUSTOMER_REGISTERED	Customer	9b90b4a4-de33-4a08-86b6-0b95ff056b8b	::1	\N	{"email": "public_1792513348618@fleetuser.in", "customerId": "9b90b4a4-de33-4a08-86b6-0b95ff056b8b", "linkedExisting": false}	2026-10-20 16:22:28.78
c8132c34-5527-4fa4-8563-ae7fc89b6ca8	\N	CUSTOMER_REGISTERED	Customer	ea10cca7-c1c5-47ea-9674-5471160feefa	::1	\N	{"email": "customer.phase3.1792513363064@titanfleet.in", "customerId": "ea10cca7-c1c5-47ea-9674-5471160feefa", "linkedExisting": false}	2026-10-20 16:22:43.196
053cf70c-d09c-407d-b415-e95a74665feb	\N	LOGIN	User	d8434a11-5abb-46b2-9324-681ffcb3371c	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:22:43.345
88f08261-d7a1-46b2-b8f1-ef36301261cb	\N	CUSTOMER_REGISTERED	Customer	618cf63d-5127-4bcd-80b5-e539c0686469	::1	\N	{"email": "customer.sec.1792513446760@titanfleet.in", "customerId": "618cf63d-5127-4bcd-80b5-e539c0686469", "linkedExisting": false}	2026-10-20 16:24:06.909
69d462e7-cc7d-4f71-b959-554fed132859	\N	LOGIN	User	be24ec6d-e9a4-429f-bd52-f421b18f12e8	::1	\N	{"roles": ["CUSTOMER"]}	2026-10-20 16:24:07.042
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.bookings (id, booking_number, customer_id, quotation_id, vehicle_id, branch_id, salesperson_employee_id, booking_amount, total_amount, status, booking_date, cancellation_reason, notes, created_at, updated_at) FROM stdin;
20f3a73f-4603-444d-aa37-47c9a61bd2d0	BK-2026-UDR-001	e05f34da-09e4-4839-afa5-878560a63fc7	e41ea863-ace9-4f33-b8ae-6a9ad1000497	a0115612-7379-4b7a-9b1a-356e24cc6bb4	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	500000.000000000000000000000000000000	5350000.000000000000000000000000000000	CONFIRMED	2026-10-21 08:42:30.717	\N	\N	2026-10-21 08:42:30.72	2026-10-21 08:42:30.72
bd5909b6-060c-4f3f-a225-b0702055ba2b	BK-2026-UDR-002	85019c80-c940-4c5c-a08d-8cab311d3d9a	39a932f3-ecb7-46bf-8c61-cbc7bba6f3b6	\N	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	200000.000000000000000000000000000000	4350000.000000000000000000000000000000	PENDING	2026-10-21 08:42:30.732	\N	\N	2026-10-21 08:42:30.736	2026-10-21 08:42:30.736
8f6987ae-f120-45f9-9129-b583e38ea1d1	BK-2026-JAI-001	2ae0d27b-267c-42a8-9173-c927b56f651c	444b466a-16a9-4ba6-a0b2-0e3818724aa3	625a438e-1be9-4ae7-b38e-bac012704676	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	500000.000000000000000000000000000000	3950000.000000000000000000000000000000	CONFIRMED	2026-10-21 08:42:31.13	\N	\N	2026-10-21 08:42:31.134	2026-10-21 08:42:31.134
48bdbadf-5bcf-472a-8627-2dfea33b39c5	BK-2026-JAI-002	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	d5bf98c7-6253-4c14-a34b-3a688af2eecf	\N	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	100000.000000000000000000000000000000	910000.000000000000000000000000000000	PENDING	2026-10-21 08:42:31.141	\N	\N	2026-10-21 08:42:31.144	2026-10-21 08:42:31.144
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.branches (id, franchise_id, code, name, address, city, state, status, created_at, updated_at) FROM stdin;
5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	BR-UDR-01	Tata Motors — Udaipur	Plot 22-25, NH-8, Sukher Industrial Area	Udaipur	Rajasthan	ACTIVE	2026-10-21 08:42:30.405	2026-10-21 08:42:30.405
8c187ee7-acc6-4b72-bbcb-e798fe639013	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	BR-JAI-01	Ashok Leyland — Jaipur	Transport Nagar, Agra Road	Jaipur	Rajasthan	ACTIVE	2026-10-21 08:42:30.419	2026-10-21 08:42:30.419
\.


--
-- Data for Name: campaign_expenses; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.campaign_expenses (id, campaign_id, title, category, amount, expense_date, recorded_by_id, receipt_url, notes, created_at) FROM stdin;
4b452a6f-44c2-44d8-9083-5961651b64fe	3f139352-8407-4dc3-8a14-754b1ee099bf	Conference Hall & Audio-Visual Equipment Rental	VENUE	45000.000000000000000000000000000000	2026-10-21 08:42:30.874	\N	\N	\N	2026-10-21 08:42:30.878
704ef2c5-9b20-4906-959e-c3adb611ee63	bf1cc8f8-456d-4bb7-8475-e2789cf80a6e	Roadside Canopy & Banner Printing	PROMOTION	12000.000000000000000000000000000000	2026-10-21 08:42:30.894	\N	\N	\N	2026-10-21 08:42:30.898
10297d67-753f-4c3a-a8da-a18fb1a0c715	16c2a34b-4971-49dd-87a5-70b08286b85e	Custom Pavillion Stall Fabrication & Power Supply	STALL_SETUP	60000.000000000000000000000000000000	2026-10-21 08:42:31.246	\N	\N	\N	2026-10-21 08:42:31.249
2553f014-0341-4b75-9918-58f24ea79427	deb6c52b-c964-491f-9c69-6beafe4e3aad	Refreshments & Free Driver Health Checkup Kits	LOGISTICS	15000.000000000000000000000000000000	2026-10-21 08:42:31.264	\N	\N	\N	2026-10-21 08:42:31.267
\.


--
-- Data for Name: campaign_members; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.campaign_members (id, campaign_id, employee_id, role_in_camp, created_at) FROM stdin;
27e095b8-74df-4aa0-b0ee-071f58ca546a	3f139352-8407-4dc3-8a14-754b1ee099bf	a134b2fe-00be-45b2-81c8-057eaa745a80	Lead Presenter & Product Specialist	2026-10-21 08:42:30.884
1cbf39e3-edce-450d-90f1-5bfe89c60089	16c2a34b-4971-49dd-87a5-70b08286b85e	5734ebab-66af-4412-a6b7-e50223a3bddd	Lead Commercial Vehicle Consultant	2026-10-21 08:42:31.253
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.campaigns (id, name, description, location, start_date, end_date, coordinator_id, franchise_id, branch_id, budget, status, notes, created_at, updated_at) FROM stdin;
3f139352-8407-4dc3-8a14-754b1ee099bf	Mewar Mining Fleet Conclave 2026	Customer meet and product showcase for mining transporters	Hotel Radisson Blu, Udaipur	2026-10-21 08:42:30.865	2026-10-24 08:42:30.865	a134b2fe-00be-45b2-81c8-057eaa745a80	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	150000.000000000000000000000000000000	ACTIVE	\N	2026-10-21 08:42:30.869	2026-10-21 08:42:30.869
bf1cc8f8-456d-4bb7-8475-e2789cf80a6e	Sukher Highway Truckers Safety & Mileage Clinic	Highway clinic and free inspection camp	NH-8 Highway Toll Plaza, Sukher	2026-10-28 08:42:30.887	2026-10-31 08:42:30.887	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	80000.000000000000000000000000000000	UPCOMING	\N	2026-10-21 08:42:30.891	2026-10-21 08:42:30.891
16c2a34b-4971-49dd-87a5-70b08286b85e	Pink City Commercial Fleet Expo 2026	Expo and live commercial vehicle showcase	JECC Exhibition Ground, Sitapura, Jaipur	2026-10-21 08:42:31.239	2026-10-25 08:42:31.239	5734ebab-66af-4412-a6b7-e50223a3bddd	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	200000.000000000000000000000000000000	ACTIVE	\N	2026-10-21 08:42:31.243	2026-10-21 08:42:31.243
deb6c52b-c964-491f-9c69-6beafe4e3aad	Agra Highway Transport Operators Mileage Clinic	Highway clinic for operators	Dausa Toll Plaza Rest Area, NH-21	2026-10-29 08:42:31.256	2026-11-01 08:42:31.256	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	90000.000000000000000000000000000000	UPCOMING	\N	2026-10-21 08:42:31.259	2026-10-21 08:42:31.259
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.chat_messages (id, conversation_id, sender_user_id, sender_type, message, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.conversations (id, customer_id, branch_id, assigned_employee_id, subject, context_type, context_id, status, last_message_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_franchises; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.customer_franchises (customer_id, franchise_id, created_at) FROM stdin;
e05f34da-09e4-4839-afa5-878560a63fc7	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	2026-10-21 08:42:30.62
85019c80-c940-4c5c-a08d-8cab311d3d9a	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	2026-10-21 08:42:30.637
2ae0d27b-267c-42a8-9173-c927b56f651c	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	2026-10-21 08:42:31.045
bed9e3e5-ef4f-4962-8370-c3e3d043aee0	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	2026-10-21 08:42:31.063
\.


--
-- Data for Name: customer_reminders; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.customer_reminders (id, customer_id, vehicle_id, branch_id, category, recipient_name, recipient_phone, reference_type, reference_id, due_date, message_template, draft_message, channel, status, initiated_at, sent_at, external_message_id, prepared_by_user_id, notes, created_at, updated_at) FROM stdin;
5f98aa7b-364c-4204-acfd-384fd0fcbf16	e05f34da-09e4-4839-afa5-878560a63fc7	823e42fa-604d-433c-b5c2-f26cf382f3dd	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	SERVICE_DUE	Pradeep Gehlot	+919829111001	NONE	\N	2026-10-26 08:42:30.924	\N	Dear Pradeep Gehlot, your Tata Signa 4825.TK tipper is due for periodic 40,000 km service. Contact Tata Motors Udaipur at +91 294 2441100 to reserve your workshop bay.	WHATSAPP	PREPARED	\N	\N	\N	\N	\N	2026-10-21 08:42:30.928	2026-10-21 08:42:30.928
3cbb1090-d0b8-4c5a-9866-46e6d30ba664	85019c80-c940-4c5c-a08d-8cab311d3d9a	a0115612-7379-4b7a-9b1a-356e24cc6bb4	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	COMPLIANCE_EXPIRY	Suresh Sisodia	+919829111002	NONE	\N	2026-11-10 08:42:30.933	\N	Dear Suresh Sisodia, commercial vehicle fitness certificate for your Tata Prima trailer expires in 20 days. Visit Tata Motors Udaipur RTO desk for renewal assistance.	WHATSAPP	USER_INITIATED	2026-10-21 08:42:30.933	\N	\N	\N	\N	2026-10-21 08:42:30.937	2026-10-21 08:42:30.937
ba5cf97d-3495-43da-9183-ee54d5ddca9b	2ae0d27b-267c-42a8-9173-c927b56f651c	0b613ac3-2ca1-4d1a-87ea-c695194c78c9	8c187ee7-acc6-4b72-bbcb-e798fe639013	SERVICE_DUE	Harish Choudhary	+919829222001	NONE	\N	2026-10-28 08:42:31.291	\N	Dear Harish Choudhary, your Ashok Leyland AVTR 5525.T truck is due for scheduled 40,000 km air brake servicing. Contact Ashok Leyland Jaipur at +91 141 2618800.	WHATSAPP	PREPARED	\N	\N	\N	\N	\N	2026-10-21 08:42:31.295	2026-10-21 08:42:31.295
cc252306-4d2e-4e50-804a-468a88475860	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	625a438e-1be9-4ae7-b38e-bac012704676	8c187ee7-acc6-4b72-bbcb-e798fe639013	COMPLIANCE_EXPIRY	Mukesh Sharma	+919829222002	NONE	\N	2026-11-05 08:42:31.299	\N	Dear Mukesh Sharma, fitness certificate for your Bada Dost delivery vehicle expires in 15 days. Visit Ashok Leyland Jaipur service desk for renewal inspection.	WHATSAPP	USER_INITIATED	2026-10-21 08:42:31.299	\N	\N	\N	\N	2026-10-21 08:42:31.302	2026-10-21 08:42:31.302
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.customers (id, user_id, name, phone, email, address, city, state, pincode, gstin, customer_type, company_name, status, created_at, updated_at, preferred_branch_id, pan) FROM stdin;
e05f34da-09e4-4839-afa5-878560a63fc7	802f019b-15ac-473f-8de3-fad4d876300c	Mewar Mining & Infra Logistics	+919829111001	mewar.mining@fleet.in	\N	\N	\N	\N	08AAACM1234N1Z2	BUSINESS	Mewar Mining Pvt Ltd	ACTIVE	2026-10-21 08:42:30.613	2026-10-21 08:42:30.613	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	AAACM1234N
85019c80-c940-4c5c-a08d-8cab311d3d9a	b74dcf38-0860-483a-a740-807cb4b75cf1	Udaipur Marble Carriers	+919829111002	udaipur.marble@fleet.in	\N	\N	\N	\N	08AAACU5678Q1Z4	BUSINESS	Udaipur Marble Carriers Ltd	ACTIVE	2026-10-21 08:42:30.631	2026-10-21 08:42:30.631	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	AAACU5678Q
2ae0d27b-267c-42a8-9173-c927b56f651c	253b4803-b5b9-4a65-a87d-b7d50d589aa8	Jaipur Express Cargo Carriers	+919829222001	jaipur.cargo@fleet.in	\N	\N	\N	\N	08AAACJ9012K1Z8	BUSINESS	Jaipur Express Cargo Pvt Ltd	ACTIVE	2026-10-21 08:42:31.039	2026-10-21 08:42:31.039	8c187ee7-acc6-4b72-bbcb-e798fe639013	AAACJ9012K
bed9e3e5-ef4f-4962-8370-c3e3d043aee0	54f79965-1c18-40d5-9602-aadcaa968364	Pink City Transport & Logistics	+919829222002	pinkcity.transport@fleet.in	\N	\N	\N	\N	08AAACP3456L1Z9	BUSINESS	Pink City Transport LLP	ACTIVE	2026-10-21 08:42:31.056	2026-10-21 08:42:31.056	8c187ee7-acc6-4b72-bbcb-e798fe639013	AAACP3456L
\.


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.deliveries (id, delivery_number, customer_id, vehicle_id, booking_id, invoice_id, delivery_date, delivery_location, delivery_employee_id, odometer_reading, customer_acknowledgement, documents_key, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_approval_requests; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.employee_approval_requests (id, employee_id, requested_by_user_id, assigned_role_id, status, approved_by_user_id, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_role_assignments; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.employee_role_assignments (id, employee_id, role_id, assigned_at, assigned_by) FROM stdin;
1951b9a8-8fd8-4192-b793-125e18baf896	cf20df8d-13e2-4534-9df3-50f014009986	0ed10bf7-7eba-4827-af16-7bc1429e9976	2026-10-21 08:42:30.521	\N
fcfb8449-67b4-434a-ac76-31009e03ad70	cf20df8d-13e2-4534-9df3-50f014009986	0d31a84e-e610-4ecc-b25f-8534ac5a45a6	2026-10-21 08:42:30.531	\N
8d3cc4ed-b2e8-41c0-99fa-8e58afe4a374	9473b907-4208-4ee9-8892-265a9b46c1e5	c4976cef-26e0-4306-8d60-48d164285741	2026-10-21 08:42:30.55	\N
87bf0155-1897-449d-b48e-1caf57666770	a134b2fe-00be-45b2-81c8-057eaa745a80	4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	2026-10-21 08:42:30.567	\N
1ce3aabb-a626-4d6b-9b55-4dd97aced2e4	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	4f7a0046-7d54-4565-9591-a16862d842dd	2026-10-21 08:42:30.582	\N
a87486a0-79fa-4658-8b10-cf7a8c4309dc	48ff411f-47ca-44a7-8ede-c2ae3524ff2a	a1225fb6-9c63-47fe-a15b-00831813d5ec	2026-10-21 08:42:30.602	\N
9b0faba9-f01c-4955-bf49-cccfb2e4aa69	514ac012-fc27-401f-9e18-d8549414c6af	0ed10bf7-7eba-4827-af16-7bc1429e9976	2026-10-21 08:42:30.958	\N
f8b12a44-ae44-4e27-80f2-f8633be4c77f	514ac012-fc27-401f-9e18-d8549414c6af	0d31a84e-e610-4ecc-b25f-8534ac5a45a6	2026-10-21 08:42:30.963	\N
3322ebc2-b9c7-4507-9edd-1f721b4fe429	8c869683-cd7f-4063-a185-fbcfc1d4e478	c4976cef-26e0-4306-8d60-48d164285741	2026-10-21 08:42:30.977	\N
7bf7ea3c-1fc8-4d44-9c69-2ab76362dd0b	5734ebab-66af-4412-a6b7-e50223a3bddd	4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	2026-10-21 08:42:30.995	\N
e7181d57-b731-4c79-94b7-b37bbc53ac2b	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	4f7a0046-7d54-4565-9591-a16862d842dd	2026-10-21 08:42:31.011	\N
f8b1d410-c5f2-4dfd-8eac-9a0e929e282a	ae791781-91be-4538-ac0f-b228b296e078	a1225fb6-9c63-47fe-a15b-00831813d5ec	2026-10-21 08:42:31.03	\N
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.employees (id, user_id, branch_id, employee_code, first_name, last_name, designation, status, hired_at, created_at, updated_at) FROM stdin;
cf20df8d-13e2-4534-9df3-50f014009986	7d9be1aa-fe35-46fd-831b-310275cd102b	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	EMP-5C8-0512-247	Karan	Singh	Franchise Director	ACTIVE	\N	2026-10-21 08:42:30.515	2026-10-21 08:42:30.515
9473b907-4208-4ee9-8892-265a9b46c1e5	d907a25a-84a5-4f3c-ae89-a487f1be6970	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	EMP-5C8-0540-835	Bhanwar	Rathore	General Branch Manager	ACTIVE	\N	2026-10-21 08:42:30.544	2026-10-21 08:42:30.544
a134b2fe-00be-45b2-81c8-057eaa745a80	e56b8cbe-7db9-4f0b-9272-7495d58969a1	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	EMP-5C8-0558-818	Vikram	Mehta	Senior Fleet Sales Executive	ACTIVE	\N	2026-10-21 08:42:30.561	2026-10-21 08:42:30.561
7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	7816f86d-eba4-41b8-83b5-bddf62203c49	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	EMP-5C8-0573-319	Mahesh	Sharma	Commercial Workshop Advisor	ACTIVE	\N	2026-10-21 08:42:30.577	2026-10-21 08:42:30.577
48ff411f-47ca-44a7-8ede-c2ae3524ff2a	716b9dec-b4f6-4619-92e5-e38ec647c037	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	EMP-5C8-0593-907	Rajesh	Kumawat	Certified Master Technician	ACTIVE	\N	2026-10-21 08:42:30.596	2026-10-21 08:42:30.596
514ac012-fc27-401f-9e18-d8549414c6af	bbb82c33-45f1-4205-afa0-18b9b242462c	8c187ee7-acc6-4b72-bbcb-e798fe639013	EMP-8C1-0948-890	Anand	Agrawal	Franchise Partner	ACTIVE	\N	2026-10-21 08:42:30.952	2026-10-21 08:42:30.952
8c869683-cd7f-4063-a185-fbcfc1d4e478	03b89618-31ed-4668-93bd-a746e950e10d	8c187ee7-acc6-4b72-bbcb-e798fe639013	EMP-8C1-0968-789	Devendra	Shekhawat	Senior Branch Manager	ACTIVE	\N	2026-10-21 08:42:30.972	2026-10-21 08:42:30.972
5734ebab-66af-4412-a6b7-e50223a3bddd	3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	8c187ee7-acc6-4b72-bbcb-e798fe639013	EMP-8C1-0985-123	Aman	Khandelwal	Senior Fleet Sales Executive	ACTIVE	\N	2026-10-21 08:42:30.989	2026-10-21 08:42:30.989
04a1029e-24d0-4d70-ad9a-3fc04a59c9df	2140334d-01d2-4ec5-ade8-c3d76d247205	8c187ee7-acc6-4b72-bbcb-e798fe639013	EMP-8C1-1004-535	Dinesh	Verma	Commercial Service Advisor	ACTIVE	\N	2026-10-21 08:42:31.007	2026-10-21 08:42:31.007
ae791781-91be-4538-ac0f-b228b296e078	c5ddca41-cac3-4121-9f66-a4675c493d7d	8c187ee7-acc6-4b72-bbcb-e798fe639013	EMP-8C1-1020-884	Ramesh	Saini	Lead Heavy Truck Mechanic	ACTIVE	\N	2026-10-21 08:42:31.024	2026-10-21 08:42:31.024
\.


--
-- Data for Name: file_attachments; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.file_attachments (id, file_id, entity_type, entity_id, storage_key, filename, mime_type, size, uploaded_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: finance_applications; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.finance_applications (id, application_number, customer_id, booking_id, finance_provider, loan_amount, down_payment, tenure_months, interest_rate, status, remarks, created_at, updated_at, disbursed_at, emi_amount, first_emi_date, loan_reference) FROM stdin;
\.


--
-- Data for Name: finance_emi_schedules; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.finance_emi_schedules (id, finance_application_id, installment_number, due_date, emi_amount, principal_component, interest_component, paid_amount, status, paid_at, payment_reference, payment_mode, receipt_url, recorded_by_employee_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.follow_ups (id, lead_id, employee_id, scheduled_at, completed_at, notes, status, created_at, updated_at) FROM stdin;
988ad6e6-2003-4e8f-af4d-86c28c5b37cd	9de36f63-7ac2-4d06-8e8d-fa035b22d05c	a134b2fe-00be-45b2-81c8-057eaa745a80	2026-10-23 08:42:30.669	\N	Deliver pro-forma quotation and finance interest rate comparison.	PENDING	2026-10-21 08:42:30.676	2026-10-21 08:42:30.676
2ba8224f-7af6-4601-8848-f23dd117dac8	caea06d6-18a0-4ac1-8f37-eadad2a2f291	a134b2fe-00be-45b2-81c8-057eaa745a80	2026-10-25 08:42:30.692	\N	Schedule demo vehicle inspection at Sukher dealership yard.	PENDING	2026-10-21 08:42:30.696	2026-10-21 08:42:30.696
2a720343-083e-4bd7-bbc8-846497d62378	5048ef08-fcd7-4207-acba-3851255a7150	5734ebab-66af-4412-a6b7-e50223a3bddd	2026-10-22 08:42:31.089	\N	Finalize quotation approval with bulk discount and AMC bundle.	PENDING	2026-10-21 08:42:31.093	2026-10-21 08:42:31.093
1ca5f6b7-ad51-4dba-a048-c5103fffebfc	c1ff4ee4-feed-42f0-8f44-76563aa87054	5734ebab-66af-4412-a6b7-e50223a3bddd	2026-10-24 08:42:31.112	\N	Present commercial vehicle loan options and EMI plans.	PENDING	2026-10-21 08:42:31.116	2026-10-21 08:42:31.116
\.


--
-- Data for Name: franchises; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.franchises (id, code, name, legal_name, tax_id, status, created_at, updated_at) FROM stdin;
ec625d6e-2c4f-404d-a4c3-79b0507ce40e	FR-TATA-01	Tata Motors	Tata Motors Commercial Vehicles Dealership Ltd	08AABCT2345M1Z1	ACTIVE	2026-10-21 08:42:30.395	2026-10-21 08:42:30.395
7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	FR-AL-01	Ashok Leyland Commercial Vehicles	Ashok Leyland Dealership Network Ltd	08AABCA1234F1Z5	ACTIVE	2026-10-21 08:42:30.413	2026-10-21 08:42:30.413
\.


--
-- Data for Name: insurance_policies; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.insurance_policies (id, policy_number, customer_id, booking_id, insurer, policy_type, premium, start_date, expiry_date, status, document_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, taxable_amount, gst_rate, gst_amount, total_amount) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.invoices (id, invoice_number, customer_id, vehicle_id, booking_id, franchise_id, branch_id, billing_address, gstin, subtotal, discount, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, payment_status, status, issued_at, created_at, updated_at) FROM stdin;
c7249ceb-9a2c-43f8-ae26-d7eeafbca660	INV-2026-UDR-001	e05f34da-09e4-4839-afa5-878560a63fc7	a0115612-7379-4b7a-9b1a-356e24cc6bb4	20f3a73f-4603-444d-aa37-47c9a61bd2d0	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	Sukher Industrial Area, Udaipur, Rajasthan	08AAACM1234N1Z2	390625.000000000000000000000000000000	0.000000000000000000000000000000	390625.000000000000000000000000000000	54687.500000000000000000000000000000	54687.500000000000000000000000000000	0.000000000000000000000000000000	500000.000000000000000000000000000000	PAID	ISSUED	2026-10-21 08:42:30.74	2026-10-21 08:42:30.745	2026-10-21 08:42:30.745
59a70a6e-7c9e-48b2-a888-50e0aa20f441	INV-2026-UDR-002	85019c80-c940-4c5c-a08d-8cab311d3d9a	\N	bd5909b6-060c-4f3f-a225-b0702055ba2b	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	Udaipur Marble Market, Amberi, Udaipur	08AAACU5678Q1Z4	781250.000000000000000000000000000000	0.000000000000000000000000000000	781250.000000000000000000000000000000	109375.000000000000000000000000000000	109375.000000000000000000000000000000	0.000000000000000000000000000000	1000000.000000000000000000000000000000	PARTIALLY_PAID	ISSUED	2026-10-21 08:42:30.757	2026-10-21 08:42:30.761	2026-10-21 08:42:30.761
df5c8d78-0731-4a42-a975-8e894e9b16d0	INV-2026-JAI-001	2ae0d27b-267c-42a8-9173-c927b56f651c	625a438e-1be9-4ae7-b38e-bac012704676	8f6987ae-f120-45f9-9129-b583e38ea1d1	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	Agra Road Transport Nagar, Jaipur, Rajasthan	08AAACJ9012K1Z8	390625.000000000000000000000000000000	0.000000000000000000000000000000	390625.000000000000000000000000000000	54687.500000000000000000000000000000	54687.500000000000000000000000000000	0.000000000000000000000000000000	500000.000000000000000000000000000000	PAID	ISSUED	2026-10-21 08:42:31.147	2026-10-21 08:42:31.15	2026-10-21 08:42:31.15
d3edce50-9518-4835-ba3c-84c31ddaa323	INV-2026-JAI-002	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	\N	48bdbadf-5bcf-472a-8627-2dfea33b39c5	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	VKI Area Road No 9, Jaipur, Rajasthan	08AAACP3456L1Z9	625000.000000000000000000000000000000	0.000000000000000000000000000000	625000.000000000000000000000000000000	87500.000000000000000000000000000000	87500.000000000000000000000000000000	0.000000000000000000000000000000	800000.000000000000000000000000000000	PARTIALLY_PAID	ISSUED	2026-10-21 08:42:31.158	2026-10-21 08:42:31.162	2026-10-21 08:42:31.162
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.lead_activities (id, lead_id, employee_id, activity_type, title, description, scheduled_at, completed_at, metadata, created_at) FROM stdin;
5020ecb0-9513-4200-a8da-416bdb0bd646	9de36f63-7ac2-4d06-8e8d-fa035b22d05c	a134b2fe-00be-45b2-81c8-057eaa745a80	CALL	Fleet Expansion Requirement Discussion	Client requires 2 heavy tippers for new limestone mining concession near Rajsamand.	\N	\N	\N	2026-10-21 08:42:30.666
ac98864e-ab0a-40d1-a608-a2ac68bee700	caea06d6-18a0-4ac1-8f37-eadad2a2f291	a134b2fe-00be-45b2-81c8-057eaa745a80	MEETING	Yard Inspection and Trailer Capacity Verification	Inspected existing 10-wheeler fleet. Recommended 5530.S 4x2 prime mover for marble block transit.	\N	\N	\N	2026-10-21 08:42:30.69
e5d7843f-9c4d-41d8-a85a-bfbc1e848080	5048ef08-fcd7-4207-acba-3851255a7150	5734ebab-66af-4412-a6b7-e50223a3bddd	CALL	Highway Route Feasibility and Payload Assessment	Customer plans to deploy 2 units of AVTR 5525.T on Delhi-Jaipur-Ahmedabad Golden Quadrilateral corridor.	\N	\N	\N	2026-10-21 08:42:31.087
2038f266-5433-49d8-8827-28f552459a0f	c1ff4ee4-feed-42f0-8f44-76563aa87054	5734ebab-66af-4412-a6b7-e50223a3bddd	TEST_DRIVE	City Intra-Hub Test Drive with Full Load	Completed 25 km test run across VKI Area and Transport Nagar with 1.8 ton sand bags. Customer satisfied with power.	\N	\N	\N	2026-10-21 08:42:31.108
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.leads (id, customer_id, franchise_id, branch_id, assigned_employee_id, source, interested_model, expected_purchase_date, expected_budget, status, priority, notes, created_at, updated_at, lost_reason, campaign_id, lead_number, prospect_name, prospect_phone, prospect_email, company_name) FROM stdin;
9de36f63-7ac2-4d06-8e8d-fa035b22d05c	e05f34da-09e4-4839-afa5-878560a63fc7	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	DIRECT_WALKIN	Tata Signa 4825.TK	\N	10700000.000000000000000000000000000000	QUALIFIED	HIGH	\N	2026-10-21 08:42:30.657	2026-10-21 08:42:30.657	\N	\N	LD-UDR-2026-001	Pradeep Gehlot	\N	\N	Mewar Mining & Infra Logistics
caea06d6-18a0-4ac1-8f37-eadad2a2f291	85019c80-c940-4c5c-a08d-8cab311d3d9a	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	DIRECT_WALKIN	Tata Prima 5530.S	\N	4350000.000000000000000000000000000000	CONTACTED	MEDIUM	\N	2026-10-21 08:42:30.683	2026-10-21 08:42:30.683	\N	\N	LD-UDR-2026-002	Suresh Sisodia	\N	\N	Udaipur Marble Carriers
5048ef08-fcd7-4207-acba-3851255a7150	2ae0d27b-267c-42a8-9173-c927b56f651c	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	DIRECT_WALKIN	AVTR 5525.T	\N	7900000.000000000000000000000000000000	QUALIFIED	HIGH	\N	2026-10-21 08:42:31.08	2026-10-21 08:42:31.08	\N	\N	LD-JAI-2026-001	Harish Choudhary	\N	\N	Jaipur Express Cargo Carriers
c1ff4ee4-feed-42f0-8f44-76563aa87054	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	DIRECT_WALKIN	Bada Dost	\N	1820000.000000000000000000000000000000	CONTACTED	MEDIUM	\N	2026-10-21 08:42:31.099	2026-10-21 08:42:31.099	\N	\N	LD-JAI-2026-002	Mukesh Sharma	\N	\N	Pink City Transport & Logistics
\.


--
-- Data for Name: manufacturers; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.manufacturers (id, name, country, status, created_at, updated_at) FROM stdin;
9ff39ecc-35a2-4947-be34-164f0c446ab3	Ashok Leyland	India	ACTIVE	2026-10-04 15:05:39.882	2026-10-04 15:05:39.882
101aa601-f4ab-42f5-9e43-d5b3dffbe961	Tata Motors P2 1791127133351	India	ACTIVE	2026-10-04 15:18:53.38	2026-10-04 15:18:53.38
33fe9912-f178-4cbe-a7bc-9914115a1581	Volvo Eicher P3 1791127234129	\N	ACTIVE	2026-10-04 15:20:34.131	2026-10-04 15:20:34.131
6d0ff1e2-083e-4727-8465-0cb7f2983dee	Volvo Eicher P3 1791127357013	\N	ACTIVE	2026-10-04 15:22:37.014	2026-10-04 15:22:37.014
9e19dda1-b53c-4c0b-b545-047e93bf19c0	Tata Motors P2 1791127357064	India	ACTIVE	2026-10-04 15:22:37.088	2026-10-04 15:22:37.088
95b96215-2a46-4665-a13e-a77373ea01ab	Tata Motors	India	ACTIVE	2026-10-21 08:42:30.431	2026-10-21 08:42:30.431
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.notifications (id, user_id, customer_id, channel, title, body, metadata, status, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: part_stock_movements; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.part_stock_movements (id, part_stock_id, movement_type, quantity, reference_ref, notes, actor_user_id, created_at) FROM stdin;
04195f2e-0610-4c15-a69f-b11e2a29d3a5	51632fcc-097a-4d51-b841-ae31f31bb1e6	PURCHASE	24	PO-UDR-2026-081	Initial OEM batch receipt from Pune Plant.	\N	2026-10-21 08:42:30.84
a284db69-e2da-4e88-98eb-9d8a2b9246d9	51c6adb6-a410-4bfd-b6cb-6012740744c3	PURCHASE	18	PO-JAI-2026-042	Direct consignment receipt from Ennore Plant.	\N	2026-10-21 08:42:31.219
\.


--
-- Data for Name: part_stocks; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.part_stocks (id, part_id, branch_id, quantity_on_hand, quantity_reserved, reorder_threshold, created_at, updated_at) FROM stdin;
51632fcc-097a-4d51-b841-ae31f31bb1e6	d4378943-95c9-45ac-a84d-4508f0856e5a	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	24	0	6	2026-10-21 08:42:30.833	2026-10-21 08:42:30.833
54ec9243-5aec-4738-a742-ded17fa2b32c	17b0f173-74a3-4ce8-9e38-58e976866ff0	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	40	0	10	2026-10-21 08:42:30.847	2026-10-21 08:42:30.847
51c6adb6-a410-4bfd-b6cb-6012740744c3	d4378943-95c9-45ac-a84d-4508f0856e5a	8c187ee7-acc6-4b72-bbcb-e798fe639013	18	0	5	2026-10-21 08:42:31.213	2026-10-21 08:42:31.213
e026728f-2049-4a43-97b3-25eb2e2748a1	17b0f173-74a3-4ce8-9e38-58e976866ff0	8c187ee7-acc6-4b72-bbcb-e798fe639013	35	0	8	2026-10-21 08:42:31.224	2026-10-21 08:42:31.224
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.parts (id, part_number, name, description, manufacturer, category, unit_price, gst_rate, status, created_at, updated_at) FROM stdin;
784d912d-ee5d-43d4-a12a-05c451c931c8	AL-FLT-AIR-01	High Performance Primary Air Filter	\N	Ashok Leyland Genuine	Filtration	3200.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-04 15:05:40.422	2026-10-04 15:05:40.422
8176f487-0ef6-48f0-8764-00f589899c24	AL-CLT-PLT-02	Clutch Pressure Plate & Disc Assembly	\N	Ashok Leyland Genuine	Transmission	14500.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-04 15:05:40.439	2026-10-04 15:05:40.439
9a21f351-9e1f-4acd-95e3-07b825f11db6	AL-BRK-LIN-03	Rear Axle Heavy Duty Brake Lining Set	\N	Ashok Leyland Genuine	Braking	5800.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-04 15:05:40.448	2026-10-04 15:05:40.448
c95a5b21-d075-446c-9a1a-41ebcdab2bf9	PRT-P3-1791127234148	Clutch Pressure Plate Heavy Duty	\N	\N	\N	12500.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-04 15:20:34.151	2026-10-04 15:20:34.151
34e258cc-b689-4023-a608-eeb58d79ee37	PRT-P3-1791127357030	Clutch Pressure Plate Heavy Duty	\N	\N	\N	12500.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-04 15:22:37.032	2026-10-04 15:22:37.032
d4378943-95c9-45ac-a84d-4508f0856e5a	PART-BRK-HD-01	Heavy Duty S-Cam Brake Lining Kit	\N	\N	BRAKES	3850.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-21 08:42:30.492	2026-10-21 08:42:30.492
17b0f173-74a3-4ce8-9e38-58e976866ff0	PART-FLT-PR-02	Primary High-Flow Fuel Filter Element	\N	\N	FILTERS	1250.000000000000000000000000000000	18.000000000000000000000000000000	ACTIVE	2026-10-21 08:42:30.5	2026-10-21 08:42:30.5
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.payments (id, booking_id, invoice_id, gateway, gateway_order_id, gateway_payment_id, idempotency_key, amount, currency, status, payment_method, metadata, paid_at, created_at, updated_at) FROM stdin;
4829e138-5d65-4357-8b32-96d9621c853c	20f3a73f-4603-444d-aa37-47c9a61bd2d0	c7249ceb-9a2c-43f8-ae26-d7eeafbca660	BANK_TRANSFER	\N	NEFT-UDR-2026-001	\N	500000.000000000000000000000000000000	INR	SUCCESS	RTGS	\N	2026-10-21 08:42:30.75	2026-10-21 08:42:30.754	2026-10-21 08:42:30.754
bd19399a-465f-40a9-a426-25a3206902e8	bd5909b6-060c-4f3f-a225-b0702055ba2b	59a70a6e-7c9e-48b2-a888-50e0aa20f441	CHEQUE	\N	CHQ-UDR-481920	\N	300000.000000000000000000000000000000	INR	SUCCESS	CHEQUE_CLEARING	\N	2026-10-21 08:42:30.765	2026-10-21 08:42:30.768	2026-10-21 08:42:30.768
b99612a2-38e9-4569-9e76-5f7fe3816614	8f6987ae-f120-45f9-9129-b583e38ea1d1	df5c8d78-0731-4a42-a975-8e894e9b16d0	BANK_TRANSFER	\N	RTGS-JAI-2026-8801	\N	500000.000000000000000000000000000000	INR	SUCCESS	RTGS	\N	2026-10-21 08:42:31.153	2026-10-21 08:42:31.156	2026-10-21 08:42:31.156
aec52e17-b701-42c3-a073-eb1b7139d95e	48bdbadf-5bcf-472a-8627-2dfea33b39c5	d3edce50-9518-4835-ba3c-84c31ddaa323	CHEQUE	\N	CHQ-JAI-192837	\N	250000.000000000000000000000000000000	INR	SUCCESS	CHEQUE_CLEARING	\N	2026-10-21 08:42:31.164	2026-10-21 08:42:31.168	2026-10-21 08:42:31.168
\.


--
-- Data for Name: pdi_inspections; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.pdi_inspections (id, vehicle_id, booking_id, inspector_user_id, inspection_date, status, checklist, failed_items, remarks, images, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.permissions (id, name, description, module, created_at, updated_at) FROM stdin;
cad53e3c-d568-493b-b6f5-c8ff38c97592	franchise.create	Create new franchises	franchise	2026-10-04 15:05:39.454	2026-10-04 15:05:39.454
b12c2310-0b62-4b4b-94fa-1d6309b2a98a	franchise.read	View franchise details	franchise	2026-10-04 15:05:39.463	2026-10-04 15:05:39.463
80293f92-7683-4350-ade5-3664bdd3955a	franchise.update	Update franchise configuration	franchise	2026-10-04 15:05:39.467	2026-10-04 15:05:39.467
3814bab0-1d7c-403c-8b16-1f56f2478a90	branch.create	Create new branch hubs	branch	2026-10-04 15:05:39.471	2026-10-04 15:05:39.471
4760522a-101e-4a89-a991-c7ba92ed2b21	branch.read	View branch details	branch	2026-10-04 15:05:39.474	2026-10-04 15:05:39.474
28717030-805e-40a9-b400-c90ac5a7284c	branch.update	Update branch configuration	branch	2026-10-04 15:05:39.478	2026-10-04 15:05:39.478
5ec0a884-849d-4caf-ada3-bd69cab3c138	employee.create	Create employee accounts	employee	2026-10-04 15:05:39.481	2026-10-04 15:05:39.481
ffbb07d3-cef5-4ea2-9eb9-a4576a6627f1	employee.read	View employee profiles	employee	2026-10-04 15:05:39.483	2026-10-04 15:05:39.483
11a8325f-48ec-4ab9-8987-d2a29305b2cf	employee.update	Update employee records	employee	2026-10-04 15:05:39.487	2026-10-04 15:05:39.487
8a6a6e03-08f3-4818-b417-b6e2a15801eb	employee.approve	Approve onboarding requests	employee	2026-10-04 15:05:39.489	2026-10-04 15:05:39.489
2d993c40-acda-4afe-8ea3-841330cce76a	employee.deactivate	Deactivate employee accounts	employee	2026-10-04 15:05:39.493	2026-10-04 15:05:39.493
2fe53f04-5c83-42eb-9474-70b39f32184f	customer.create	Create customer profiles	customer	2026-10-04 15:05:39.495	2026-10-04 15:05:39.495
4ff199cb-d536-4339-bc49-be4d00adf2a6	customer.read	View customer records	customer	2026-10-04 15:05:39.498	2026-10-04 15:05:39.498
f608383a-8f9a-4fc3-a0e5-cbbfcef93133	customer.update	Update customer records	customer	2026-10-04 15:05:39.5	2026-10-04 15:05:39.5
349ace31-f3bb-46f1-96ef-da267ed878bf	inventory.create	Add inventory vehicles	inventory	2026-10-04 15:05:39.503	2026-10-04 15:05:39.503
875e2976-29a6-4b46-bd0e-f3473f32b85a	inventory.read	View vehicle inventory	inventory	2026-10-04 15:05:39.505	2026-10-04 15:05:39.505
9ed84c88-bcff-4ec3-b314-9162be6a0b9d	inventory.update	Update vehicle inventory	inventory	2026-10-04 15:05:39.508	2026-10-04 15:05:39.508
95c02a3b-4a9c-4b2c-b3a2-9d4be34b42a8	sales.create	Create quotations & bookings	sales	2026-10-04 15:05:39.51	2026-10-04 15:05:39.51
f98c9d47-c70a-4108-9791-2af608ae55df	sales.read	View sales data	sales	2026-10-04 15:05:39.513	2026-10-04 15:05:39.513
16792ff7-fb02-4805-ad21-e14d27c10ddf	sales.update	Update sales records	sales	2026-10-04 15:05:39.515	2026-10-04 15:05:39.515
bff54219-e77a-42a2-8070-bb22247f6eaf	service.create	Create service appointments and jobs	service	2026-10-04 15:05:39.517	2026-10-04 15:05:39.517
0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2	service.read	View service jobs	service	2026-10-04 15:05:39.521	2026-10-04 15:05:39.521
0aefb510-69a1-4013-b950-667053052e24	service.update	Update service jobs	service	2026-10-04 15:05:39.524	2026-10-04 15:05:39.524
2f1d5a4d-522e-4f47-915b-1fd574118936	reports.read	View analytics reports	reports	2026-10-04 15:05:39.527	2026-10-04 15:05:39.527
87ae5ac7-4790-413f-8d4f-fdfa11f27608	audit.read	View system audit trail	audit	2026-10-04 15:05:39.529	2026-10-04 15:05:39.529
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.quotation_items (id, quotation_id, item_type, description, unit_price, quantity, total_price) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.quotations (id, quotation_number, customer_id, lead_id, franchise_id, branch_id, salesperson_employee_id, created_by_user_id, variant_id, quantity, unit_base_price, accessories_amount, insurance_amount, registration_amount, finance_charges, discount_amount, subtotal, gst_rate, gst_amount, total_amount, validity_date, status, notes, created_at, updated_at) FROM stdin;
e41ea863-ace9-4f33-b8ae-6a9ad1000497	QT-2026-UDR-001	e05f34da-09e4-4839-afa5-878560a63fc7	9de36f63-7ac2-4d06-8e8d-fa035b22d05c	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	e56b8cbe-7db9-4f0b-9272-7495d58969a1	0e8f8646-22bd-4182-a314-9dc5ea960170	1	4179687.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	4179687.000000000000000000000000000000	28.000000000000000000000000000000	1170313.000000000000000000000000000000	5350000.000000000000000000000000000000	2026-11-20 08:42:30.699	APPROVED	Approved with dealer comprehensive warranty package and roadside assistance.	2026-10-21 08:42:30.703	2026-10-21 08:42:30.703
39a932f3-ecb7-46bf-8c61-cbc7bba6f3b6	QT-2026-UDR-002	85019c80-c940-4c5c-a08d-8cab311d3d9a	caea06d6-18a0-4ac1-8f37-eadad2a2f291	ec625d6e-2c4f-404d-a4c3-79b0507ce40e	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	a134b2fe-00be-45b2-81c8-057eaa745a80	e56b8cbe-7db9-4f0b-9272-7495d58969a1	b051d45f-b098-4f55-84d6-efaa8db30db5	1	3398437.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	3398437.000000000000000000000000000000	28.000000000000000000000000000000	951563.000000000000000000000000000000	4350000.000000000000000000000000000000	2026-11-10 08:42:30.709	SUBMITTED	Submitted for manager review with festive body-building subsidy.	2026-10-21 08:42:30.712	2026-10-21 08:42:30.712
444b466a-16a9-4ba6-a0b2-0e3818724aa3	QT-2026-JAI-001	2ae0d27b-267c-42a8-9173-c927b56f651c	5048ef08-fcd7-4207-acba-3851255a7150	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	var-al-avtr-5525-cowl	1	3085938.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	3085938.000000000000000000000000000000	28.000000000000000000000000000000	864062.000000000000000000000000000000	3950000.000000000000000000000000000000	2026-11-15 08:42:31.117	APPROVED	Approved with Ashok Leyland i-Alert telematics subscription for 2 years.	2026-10-21 08:42:31.121	2026-10-21 08:42:31.121
d5bf98c7-6253-4c14-a34b-3a688af2eecf	QT-2026-JAI-002	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	c1ff4ee4-feed-42f0-8f44-76563aa87054	7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785	8c187ee7-acc6-4b72-bbcb-e798fe639013	5734ebab-66af-4412-a6b7-e50223a3bddd	3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	var-al-bada-dost-i4	1	710938.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	710938.000000000000000000000000000000	28.000000000000000000000000000000	199062.000000000000000000000000000000	910000.000000000000000000000000000000	2026-11-05 08:42:31.124	SUBMITTED	Submitted for manager approval with cabin air conditioning option.	2026-10-21 08:42:31.127	2026-10-21 08:42:31.127
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
00d44926-c14e-411b-9cd0-674305095469	cad53e3c-d568-493b-b6f5-c8ff38c97592
00d44926-c14e-411b-9cd0-674305095469	b12c2310-0b62-4b4b-94fa-1d6309b2a98a
00d44926-c14e-411b-9cd0-674305095469	80293f92-7683-4350-ade5-3664bdd3955a
00d44926-c14e-411b-9cd0-674305095469	3814bab0-1d7c-403c-8b16-1f56f2478a90
00d44926-c14e-411b-9cd0-674305095469	4760522a-101e-4a89-a991-c7ba92ed2b21
00d44926-c14e-411b-9cd0-674305095469	28717030-805e-40a9-b400-c90ac5a7284c
00d44926-c14e-411b-9cd0-674305095469	5ec0a884-849d-4caf-ada3-bd69cab3c138
00d44926-c14e-411b-9cd0-674305095469	ffbb07d3-cef5-4ea2-9eb9-a4576a6627f1
00d44926-c14e-411b-9cd0-674305095469	11a8325f-48ec-4ab9-8987-d2a29305b2cf
00d44926-c14e-411b-9cd0-674305095469	8a6a6e03-08f3-4818-b417-b6e2a15801eb
00d44926-c14e-411b-9cd0-674305095469	2d993c40-acda-4afe-8ea3-841330cce76a
00d44926-c14e-411b-9cd0-674305095469	2fe53f04-5c83-42eb-9474-70b39f32184f
00d44926-c14e-411b-9cd0-674305095469	4ff199cb-d536-4339-bc49-be4d00adf2a6
00d44926-c14e-411b-9cd0-674305095469	f608383a-8f9a-4fc3-a0e5-cbbfcef93133
00d44926-c14e-411b-9cd0-674305095469	349ace31-f3bb-46f1-96ef-da267ed878bf
00d44926-c14e-411b-9cd0-674305095469	875e2976-29a6-4b46-bd0e-f3473f32b85a
00d44926-c14e-411b-9cd0-674305095469	9ed84c88-bcff-4ec3-b314-9162be6a0b9d
00d44926-c14e-411b-9cd0-674305095469	95c02a3b-4a9c-4b2c-b3a2-9d4be34b42a8
00d44926-c14e-411b-9cd0-674305095469	f98c9d47-c70a-4108-9791-2af608ae55df
00d44926-c14e-411b-9cd0-674305095469	16792ff7-fb02-4805-ad21-e14d27c10ddf
00d44926-c14e-411b-9cd0-674305095469	bff54219-e77a-42a2-8070-bb22247f6eaf
00d44926-c14e-411b-9cd0-674305095469	0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2
00d44926-c14e-411b-9cd0-674305095469	0aefb510-69a1-4013-b950-667053052e24
00d44926-c14e-411b-9cd0-674305095469	2f1d5a4d-522e-4f47-915b-1fd574118936
00d44926-c14e-411b-9cd0-674305095469	87ae5ac7-4790-413f-8d4f-fdfa11f27608
0ed10bf7-7eba-4827-af16-7bc1429e9976	b12c2310-0b62-4b4b-94fa-1d6309b2a98a
0ed10bf7-7eba-4827-af16-7bc1429e9976	3814bab0-1d7c-403c-8b16-1f56f2478a90
0ed10bf7-7eba-4827-af16-7bc1429e9976	4760522a-101e-4a89-a991-c7ba92ed2b21
0ed10bf7-7eba-4827-af16-7bc1429e9976	28717030-805e-40a9-b400-c90ac5a7284c
0ed10bf7-7eba-4827-af16-7bc1429e9976	5ec0a884-849d-4caf-ada3-bd69cab3c138
0ed10bf7-7eba-4827-af16-7bc1429e9976	ffbb07d3-cef5-4ea2-9eb9-a4576a6627f1
0ed10bf7-7eba-4827-af16-7bc1429e9976	11a8325f-48ec-4ab9-8987-d2a29305b2cf
0ed10bf7-7eba-4827-af16-7bc1429e9976	8a6a6e03-08f3-4818-b417-b6e2a15801eb
0ed10bf7-7eba-4827-af16-7bc1429e9976	2d993c40-acda-4afe-8ea3-841330cce76a
0ed10bf7-7eba-4827-af16-7bc1429e9976	2fe53f04-5c83-42eb-9474-70b39f32184f
0ed10bf7-7eba-4827-af16-7bc1429e9976	4ff199cb-d536-4339-bc49-be4d00adf2a6
0ed10bf7-7eba-4827-af16-7bc1429e9976	f608383a-8f9a-4fc3-a0e5-cbbfcef93133
0ed10bf7-7eba-4827-af16-7bc1429e9976	349ace31-f3bb-46f1-96ef-da267ed878bf
0ed10bf7-7eba-4827-af16-7bc1429e9976	875e2976-29a6-4b46-bd0e-f3473f32b85a
0ed10bf7-7eba-4827-af16-7bc1429e9976	9ed84c88-bcff-4ec3-b314-9162be6a0b9d
0ed10bf7-7eba-4827-af16-7bc1429e9976	95c02a3b-4a9c-4b2c-b3a2-9d4be34b42a8
0ed10bf7-7eba-4827-af16-7bc1429e9976	f98c9d47-c70a-4108-9791-2af608ae55df
0ed10bf7-7eba-4827-af16-7bc1429e9976	16792ff7-fb02-4805-ad21-e14d27c10ddf
0ed10bf7-7eba-4827-af16-7bc1429e9976	0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2
0ed10bf7-7eba-4827-af16-7bc1429e9976	2f1d5a4d-522e-4f47-915b-1fd574118936
c4976cef-26e0-4306-8d60-48d164285741	4760522a-101e-4a89-a991-c7ba92ed2b21
c4976cef-26e0-4306-8d60-48d164285741	5ec0a884-849d-4caf-ada3-bd69cab3c138
c4976cef-26e0-4306-8d60-48d164285741	ffbb07d3-cef5-4ea2-9eb9-a4576a6627f1
c4976cef-26e0-4306-8d60-48d164285741	8a6a6e03-08f3-4818-b417-b6e2a15801eb
c4976cef-26e0-4306-8d60-48d164285741	2d993c40-acda-4afe-8ea3-841330cce76a
c4976cef-26e0-4306-8d60-48d164285741	2fe53f04-5c83-42eb-9474-70b39f32184f
c4976cef-26e0-4306-8d60-48d164285741	4ff199cb-d536-4339-bc49-be4d00adf2a6
c4976cef-26e0-4306-8d60-48d164285741	f608383a-8f9a-4fc3-a0e5-cbbfcef93133
c4976cef-26e0-4306-8d60-48d164285741	349ace31-f3bb-46f1-96ef-da267ed878bf
c4976cef-26e0-4306-8d60-48d164285741	875e2976-29a6-4b46-bd0e-f3473f32b85a
c4976cef-26e0-4306-8d60-48d164285741	9ed84c88-bcff-4ec3-b314-9162be6a0b9d
c4976cef-26e0-4306-8d60-48d164285741	95c02a3b-4a9c-4b2c-b3a2-9d4be34b42a8
c4976cef-26e0-4306-8d60-48d164285741	f98c9d47-c70a-4108-9791-2af608ae55df
c4976cef-26e0-4306-8d60-48d164285741	16792ff7-fb02-4805-ad21-e14d27c10ddf
c4976cef-26e0-4306-8d60-48d164285741	bff54219-e77a-42a2-8070-bb22247f6eaf
c4976cef-26e0-4306-8d60-48d164285741	0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2
c4976cef-26e0-4306-8d60-48d164285741	0aefb510-69a1-4013-b950-667053052e24
c4976cef-26e0-4306-8d60-48d164285741	2f1d5a4d-522e-4f47-915b-1fd574118936
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	2fe53f04-5c83-42eb-9474-70b39f32184f
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	4ff199cb-d536-4339-bc49-be4d00adf2a6
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	f608383a-8f9a-4fc3-a0e5-cbbfcef93133
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	875e2976-29a6-4b46-bd0e-f3473f32b85a
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	95c02a3b-4a9c-4b2c-b3a2-9d4be34b42a8
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	f98c9d47-c70a-4108-9791-2af608ae55df
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	16792ff7-fb02-4805-ad21-e14d27c10ddf
a1225fb6-9c63-47fe-a15b-00831813d5ec	875e2976-29a6-4b46-bd0e-f3473f32b85a
a1225fb6-9c63-47fe-a15b-00831813d5ec	0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2
a1225fb6-9c63-47fe-a15b-00831813d5ec	0aefb510-69a1-4013-b950-667053052e24
9f013020-bfac-4cd5-b1e2-cf7338944bbd	4ff199cb-d536-4339-bc49-be4d00adf2a6
9f013020-bfac-4cd5-b1e2-cf7338944bbd	875e2976-29a6-4b46-bd0e-f3473f32b85a
9f013020-bfac-4cd5-b1e2-cf7338944bbd	f98c9d47-c70a-4108-9791-2af608ae55df
9f013020-bfac-4cd5-b1e2-cf7338944bbd	0c1b4b99-8bc5-414f-b2bb-6274dc5d5ee2
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.roles (id, name, description, rank, is_system, created_at, updated_at) FROM stdin;
0ed10bf7-7eba-4827-af16-7bc1429e9976	FRANCHISE_OWNER	Franchise Owner Executive	2	t	2026-10-04 15:05:39.415	2026-10-04 15:05:39.415
0d31a84e-e610-4ecc-b25f-8534ac5a45a6	FRANCHISE_MANAGER	Franchise Regional Manager	3	t	2026-10-04 15:05:39.42	2026-10-04 15:05:39.42
85d3936a-643d-4917-8f0f-bb5c23fc9886	BRANCH_OWNER	Branch Dealership Owner	4	t	2026-10-04 15:05:39.424	2026-10-04 15:05:39.424
35e07af8-5731-4c2f-bb1f-a41230e90bcd	DEPARTMENT_MANAGER	Department Manager	6	t	2026-10-04 15:05:39.432	2026-10-04 15:05:39.432
4f88d1ec-52b2-419b-84ab-04c3c9f3c0b4	SALES_EMPLOYEE	Commercial Sales Executive	7	t	2026-10-04 15:05:39.437	2026-10-04 15:05:39.437
4f7a0046-7d54-4565-9591-a16862d842dd	SERVICE_ADVISOR	Service Advisor	8	t	2026-10-04 15:05:39.439	2026-10-04 15:05:39.439
4e49309b-602f-4426-b589-f59df5cee1c6	EMPLOYEE	General Operational Staff	10	t	2026-10-04 15:05:39.447	2026-10-04 15:05:39.447
00d44926-c14e-411b-9cd0-674305095469	SUPER_ADMIN	Global Platform Super Admin	1	t	2026-10-04 15:05:39.377	2026-10-04 15:22:36.904
c4976cef-26e0-4306-8d60-48d164285741	BRANCH_MANAGER	Branch Dealership Manager	5	t	2026-10-04 15:05:39.429	2026-10-04 15:22:36.911
a1225fb6-9c63-47fe-a15b-00831813d5ec	MECHANIC	Certified Service Technician	7	t	2026-10-04 15:05:39.443	2026-10-04 15:22:36.914
9f013020-bfac-4cd5-b1e2-cf7338944bbd	CUSTOMER	Fleet Customer Account	99	t	2026-10-04 15:05:39.45	2026-10-04 15:22:36.917
\.


--
-- Data for Name: service_appointments; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_appointments (id, appointment_number, customer_id, vehicle_id, branch_id, service_advisor_id, requested_service, preferred_date, preferred_time, status, customer_notes, created_at, updated_at) FROM stdin;
5fab0fc4-dc85-4069-95da-4d5b33c192c0	APT-2026-UDR-001	e05f34da-09e4-4839-afa5-878560a63fc7	823e42fa-604d-433c-b5c2-f26cf382f3dd	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	Periodic 40,000 km Major Maintenance	2026-10-21 08:42:30.771	\N	CONFIRMED	\N	2026-10-21 08:42:30.775	2026-10-21 08:42:30.775
13885f84-332c-4343-a841-dac1d81efe24	APT-2026-UDR-002	85019c80-c940-4c5c-a08d-8cab311d3d9a	a0115612-7379-4b7a-9b1a-356e24cc6bb4	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	Transmission Oil Flush and Primary Filter Swap	2026-10-20 08:42:30.816	\N	COMPLETED	\N	2026-10-21 08:42:30.819	2026-10-21 08:42:30.819
d38b7823-ce76-4b0d-9391-17205c920514	APT-2026-JAI-001	2ae0d27b-267c-42a8-9173-c927b56f651c	0b613ac3-2ca1-4d1a-87ea-c695194c78c9	8c187ee7-acc6-4b72-bbcb-e798fe639013	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	Periodic Maintenance and Air Brake Inspection	2026-10-21 08:42:31.171	\N	CONFIRMED	\N	2026-10-21 08:42:31.175	2026-10-21 08:42:31.175
0e7bcce1-8fcc-4345-89db-d150eecbfab9	APT-2026-JAI-002	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	625a438e-1be9-4ae7-b38e-bac012704676	8c187ee7-acc6-4b72-bbcb-e798fe639013	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	Suspension Leaf Spring Bushing Check	2026-10-20 08:42:31.195	\N	COMPLETED	\N	2026-10-21 08:42:31.199	2026-10-21 08:42:31.199
\.


--
-- Data for Name: service_approvals; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_approvals (id, service_job_id, additional_work_desc, estimated_cost, decision, customer_notes, decided_at, created_at) FROM stdin;
\.


--
-- Data for Name: service_diagnoses; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_diagnoses (id, service_job_id, mechanic_id, findings, recommended_work, severity, additional_cost, images, notes, created_at) FROM stdin;
ca2938cb-bff1-498f-b30c-2961e034d332	0ee28108-cb88-4b10-bb81-bd323027a795	48ff411f-47ca-44a7-8ede-c2ae3524ff2a	Front axle S-cam brake lining worn down past 3mm indicator groove.	Replace brake lining kit on front and rear tandem axles.	HIGH	0.000000000000000000000000000000	{}	Diagnostic Code: BRK-WORN-04	2026-10-21 08:42:30.793
9fa3adc4-5542-46ff-bd0f-a46b190e7b8c	f8fa9ada-49f7-440f-9f1c-405ccccd4b65	ae791781-91be-4538-ac0f-b228b296e078	Primary air dryer filter cartridge clogged with highway dust residue.	Replace air dryer filter cartridge and perform pneumatic pressure bleed test.	HIGH	0.000000000000000000000000000000	{}	Diagnostic Code: PNEU-VALVE-02	2026-10-21 08:42:31.185
\.


--
-- Data for Name: service_job_parts; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_job_parts (id, service_job_id, part_id, quantity, unit_price, gst_rate, total_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: service_jobs; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_jobs (id, job_number, appointment_id, customer_id, vehicle_id, branch_id, service_advisor_id, assigned_mechanic_id, complaint, diagnosis, odometer, fuel_level, estimated_completion_time, actual_completion_time, estimated_cost, actual_cost, status, notes, warranty_coverage, warranty_claim_ref, service_invoice_id, created_at, updated_at) FROM stdin;
0ee28108-cb88-4b10-bb81-bd323027a795	JOB-2026-UDR-001	5fab0fc4-dc85-4069-95da-4d5b33c192c0	e05f34da-09e4-4839-afa5-878560a63fc7	823e42fa-604d-433c-b5c2-f26cf382f3dd	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	48ff411f-47ca-44a7-8ede-c2ae3524ff2a	Heavy brake pedal vibration and reduced retarder braking efficiency	\N	38450	75%	\N	\N	14500.000000000000000000000000000000	0.000000000000000000000000000000	IN_PROGRESS	\N	f	\N	\N	2026-10-21 08:42:30.783	2026-10-21 08:42:30.783
41aab1cc-f9d0-445e-9241-ae22e6e1fbfe	JOB-2026-UDR-002	13885f84-332c-4343-a841-dac1d81efe24	85019c80-c940-4c5c-a08d-8cab311d3d9a	a0115612-7379-4b7a-9b1a-356e24cc6bb4	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	7d9a9d99-10ed-401a-9ed4-bb1106f5dc7f	48ff411f-47ca-44a7-8ede-c2ae3524ff2a	Routine pre-dispatch oil replacement and primary filter swap	\N	1200	\N	\N	2026-10-21 08:42:30.822	0.000000000000000000000000000000	6500.000000000000000000000000000000	COMPLETED	\N	f	\N	\N	2026-10-21 08:42:30.825	2026-10-21 08:42:30.825
f8fa9ada-49f7-440f-9f1c-405ccccd4b65	JOB-2026-JAI-001	d38b7823-ce76-4b0d-9391-17205c920514	2ae0d27b-267c-42a8-9173-c927b56f651c	0b613ac3-2ca1-4d1a-87ea-c695194c78c9	8c187ee7-acc6-4b72-bbcb-e798fe639013	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	ae791781-91be-4538-ac0f-b228b296e078	Engine air intake check and air pressure valve diagnostic	\N	42100	50%	\N	\N	11000.000000000000000000000000000000	0.000000000000000000000000000000	IN_PROGRESS	\N	f	\N	\N	2026-10-21 08:42:31.18	2026-10-21 08:42:31.18
9f6eec73-59ed-4f2c-b7c0-b24630b994bb	JOB-2026-JAI-002	0e7bcce1-8fcc-4345-89db-d150eecbfab9	bed9e3e5-ef4f-4962-8370-c3e3d043aee0	625a438e-1be9-4ae7-b38e-bac012704676	8c187ee7-acc6-4b72-bbcb-e798fe639013	04a1029e-24d0-4d70-ad9a-3fc04a59c9df	ae791781-91be-4538-ac0f-b228b296e078	Rear suspension leaf spring squeak during load transit	\N	14500	\N	\N	2026-10-21 08:42:31.202	0.000000000000000000000000000000	5200.000000000000000000000000000000	COMPLETED	\N	f	\N	\N	2026-10-21 08:42:31.206	2026-10-21 08:42:31.206
\.


--
-- Data for Name: service_labour; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_labour (id, service_job_id, labour_type, description, hours, hourly_rate, discount, tax_rate, total_amount, created_at) FROM stdin;
7d7ad805-e53d-4a83-826e-68fe7dd97aa7	0ee28108-cb88-4b10-bb81-bd323027a795	MECHANICAL	Axle hub removal and brake lining re-shoeing	4.5	800.000000000000000000000000000000	0.000000000000000000000000000000	18.000000000000000000000000000000	3600.000000000000000000000000000000	2026-10-21 08:42:30.812
70942b31-3ddb-4c85-afa9-f901d95c41ef	f8fa9ada-49f7-440f-9f1c-405ccccd4b65	MECHANICAL	Air brake pneumatic diagnostic and valve servicing	3.5	800.000000000000000000000000000000	0.000000000000000000000000000000	18.000000000000000000000000000000	2800.000000000000000000000000000000	2026-10-21 08:42:31.192
\.


--
-- Data for Name: service_qcs; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.service_qcs (id, service_job_id, inspector_user_id, status, checklist, failed_items, remarks, images, created_at) FROM stdin;
\.


--
-- Data for Name: truck_models; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.truck_models (id, manufacturer_id, name, category, status, created_at, updated_at) FROM stdin;
model-al-avtr-5525	9ff39ecc-35a2-4947-be34-164f0c446ab3	AVTR 5525.T	Heavy Commercial Vehicle	ACTIVE	2026-10-04 15:05:39.889	2026-10-04 15:05:39.889
model-al-ecomet-1215	9ff39ecc-35a2-4947-be34-164f0c446ab3	Ecomet 1215 HE	Intermediate Commercial Vehicle	ACTIVE	2026-10-04 15:05:39.905	2026-10-04 15:05:39.905
model-al-bada-dost	9ff39ecc-35a2-4947-be34-164f0c446ab3	Bada Dost	Light Commercial Vehicle	ACTIVE	2026-10-04 15:05:39.912	2026-10-04 15:05:39.912
0d3ddda7-331b-48f0-88da-1ef3c69fd226	101aa601-f4ab-42f5-9e43-d5b3dffbe961	Prima Heavy Duty Series	HAULAGE	ACTIVE	2026-10-04 15:18:53.407	2026-10-04 15:18:53.407
672eb517-4d92-4c71-8945-c70dd8d3e963	33fe9912-f178-4cbe-a7bc-9914115a1581	Pro 6049	\N	ACTIVE	2026-10-04 15:20:34.135	2026-10-04 15:20:34.135
1138d831-827d-4f3c-941d-84d6c5f390c6	6d0ff1e2-083e-4727-8465-0cb7f2983dee	Pro 6049	\N	ACTIVE	2026-10-04 15:22:37.017	2026-10-04 15:22:37.017
529eb15f-6eab-4121-88df-11c868121acf	9e19dda1-b53c-4c0b-b545-047e93bf19c0	Prima Heavy Duty Series	HAULAGE	ACTIVE	2026-10-04 15:22:37.117	2026-10-04 15:22:37.117
b5948df1-8aeb-43f5-a189-79b26c1ab26b	9ff39ecc-35a2-4947-be34-164f0c446ab3	Titan Ultra Hauler 1792512788288	\N	ACTIVE	2026-10-20 16:13:08.372	2026-10-20 16:13:08.372
557703b3-0c35-4509-9a8b-2267c5976f5f	9ff39ecc-35a2-4947-be34-164f0c446ab3	Titan Ultra Hauler 1792512950238	\N	ACTIVE	2026-10-20 16:15:50.372	2026-10-20 16:15:50.372
04eb7914-b03b-42d5-a0ef-6d06c4716929	9ff39ecc-35a2-4947-be34-164f0c446ab3	Titan Ultra Hauler 1792513476264	\N	ACTIVE	2026-10-20 16:24:36.414	2026-10-20 16:24:36.414
41baa8df-9c6f-4218-802c-363ea624dfda	95b96215-2a46-4665-a13e-a77373ea01ab	Tata Signa 4825.TK	Heavy Tipper	ACTIVE	2026-10-21 08:42:30.443	2026-10-21 08:42:30.443
e793d088-4c7d-4a30-bcd7-6a0b59e5de63	95b96215-2a46-4665-a13e-a77373ea01ab	Tata Prima 5530.S	Prime Mover Trailer	ACTIVE	2026-10-21 08:42:30.464	2026-10-21 08:42:30.464
\.


--
-- Data for Name: truck_variants; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.truck_variants (id, model_id, name, engine_details, horsepower, fuel_type, transmission, payload, base_price, gst_rate, description, specifications, images, status, created_at, updated_at) FROM stdin;
var-al-avtr-5525-cowl	model-al-avtr-5525	AVTR 5525.T 4x2 Cowl & Chassis	A Series 4 Cylinder with i-Gen6 Technology	250	DIESEL	9-Speed Synchromesh	40000	3850000.000000000000000000000000000000	28.000000000000000000000000000000	Heavy duty modular haulage truck for long distance interstate transport.	\N	{}	ACTIVE	2026-10-04 15:05:39.895	2026-10-04 15:05:39.895
var-al-ecomet-1215-cargo	model-al-ecomet-1215	Ecomet 1215 HE 17ft Cabin Cargo	H series 4 Cylinder CRS with i-Gen6	150	DIESEL	6-Speed Manual	7800	2150000.000000000000000000000000000000	28.000000000000000000000000000000	Reliable and fuel-efficient ICV for regional distribution.	\N	{}	ACTIVE	2026-10-04 15:05:39.909	2026-10-04 15:05:39.909
var-al-bada-dost-i4	model-al-bada-dost	Bada Dost i4 High Deck	1.5L 3-Cylinder Turbocharged Diesel	80	DIESEL	5-Speed Manual	1825	875000.000000000000000000000000000000	28.000000000000000000000000000000	Next-gen customer-centric LCV for intra-city and hub delivery.	\N	{}	ACTIVE	2026-10-04 15:05:39.916	2026-10-04 15:05:39.916
3b151b39-68a0-463c-963f-133429d3b079	0d3ddda7-331b-48f0-88da-1ef3c69fd226	Prima 5530.S Trailer	Cummins ISBe 6.7L BS6	300	DIESEL	9-Speed Manual	55000	4200000.000000000000000000000000000000	28.000000000000000000000000000000	Flagship heavy commercial tractor trailer	\N	{}	ACTIVE	2026-10-04 15:18:53.456	2026-10-04 15:18:53.456
9cd1bd8a-0037-4d21-8bbf-5952f3ef96ff	672eb517-4d92-4c71-8945-c70dd8d3e963	Pro 6049 Haulage	\N	\N	\N	\N	\N	4800000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-04 15:20:34.14	2026-10-04 15:20:34.14
97ae5a9f-da53-44c9-8a4e-a903127ac6ce	1138d831-827d-4f3c-941d-84d6c5f390c6	Pro 6049 Haulage	\N	\N	\N	\N	\N	4800000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-04 15:22:37.022	2026-10-04 15:22:37.022
26e512d6-0247-479e-9654-c1cd400eecf3	529eb15f-6eab-4121-88df-11c868121acf	Prima 5530.S Trailer	Cummins ISBe 6.7L BS6	300	DIESEL	9-Speed Manual	55000	4200000.000000000000000000000000000000	28.000000000000000000000000000000	Flagship heavy commercial tractor trailer	\N	{}	ACTIVE	2026-10-04 15:22:37.146	2026-10-04 15:22:37.146
aca2f88f-270a-484f-8703-a1b41761992d	b5948df1-8aeb-43f5-a189-79b26c1ab26b	5525.TT 4x2 1792512788288	\N	\N	\N	\N	\N	3500000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-20 16:13:08.375	2026-10-20 16:13:08.375
82aec1ff-9de5-4f41-8de6-cbafce20d252	557703b3-0c35-4509-9a8b-2267c5976f5f	5525.TT 4x2 1792512950238	\N	\N	\N	\N	\N	3500000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-20 16:15:50.375	2026-10-20 16:15:50.375
ed9ef9ab-7204-4c01-8956-3f3548229a91	04eb7914-b03b-42d5-a0ef-6d06c4716929	5525.TT 4x2 1792513476264	\N	\N	\N	\N	\N	3500000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-20 16:24:36.419	2026-10-20 16:24:36.419
0e8f8646-22bd-4182-a314-9dc5ea960170	41baa8df-9c6f-4218-802c-363ea624dfda	Tata Signa 4825.TK 10x4 Tipper	Cummins ISBe 6.7L BS6 Phase 2	250	DIESEL	\N	29000	5200000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-21 08:42:30.453	2026-10-21 08:42:30.453
b051d45f-b098-4f55-84d6-efaa8db30db5	e793d088-4c7d-4a30-bcd7-6a0b59e5de63	Tata Prima 5530.S 4x2 Tractor	Cummins ISBe 6.7L 300HP	300	DIESEL	\N	35000	4200000.000000000000000000000000000000	28.000000000000000000000000000000	\N	\N	{}	ACTIVE	2026-10-21 08:42:30.471	2026-10-21 08:42:30.471
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.users (id, email, phone, password_hash, account_type, status, last_login_at, created_at, updated_at, google_id) FROM stdin;
6e615919-94c1-4d29-bc5b-c87849479355	admin@titanauto.com	\N	$2b$10$8Sy8edYyyA2IwRxWaHxi/Ombxsq52fLAvsRAxlwlVEG3A0Pp2LaHW	SUPER_ADMIN	ACTIVE	2026-10-20 16:26:51.185	2026-10-04 15:05:40.254	2026-10-20 16:26:51.19	\N
7d9be1aa-fe35-46fd-831b-310275cd102b	franchise.tata@titanauto.com	+919829000101	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.507	2026-10-21 08:42:30.507	\N
d907a25a-84a5-4f3c-ae89-a487f1be6970	bm.udaipur@titanauto.com	+919829000102	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.537	2026-10-21 08:42:30.537	\N
e56b8cbe-7db9-4f0b-9272-7495d58969a1	sales.udaipur@titanauto.com	+919829000103	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.555	2026-10-21 08:42:30.555	\N
7816f86d-eba4-41b8-83b5-bddf62203c49	advisor.udaipur@titanauto.com	+919829000104	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.572	2026-10-21 08:42:30.572	\N
716b9dec-b4f6-4619-92e5-e38ec647c037	mechanic.udaipur@titanauto.com	+919829000105	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.589	2026-10-21 08:42:30.589	\N
802f019b-15ac-473f-8de3-fad4d876300c	mewar.mining@fleet.in	+919829111001	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	CUSTOMER	ACTIVE	\N	2026-10-21 08:42:30.608	2026-10-21 08:42:30.608	\N
b74dcf38-0860-483a-a740-807cb4b75cf1	udaipur.marble@fleet.in	+919829111002	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	CUSTOMER	ACTIVE	\N	2026-10-21 08:42:30.626	2026-10-21 08:42:30.626	\N
bbb82c33-45f1-4205-afa0-18b9b242462c	franchise.ashok@titanauto.com	+919829000201	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.945	2026-10-21 08:42:30.945	\N
03b89618-31ed-4668-93bd-a746e950e10d	bm.jaipur@titanauto.com	+919829000202	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.967	2026-10-21 08:42:30.967	\N
3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	sales.jaipur@titanauto.com	+919829000203	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:30.983	2026-10-21 08:42:30.983	\N
2140334d-01d2-4ec5-ade8-c3d76d247205	advisor.jaipur@titanauto.com	+919829000204	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:31.001	2026-10-21 08:42:31.001	\N
c5ddca41-cac3-4121-9f66-a4675c493d7d	mechanic.jaipur@titanauto.com	+919829000205	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	EMPLOYEE	ACTIVE	\N	2026-10-21 08:42:31.017	2026-10-21 08:42:31.017	\N
253b4803-b5b9-4a65-a87d-b7d50d589aa8	jaipur.cargo@fleet.in	+919829222001	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	CUSTOMER	ACTIVE	\N	2026-10-21 08:42:31.035	2026-10-21 08:42:31.035	\N
54f79965-1c18-40d5-9602-aadcaa968364	pinkcity.transport@fleet.in	+919829222002	$2b$10$MZONWQz5ISE5HmaL4ST51uKK8Ae4qorDBLhEA0oEi6XkN8o.6zJRq	CUSTOMER	ACTIVE	\N	2026-10-21 08:42:31.049	2026-10-21 08:42:31.049	\N
\.


--
-- Data for Name: vehicle_allocations; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.vehicle_allocations (id, booking_id, vehicle_id, allocated_by_user_id, allocated_at, previous_vehicle_status, notes) FROM stdin;
d5f8f432-28fd-4fb7-a4a0-1c78b6a6f2aa	20f3a73f-4603-444d-aa37-47c9a61bd2d0	a0115612-7379-4b7a-9b1a-356e24cc6bb4	e56b8cbe-7db9-4f0b-9272-7495d58969a1	2026-10-21 08:42:30.729	IN_STOCK	Allocated for confirmed booking
3c134fbc-c515-4c2b-af8d-e438e65456d9	8f6987ae-f120-45f9-9129-b583e38ea1d1	625a438e-1be9-4ae7-b38e-bac012704676	3770a730-43d5-4dbf-9e0b-5e1914a5e2ad	2026-10-21 08:42:31.139	IN_STOCK	Allocated for confirmed booking
\.


--
-- Data for Name: vehicle_compliance_documents; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.vehicle_compliance_documents (id, vehicle_id, document_type, document_number, issuing_authority, issue_date, expiry_date, status, reminder_sent, attachment_url, file_attachment_id, notes, metadata, created_at, updated_at) FROM stdin;
c6000d39-0f7e-4903-96b3-1509939216b0	823e42fa-604d-433c-b5c2-f26cf382f3dd	PUC	PUC-RJ27-2026-00481	\N	2026-10-21 08:42:30.851	2027-04-19 08:42:30.851	VALID	f	\N	\N	\N	\N	2026-10-21 08:42:30.855	2026-10-21 08:42:30.855
d6c4c2a4-9b64-4cdd-80af-6db6863efa66	a0115612-7379-4b7a-9b1a-356e24cc6bb4	FITNESS_CERTIFICATE	FIT-RJ27-2026-00912	\N	2025-11-15 08:42:30.859	2026-11-10 08:42:30.859	VALID	f	\N	\N	\N	\N	2026-10-21 08:42:30.862	2026-10-21 08:42:30.862
b0d551af-510e-48a2-b50c-deac4e363f73	0b613ac3-2ca1-4d1a-87ea-c695194c78c9	PUC	PUC-RJ14-2026-00388	\N	2026-10-21 08:42:31.228	2027-04-19 08:42:31.228	VALID	f	\N	\N	\N	\N	2026-10-21 08:42:31.231	2026-10-21 08:42:31.231
9e473508-f4a6-424a-9338-0380c10e7843	625a438e-1be9-4ae7-b38e-bac012704676	FITNESS_CERTIFICATE	FIT-RJ14-2026-00741	\N	2025-11-10 08:42:31.233	2026-11-05 08:42:31.233	VALID	f	\N	\N	\N	\N	2026-10-21 08:42:31.236	2026-10-21 08:42:31.236
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: titan_admin
--

COPY public.vehicles (id, vin, engine_number, registration_number, variant_id, branch_id, customer_id, status, purchase_date, manufacturing_year, color, mileage, base_cost, selling_price, images, documents, created_at, updated_at) FROM stdin;
823e42fa-604d-433c-b5c2-f26cf382f3dd	MAT782011UDR00101	ENG-TATA-UDR-00101	\N	0e8f8646-22bd-4182-a314-9dc5ea960170	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	\N	IN_STOCK	\N	2026	Oxford Blue	0	4600000.000000000000000000000000000000	5350000.000000000000000000000000000000	{}	\N	2026-10-21 08:42:30.643	2026-10-21 08:42:30.643
a0115612-7379-4b7a-9b1a-356e24cc6bb4	MAT782012UDR00102	ENG-TATA-UDR-00102	\N	b051d45f-b098-4f55-84d6-efaa8db30db5	5c8310dc-78e1-49a8-b1cc-4ae37cd9e545	\N	RESERVED	\N	2026	Arctic White	0	3750000.000000000000000000000000000000	4350000.000000000000000000000000000000	{}	\N	2026-10-21 08:42:30.65	2026-10-21 08:42:30.65
0b613ac3-2ca1-4d1a-87ea-c695194c78c9	MAL881021JAI00201	ENG-AL-JAI-00201	\N	var-al-avtr-5525-cowl	8c187ee7-acc6-4b72-bbcb-e798fe639013	\N	IN_STOCK	\N	2026	Signal Red	0	3350000.000000000000000000000000000000	3950000.000000000000000000000000000000	{}	\N	2026-10-21 08:42:31.067	2026-10-21 08:42:31.067
625a438e-1be9-4ae7-b38e-bac012704676	MAL881022JAI00202	ENG-AL-JAI-00202	\N	var-al-bada-dost-i4	8c187ee7-acc6-4b72-bbcb-e798fe639013	\N	RESERVED	\N	2026	Casablanca White	0	760000.000000000000000000000000000000	910000.000000000000000000000000000000	{}	\N	2026-10-21 08:42:31.073	2026-10-21 08:42:31.073
\.


--
-- Name: announcement_reads announcement_reads_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: campaign_expenses campaign_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaign_expenses
    ADD CONSTRAINT campaign_expenses_pkey PRIMARY KEY (id);


--
-- Name: campaign_members campaign_members_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaign_members
    ADD CONSTRAINT campaign_members_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: customer_franchises customer_franchises_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_franchises
    ADD CONSTRAINT customer_franchises_pkey PRIMARY KEY (customer_id, franchise_id);


--
-- Name: customer_reminders customer_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_reminders
    ADD CONSTRAINT customer_reminders_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: employee_approval_requests employee_approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_approval_requests
    ADD CONSTRAINT employee_approval_requests_pkey PRIMARY KEY (id);


--
-- Name: employee_role_assignments employee_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_role_assignments
    ADD CONSTRAINT employee_role_assignments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: file_attachments file_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.file_attachments
    ADD CONSTRAINT file_attachments_pkey PRIMARY KEY (id);


--
-- Name: finance_applications finance_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.finance_applications
    ADD CONSTRAINT finance_applications_pkey PRIMARY KEY (id);


--
-- Name: finance_emi_schedules finance_emi_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.finance_emi_schedules
    ADD CONSTRAINT finance_emi_schedules_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: franchises franchises_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.franchises
    ADD CONSTRAINT franchises_pkey PRIMARY KEY (id);


--
-- Name: insurance_policies insurance_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.insurance_policies
    ADD CONSTRAINT insurance_policies_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_lead_number_key; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_lead_number_key UNIQUE (lead_number);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: manufacturers manufacturers_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: part_stock_movements part_stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.part_stock_movements
    ADD CONSTRAINT part_stock_movements_pkey PRIMARY KEY (id);


--
-- Name: part_stocks part_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.part_stocks
    ADD CONSTRAINT part_stocks_pkey PRIMARY KEY (id);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pdi_inspections pdi_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.pdi_inspections
    ADD CONSTRAINT pdi_inspections_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_appointments service_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_appointments
    ADD CONSTRAINT service_appointments_pkey PRIMARY KEY (id);


--
-- Name: service_approvals service_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_approvals
    ADD CONSTRAINT service_approvals_pkey PRIMARY KEY (id);


--
-- Name: service_diagnoses service_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_diagnoses
    ADD CONSTRAINT service_diagnoses_pkey PRIMARY KEY (id);


--
-- Name: service_job_parts service_job_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_job_parts
    ADD CONSTRAINT service_job_parts_pkey PRIMARY KEY (id);


--
-- Name: service_jobs service_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_pkey PRIMARY KEY (id);


--
-- Name: service_labour service_labour_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_labour
    ADD CONSTRAINT service_labour_pkey PRIMARY KEY (id);


--
-- Name: service_qcs service_qcs_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_qcs
    ADD CONSTRAINT service_qcs_pkey PRIMARY KEY (id);


--
-- Name: truck_models truck_models_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.truck_models
    ADD CONSTRAINT truck_models_pkey PRIMARY KEY (id);


--
-- Name: truck_variants truck_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.truck_variants
    ADD CONSTRAINT truck_variants_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_allocations vehicle_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicle_allocations
    ADD CONSTRAINT vehicle_allocations_pkey PRIMARY KEY (id);


--
-- Name: vehicle_compliance_documents vehicle_compliance_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicle_compliance_documents
    ADD CONSTRAINT vehicle_compliance_documents_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: announcement_reads_user_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX announcement_reads_user_id_idx ON public.announcement_reads USING btree (user_id);


--
-- Name: announcements_branch_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX announcements_branch_id_idx ON public.announcements USING btree (branch_id);


--
-- Name: announcements_franchise_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX announcements_franchise_id_idx ON public.announcements USING btree (franchise_id);


--
-- Name: announcements_status_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX announcements_status_idx ON public.announcements USING btree (status);


--
-- Name: bookings_booking_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX bookings_booking_number_key ON public.bookings USING btree (booking_number);


--
-- Name: branches_code_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX branches_code_key ON public.branches USING btree (code);


--
-- Name: campaign_expenses_campaign_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX campaign_expenses_campaign_id_idx ON public.campaign_expenses USING btree (campaign_id);


--
-- Name: campaign_members_campaign_id_employee_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX campaign_members_campaign_id_employee_id_key ON public.campaign_members USING btree (campaign_id, employee_id);


--
-- Name: campaigns_branch_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX campaigns_branch_id_idx ON public.campaigns USING btree (branch_id);


--
-- Name: campaigns_status_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX campaigns_status_idx ON public.campaigns USING btree (status);


--
-- Name: chat_messages_conversation_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX chat_messages_conversation_id_idx ON public.chat_messages USING btree (conversation_id);


--
-- Name: chat_messages_created_at_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX chat_messages_created_at_idx ON public.chat_messages USING btree (created_at);


--
-- Name: chat_messages_is_read_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX chat_messages_is_read_idx ON public.chat_messages USING btree (is_read);


--
-- Name: chat_messages_sender_user_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX chat_messages_sender_user_id_idx ON public.chat_messages USING btree (sender_user_id);


--
-- Name: conversations_assigned_employee_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX conversations_assigned_employee_id_idx ON public.conversations USING btree (assigned_employee_id);


--
-- Name: conversations_branch_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX conversations_branch_id_idx ON public.conversations USING btree (branch_id);


--
-- Name: conversations_customer_id_branch_id_context_type_context_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX conversations_customer_id_branch_id_context_type_context_id_key ON public.conversations USING btree (customer_id, branch_id, context_type, context_id);


--
-- Name: conversations_customer_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX conversations_customer_id_idx ON public.conversations USING btree (customer_id);


--
-- Name: conversations_last_message_at_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX conversations_last_message_at_idx ON public.conversations USING btree (last_message_at);


--
-- Name: customer_reminders_branch_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX customer_reminders_branch_id_idx ON public.customer_reminders USING btree (branch_id);


--
-- Name: customer_reminders_category_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX customer_reminders_category_idx ON public.customer_reminders USING btree (category);


--
-- Name: customer_reminders_customer_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX customer_reminders_customer_id_idx ON public.customer_reminders USING btree (customer_id);


--
-- Name: customer_reminders_status_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX customer_reminders_status_idx ON public.customer_reminders USING btree (status);


--
-- Name: customers_user_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX customers_user_id_key ON public.customers USING btree (user_id);


--
-- Name: deliveries_delivery_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX deliveries_delivery_number_key ON public.deliveries USING btree (delivery_number);


--
-- Name: employee_role_assignments_employee_id_role_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX employee_role_assignments_employee_id_role_id_key ON public.employee_role_assignments USING btree (employee_id, role_id);


--
-- Name: employees_employee_code_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX employees_employee_code_key ON public.employees USING btree (employee_code);


--
-- Name: employees_user_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX employees_user_id_key ON public.employees USING btree (user_id);


--
-- Name: file_attachments_file_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX file_attachments_file_id_key ON public.file_attachments USING btree (file_id);


--
-- Name: finance_applications_application_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX finance_applications_application_number_key ON public.finance_applications USING btree (application_number);


--
-- Name: finance_applications_booking_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX finance_applications_booking_id_key ON public.finance_applications USING btree (booking_id);


--
-- Name: finance_emi_schedules_due_date_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX finance_emi_schedules_due_date_idx ON public.finance_emi_schedules USING btree (due_date);


--
-- Name: finance_emi_schedules_finance_application_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX finance_emi_schedules_finance_application_id_idx ON public.finance_emi_schedules USING btree (finance_application_id);


--
-- Name: finance_emi_schedules_status_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX finance_emi_schedules_status_idx ON public.finance_emi_schedules USING btree (status);


--
-- Name: franchises_code_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX franchises_code_key ON public.franchises USING btree (code);


--
-- Name: insurance_policies_booking_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX insurance_policies_booking_id_key ON public.insurance_policies USING btree (booking_id);


--
-- Name: insurance_policies_policy_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX insurance_policies_policy_number_key ON public.insurance_policies USING btree (policy_number);


--
-- Name: invoices_invoice_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX invoices_invoice_number_key ON public.invoices USING btree (invoice_number);


--
-- Name: lead_activities_lead_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX lead_activities_lead_id_idx ON public.lead_activities USING btree (lead_id);


--
-- Name: manufacturers_name_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX manufacturers_name_key ON public.manufacturers USING btree (name);


--
-- Name: part_stocks_part_id_branch_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX part_stocks_part_id_branch_id_key ON public.part_stocks USING btree (part_id, branch_id);


--
-- Name: parts_part_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX parts_part_number_key ON public.parts USING btree (part_number);


--
-- Name: payments_idempotency_key_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX payments_idempotency_key_key ON public.payments USING btree (idempotency_key);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: quotations_quotation_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX quotations_quotation_number_key ON public.quotations USING btree (quotation_number);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: service_appointments_appointment_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX service_appointments_appointment_number_key ON public.service_appointments USING btree (appointment_number);


--
-- Name: service_jobs_job_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX service_jobs_job_number_key ON public.service_jobs USING btree (job_number);


--
-- Name: truck_models_manufacturer_id_name_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX truck_models_manufacturer_id_name_key ON public.truck_models USING btree (manufacturer_id, name);


--
-- Name: truck_variants_model_id_name_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX truck_variants_model_id_name_key ON public.truck_variants USING btree (model_id, name);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_google_id_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX users_google_id_key ON public.users USING btree (google_id);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: vehicle_compliance_documents_document_type_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX vehicle_compliance_documents_document_type_idx ON public.vehicle_compliance_documents USING btree (document_type);


--
-- Name: vehicle_compliance_documents_expiry_date_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX vehicle_compliance_documents_expiry_date_idx ON public.vehicle_compliance_documents USING btree (expiry_date);


--
-- Name: vehicle_compliance_documents_vehicle_id_idx; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE INDEX vehicle_compliance_documents_vehicle_id_idx ON public.vehicle_compliance_documents USING btree (vehicle_id);


--
-- Name: vehicles_engine_number_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX vehicles_engine_number_key ON public.vehicles USING btree (engine_number);


--
-- Name: vehicles_vin_key; Type: INDEX; Schema: public; Owner: titan_admin
--

CREATE UNIQUE INDEX vehicles_vin_key ON public.vehicles USING btree (vin);


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_reads announcement_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_author_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_salesperson_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_salesperson_employee_id_fkey FOREIGN KEY (salesperson_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: branches branches_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_expenses campaign_expenses_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaign_expenses
    ADD CONSTRAINT campaign_expenses_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_members campaign_members_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaign_members
    ADD CONSTRAINT campaign_members_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_members campaign_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaign_members
    ADD CONSTRAINT campaign_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaigns campaigns_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaigns campaigns_coordinator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campaigns campaigns_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_assigned_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_assigned_employee_id_fkey FOREIGN KEY (assigned_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_franchises customer_franchises_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_franchises
    ADD CONSTRAINT customer_franchises_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_franchises customer_franchises_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_franchises
    ADD CONSTRAINT customer_franchises_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_reminders customer_reminders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_reminders
    ADD CONSTRAINT customer_reminders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_reminders customer_reminders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_reminders
    ADD CONSTRAINT customer_reminders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_reminders customer_reminders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customer_reminders
    ADD CONSTRAINT customer_reminders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_preferred_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_preferred_branch_id_fkey FOREIGN KEY (preferred_branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deliveries deliveries_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deliveries deliveries_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deliveries deliveries_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deliveries deliveries_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_approval_requests employee_approval_requests_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_approval_requests
    ADD CONSTRAINT employee_approval_requests_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_approval_requests employee_approval_requests_assigned_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_approval_requests
    ADD CONSTRAINT employee_approval_requests_assigned_role_id_fkey FOREIGN KEY (assigned_role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_approval_requests employee_approval_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_approval_requests
    ADD CONSTRAINT employee_approval_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_approval_requests employee_approval_requests_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_approval_requests
    ADD CONSTRAINT employee_approval_requests_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_role_assignments employee_role_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_role_assignments
    ADD CONSTRAINT employee_role_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_role_assignments employee_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employee_role_assignments
    ADD CONSTRAINT employee_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finance_applications finance_applications_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.finance_applications
    ADD CONSTRAINT finance_applications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: finance_applications finance_applications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.finance_applications
    ADD CONSTRAINT finance_applications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: finance_emi_schedules finance_emi_schedules_finance_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.finance_emi_schedules
    ADD CONSTRAINT finance_emi_schedules_finance_application_id_fkey FOREIGN KEY (finance_application_id) REFERENCES public.finance_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: insurance_policies insurance_policies_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.insurance_policies
    ADD CONSTRAINT insurance_policies_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_policies insurance_policies_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.insurance_policies
    ADD CONSTRAINT insurance_policies_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lead_activities lead_activities_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_employee_id_fkey FOREIGN KEY (assigned_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leads leads_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads leads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leads leads_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads leads_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: part_stock_movements part_stock_movements_part_stock_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.part_stock_movements
    ADD CONSTRAINT part_stock_movements_part_stock_id_fkey FOREIGN KEY (part_stock_id) REFERENCES public.part_stocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: part_stocks part_stocks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.part_stocks
    ADD CONSTRAINT part_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: part_stocks part_stocks_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.part_stocks
    ADD CONSTRAINT part_stocks_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdi_inspections pdi_inspections_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.pdi_inspections
    ADD CONSTRAINT pdi_inspections_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotation_items quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quotations quotations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_franchise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_franchise_id_fkey FOREIGN KEY (franchise_id) REFERENCES public.franchises(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotations quotations_salesperson_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_salesperson_employee_id_fkey FOREIGN KEY (salesperson_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.truck_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_appointments service_appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_appointments
    ADD CONSTRAINT service_appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_appointments service_appointments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_appointments
    ADD CONSTRAINT service_appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_appointments service_appointments_service_advisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_appointments
    ADD CONSTRAINT service_appointments_service_advisor_id_fkey FOREIGN KEY (service_advisor_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: service_appointments service_appointments_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_appointments
    ADD CONSTRAINT service_appointments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_approvals service_approvals_service_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_approvals
    ADD CONSTRAINT service_approvals_service_job_id_fkey FOREIGN KEY (service_job_id) REFERENCES public.service_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_diagnoses service_diagnoses_mechanic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_diagnoses
    ADD CONSTRAINT service_diagnoses_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_diagnoses service_diagnoses_service_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_diagnoses
    ADD CONSTRAINT service_diagnoses_service_job_id_fkey FOREIGN KEY (service_job_id) REFERENCES public.service_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_job_parts service_job_parts_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_job_parts
    ADD CONSTRAINT service_job_parts_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_job_parts service_job_parts_service_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_job_parts
    ADD CONSTRAINT service_job_parts_service_job_id_fkey FOREIGN KEY (service_job_id) REFERENCES public.service_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_jobs service_jobs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.service_appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: service_jobs service_jobs_assigned_mechanic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_assigned_mechanic_id_fkey FOREIGN KEY (assigned_mechanic_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: service_jobs service_jobs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_jobs service_jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_jobs service_jobs_service_advisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_service_advisor_id_fkey FOREIGN KEY (service_advisor_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_jobs service_jobs_service_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_service_invoice_id_fkey FOREIGN KEY (service_invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: service_jobs service_jobs_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_jobs
    ADD CONSTRAINT service_jobs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_labour service_labour_service_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_labour
    ADD CONSTRAINT service_labour_service_job_id_fkey FOREIGN KEY (service_job_id) REFERENCES public.service_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_qcs service_qcs_service_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.service_qcs
    ADD CONSTRAINT service_qcs_service_job_id_fkey FOREIGN KEY (service_job_id) REFERENCES public.service_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: truck_models truck_models_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.truck_models
    ADD CONSTRAINT truck_models_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: truck_variants truck_variants_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.truck_variants
    ADD CONSTRAINT truck_variants_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.truck_models(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicle_allocations vehicle_allocations_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicle_allocations
    ADD CONSTRAINT vehicle_allocations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vehicle_allocations vehicle_allocations_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicle_allocations
    ADD CONSTRAINT vehicle_allocations_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vehicle_compliance_documents vehicle_compliance_documents_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicle_compliance_documents
    ADD CONSTRAINT vehicle_compliance_documents_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicles vehicles_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vehicles vehicles_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vehicles vehicles_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: titan_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.truck_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict EcJJeAIsS9USx5J3InwmiwD55qrOA5D3FmvEU4zxKL6DN4RWZa9Igf5WsHAKl0j

