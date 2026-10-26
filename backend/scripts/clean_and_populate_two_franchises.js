const { PrismaClient, VehicleStatus, AccountType, EmployeeStatus, ApprovalStatus, CustomerType, CustomerStatus, LeadStatus, LeadPriority, QuotationStatus, BookingStatus, PaymentStatus, InvoiceStatus, InvoicePaymentStatus, AppointmentStatus, ServiceJobStatus, ReminderCategory, ReminderStatus, AnnouncementCategory, AnnouncementPriority, AnnouncementStatus, AnnouncementAudience, CampaignStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('TITAN AUTO — CLEAN DATABASE & ESTABLISH TWO-FRANCHISE DATASET');
  console.log('===============================================================');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. VERIFY SUPER ADMIN
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'admin@titanauto.com' },
  });

  if (!superAdmin) {
    throw new Error('Fatal error: Primary Super Admin account admin@titanauto.com not found!');
  }
  console.log(`✅ Preserving Primary Super Admin: ${superAdmin.email} (${superAdmin.id})`);

  // 2. SAFE PURGE IN REVERSE DEPENDENCY ORDER
  console.log('\n--- STEP 1: PURGING DISPOSABLE TEST OPERATIONAL DATA ---');

  await prisma.serviceQc.deleteMany({});
  await prisma.serviceApproval.deleteMany({});
  await prisma.serviceJobPart.deleteMany({});
  await prisma.serviceLabour.deleteMany({});
  await prisma.serviceDiagnosis.deleteMany({});
  await prisma.serviceJob.deleteMany({});
  await prisma.serviceAppointment.deleteMany({});

  await prisma.financeEmiSchedule.deleteMany({});
  await prisma.financeApplication.deleteMany({});
  await prisma.insurancePolicy.deleteMany({});

  await prisma.pdiInspection.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.vehicleAllocation.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  await prisma.booking.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});

  await prisma.followUp.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});

  await prisma.campaignExpense.deleteMany({});
  await prisma.campaignMember.deleteMany({});
  await prisma.campaign.deleteMany({});

  await prisma.announcementRead.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.customerReminder.deleteMany({});
  await prisma.notification.deleteMany({});

  await prisma.vehicleComplianceDocument.deleteMany({});
  await prisma.partStockMovement.deleteMany({});
  await prisma.partStock.deleteMany({});
  await prisma.vehicle.deleteMany({});

  await prisma.chatMessage.deleteMany({});
  await prisma.conversation.deleteMany({});

  await prisma.employeeApprovalRequest.deleteMany({});
  await prisma.employeeRoleAssignment.deleteMany({});
  await prisma.employee.deleteMany({});

  await prisma.customerFranchise.deleteMany({});
  await prisma.customer.deleteMany({});

  // Purge test users except Super Admin and developer accounts
  const preservedEmails = [
    'admin@titanauto.com',
    'ravibhatt2406@gmail.com',
    'ravibhatt.ai29@jecrc.ac.in',
  ];
  await prisma.user.deleteMany({
    where: { email: { notIn: preservedEmails } },
  });

  // Purge branches and franchises
  await prisma.branch.deleteMany({});
  await prisma.franchise.deleteMany({});

  console.log('✅ Purged all disposable test records. Database structure and Super Admin preserved.');

  // 3. RETRIEVE SYSTEM ROLES
  console.log('\n--- STEP 2: LOADING SYSTEM RBAC ROLES ---');
  const roles = await prisma.role.findMany();
  const roleMap = {};
  roles.forEach((r) => { roleMap[r.name] = r.id; });
  console.log(`Loaded ${roles.length} system roles:`, Object.keys(roleMap).join(', '));

  // 4. ESTABLISH EXACTLY TWO FRANCHISES AND TWO BRANCHES
  console.log('\n--- STEP 3: CREATING EXACTLY 2 FRANCHISES & 2 BRANCHES ---');

  // Franchise 1: Tata Motors
  const franchiseTata = await prisma.franchise.create({
    data: {
      code: 'FR-TATA-01',
      name: 'Tata Motors',
      legalName: 'Tata Motors Commercial Vehicles Dealership Ltd',
      taxId: '08AABCT2345M1Z1',
      status: 'ACTIVE',
    },
  });

  const branchUdaipur = await prisma.branch.create({
    data: {
      franchiseId: franchiseTata.id,
      code: 'BR-UDR-01',
      name: 'Udaipur',
      address: 'Plot 22-25, NH-8, Sukher Industrial Area',
      city: 'Udaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    },
  });

  // Franchise 2: Ashok Leyland Commercial Vehicles
  const franchiseAshok = await prisma.franchise.create({
    data: {
      code: 'FR-AL-01',
      name: 'Ashok Leyland Commercial Vehicles',
      legalName: 'Ashok Leyland Dealership Network Ltd',
      taxId: '08AABCA1234F1Z5',
      status: 'ACTIVE',
    },
  });

  const branchJaipur = await prisma.branch.create({
    data: {
      franchiseId: franchiseAshok.id,
      code: 'BR-JAI-01',
      name: 'Jaipur',
      address: 'Transport Nagar, Agra Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    },
  });

  // Link Primary Super Admin (Alexander Vance)
  const adminEmp = await prisma.employee.create({
    data: {
      userId: superAdmin.id,
      branchId: branchJaipur.id,
      employeeCode: 'EMP-ADM-001',
      firstName: 'Alexander',
      lastName: 'Vance',
      designation: 'Global Platform Admin',
      status: 'ACTIVE',
    },
  });
  if (roleMap['SUPER_ADMIN']) {
    await prisma.employeeRoleAssignment.create({
      data: {
        employeeId: adminEmp.id,
        roleId: roleMap['SUPER_ADMIN'],
      },
    });
  }

  // Link Developer Super Admin (Ravi Bhatt) if present
  const raviUser = await prisma.user.findFirst({ where: { email: 'ravibhatt2406@gmail.com' } });
  if (raviUser) {
    const raviEmp = await prisma.employee.create({
      data: {
        userId: raviUser.id,
        branchId: branchUdaipur.id,
        employeeCode: 'EMP-8673',
        firstName: 'Ravi',
        lastName: 'Bhatt',
        designation: 'Staff',
        status: 'ACTIVE',
      },
    });
    if (roleMap['SUPER_ADMIN']) {
      await prisma.employeeRoleAssignment.create({
        data: {
          employeeId: raviEmp.id,
          roleId: roleMap['SUPER_ADMIN'],
        },
      });
    }
  }

  // Link Developer Customer if present
  const raviCustUser = await prisma.user.findFirst({ where: { email: 'ravibhatt.ai29@jecrc.ac.in' } });
  if (raviCustUser) {
    const cust = await prisma.customer.create({
      data: {
        userId: raviCustUser.id,
        name: 'Ravi Bhatt',
        email: 'ravibhatt.ai29@jecrc.ac.in',
        phone: raviCustUser.phone || '+919057496989',
        customerType: 'INDIVIDUAL',
        status: 'ACTIVE',
        preferredBranchId: branchJaipur.id,
      },
    });
    await prisma.customerFranchise.create({
      data: {
        customerId: cust.id,
        franchiseId: franchiseAshok.id,
      },
    });
  }

  console.log(`✅ Created Franchise 1: ${franchiseTata.name} -> Branch: ${branchUdaipur.name} (${branchUdaipur.city})`);
  console.log(`✅ Created Franchise 2: ${franchiseAshok.name} -> Branch: ${branchJaipur.name} (${branchJaipur.city})`);

  // 5. ESTABLISH MANUFACTURERS, TRUCK MODELS & VARIANTS
  console.log('\n--- STEP 4: ENSURING MANUFACTURER TRUCK VARIANTS ---');

  // Tata Manufacturer & Models
  let mfrTata = await prisma.manufacturer.findFirst({ where: { name: 'Tata Motors' } });
  if (!mfrTata) {
    mfrTata = await prisma.manufacturer.create({
      data: { name: 'Tata Motors', country: 'India', status: 'ACTIVE' },
    });
  }

  let modelSigna = await prisma.truckModel.findFirst({ where: { manufacturerId: mfrTata.id, name: 'Tata Signa 4825.TK' } });
  if (!modelSigna) {
    modelSigna = await prisma.truckModel.create({
      data: { manufacturerId: mfrTata.id, name: 'Tata Signa 4825.TK', category: 'Heavy Tipper', status: 'ACTIVE' },
    });
  }

  let variantSigna = await prisma.truckVariant.findFirst({ where: { modelId: modelSigna.id, name: 'Tata Signa 4825.TK 10x4 Tipper' } });
  if (!variantSigna) {
    variantSigna = await prisma.truckVariant.create({
      data: {
        modelId: modelSigna.id,
        name: 'Tata Signa 4825.TK 10x4 Tipper',
        engineDetails: 'Cummins ISBe 6.7L BS6 Phase 2',
        horsepower: 250,
        fuelType: 'DIESEL',
        payload: 29000,
        basePrice: 5200000,
        status: 'ACTIVE',
      },
    });
  }

  let modelPrima = await prisma.truckModel.findFirst({ where: { manufacturerId: mfrTata.id, name: 'Tata Prima 5530.S' } });
  if (!modelPrima) {
    modelPrima = await prisma.truckModel.create({
      data: { manufacturerId: mfrTata.id, name: 'Tata Prima 5530.S', category: 'Prime Mover Trailer', status: 'ACTIVE' },
    });
  }

  let variantPrima = await prisma.truckVariant.findFirst({ where: { modelId: modelPrima.id, name: 'Tata Prima 5530.S 4x2 Tractor' } });
  if (!variantPrima) {
    variantPrima = await prisma.truckVariant.create({
      data: {
        modelId: modelPrima.id,
        name: 'Tata Prima 5530.S 4x2 Tractor',
        engineDetails: 'Cummins ISBe 6.7L 300HP',
        horsepower: 300,
        fuelType: 'DIESEL',
        payload: 35000,
        basePrice: 4200000,
        status: 'ACTIVE',
      },
    });
  }

  // Ashok Leyland Manufacturer & Models
  let mfrAshok = await prisma.manufacturer.findFirst({ where: { name: 'Ashok Leyland' } });
  if (!mfrAshok) {
    mfrAshok = await prisma.manufacturer.create({
      data: { name: 'Ashok Leyland', country: 'India', status: 'ACTIVE' },
    });
  }

  let modelAvtr = await prisma.truckModel.findFirst({ where: { manufacturerId: mfrAshok.id, name: 'AVTR 5525.T' } });
  if (!modelAvtr) {
    modelAvtr = await prisma.truckModel.create({
      data: { manufacturerId: mfrAshok.id, name: 'AVTR 5525.T', category: 'Heavy Haulage', status: 'ACTIVE' },
    });
  }

  let variantAvtr = await prisma.truckVariant.findFirst({ where: { modelId: modelAvtr.id, name: 'AVTR 5525.T 4x2 Cowl & Chassis' } });
  if (!variantAvtr) {
    variantAvtr = await prisma.truckVariant.create({
      data: {
        modelId: modelAvtr.id,
        name: 'AVTR 5525.T 4x2 Cowl & Chassis',
        engineDetails: 'H-Series 6-Cylinder i-Gen6',
        horsepower: 250,
        fuelType: 'DIESEL',
        payload: 32000,
        basePrice: 3850000,
        status: 'ACTIVE',
      },
    });
  }

  let modelBadaDost = await prisma.truckModel.findFirst({ where: { manufacturerId: mfrAshok.id, name: 'Bada Dost' } });
  if (!modelBadaDost) {
    modelBadaDost = await prisma.truckModel.create({
      data: { manufacturerId: mfrAshok.id, name: 'Bada Dost', category: 'LCV Commercial', status: 'ACTIVE' },
    });
  }

  let variantBadaDost = await prisma.truckVariant.findFirst({ where: { modelId: modelBadaDost.id, name: 'Bada Dost i4 High Deck' } });
  if (!variantBadaDost) {
    variantBadaDost = await prisma.truckVariant.create({
      data: {
        modelId: modelBadaDost.id,
        name: 'Bada Dost i4 High Deck',
        engineDetails: '1.5L Turbo Charged Diesel',
        horsepower: 80,
        fuelType: 'DIESEL',
        payload: 1860,
        basePrice: 875000,
        status: 'ACTIVE',
      },
    });
  }

  // 6. MASTER PARTS CATALOGUE
  let partBrake = await prisma.part.findFirst({ where: { partNumber: 'PART-BRK-HD-01' } });
  if (!partBrake) {
    partBrake = await prisma.part.create({
      data: { partNumber: 'PART-BRK-HD-01', name: 'Heavy Duty S-Cam Brake Lining Kit', category: 'BRAKES', unitPrice: 3850 },
    });
  }
  let partFuelFilter = await prisma.part.findFirst({ where: { partNumber: 'PART-FLT-PR-02' } });
  if (!partFuelFilter) {
    partFuelFilter = await prisma.part.create({
      data: { partNumber: 'PART-FLT-PR-02', name: 'Primary High-Flow Fuel Filter Element', category: 'FILTERS', unitPrice: 1250 },
    });
  }

  // 7. HELPER: CREATE USER & EMPLOYEE
  async function createBranchStaff(email, phone, firstName, lastName, designation, branchId, roleNames) {
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        accountType: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    const empCode = `EMP-${branchId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        branchId,
        employeeCode: empCode,
        firstName,
        lastName,
        designation,
        status: 'ACTIVE',
      },
    });

    for (const rName of roleNames) {
      if (roleMap[rName]) {
        await prisma.employeeRoleAssignment.create({
          data: {
            employeeId: employee.id,
            roleId: roleMap[rName],
          },
        });
      }
    }

    return { user, employee };
  }

  // Helper: Create Fleet Customer
  async function createFleetCustomer(name, email, phone, companyName, gstin, pan, branchId, franchiseId) {
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name,
        email,
        phone,
        companyName,
        customerType: 'BUSINESS',
        gstin,
        pan,
        status: 'ACTIVE',
        preferredBranchId: branchId,
      },
    });

    await prisma.customerFranchise.create({
      data: {
        customerId: customer.id,
        franchiseId,
      },
    });

    return { user, customer };
  }

  // ==========================================
  // 8. POPULATE BRANCH 1: TATA MOTORS — UDAIPUR
  // ==========================================
  console.log('\n--- STEP 5: POPULATING TATA MOTORS — UDAIPUR DATASET ---');

  // Staff
  const tataFranchiseAdmin = await createBranchStaff('franchise.tata@titanauto.com', '+919829000101', 'Karan', 'Singh', 'Franchise Director', branchUdaipur.id, ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER']);
  const tataBM = await createBranchStaff('bm.udaipur@titanauto.com', '+919829000102', 'Bhanwar', 'Rathore', 'General Branch Manager', branchUdaipur.id, ['BRANCH_MANAGER']);
  const tataSales = await createBranchStaff('sales.udaipur@titanauto.com', '+919829000103', 'Vikram', 'Mehta', 'Senior Fleet Sales Executive', branchUdaipur.id, ['SALES_EMPLOYEE']);
  const tataAdvisor = await createBranchStaff('advisor.udaipur@titanauto.com', '+919829000104', 'Mahesh', 'Sharma', 'Commercial Workshop Advisor', branchUdaipur.id, ['SERVICE_ADVISOR']);
  const tataMechanic = await createBranchStaff('mechanic.udaipur@titanauto.com', '+919829000105', 'Rajesh', 'Kumawat', 'Certified Master Technician', branchUdaipur.id, ['MECHANIC']);

  // Customers
  const udrCustomer1 = await createFleetCustomer('Mewar Mining & Infra Logistics', 'mewar.mining@fleet.in', '+919829111001', 'Mewar Mining Pvt Ltd', '08AAACM1234N1Z2', 'AAACM1234N', branchUdaipur.id, franchiseTata.id);
  const udrCustomer2 = await createFleetCustomer('Udaipur Marble Carriers', 'udaipur.marble@fleet.in', '+919829111002', 'Udaipur Marble Carriers Ltd', '08AAACU5678Q1Z4', 'AAACU5678Q', branchUdaipur.id, franchiseTata.id);

  // 2 Vehicles
  const udrVeh1 = await prisma.vehicle.create({
    data: {
      vin: 'MAT782011UDR00101',
      engineNumber: 'ENG-TATA-UDR-00101',
      variantId: variantSigna.id,
      branchId: branchUdaipur.id,
      status: 'IN_STOCK',
      manufacturingYear: 2026,
      color: 'Oxford Blue',
      baseCost: 4600000,
      sellingPrice: 5350000,
    },
  });

  const udrVeh2 = await prisma.vehicle.create({
    data: {
      vin: 'MAT782012UDR00102',
      engineNumber: 'ENG-TATA-UDR-00102',
      variantId: variantPrima.id,
      branchId: branchUdaipur.id,
      status: 'RESERVED',
      manufacturingYear: 2026,
      color: 'Arctic White',
      baseCost: 3750000,
      sellingPrice: 4350000,
    },
  });

  // 2 Leads with Activities & Follow-ups
  const udrLead1 = await prisma.lead.create({
    data: {
      leadNumber: 'LD-UDR-2026-001',
      prospectName: 'Pradeep Gehlot',
      companyName: 'Mewar Mining & Infra Logistics',
      customerId: udrCustomer1.customer.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      assignedEmployeeId: tataSales.employee.id,
      status: 'QUALIFIED',
      priority: 'HIGH',
      interestedModel: 'Tata Signa 4825.TK',
      expectedBudget: 10700000,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: udrLead1.id,
      employeeId: tataSales.employee.id,
      activityType: 'CALL',
      title: 'Fleet Expansion Requirement Discussion',
      description: 'Client requires 2 heavy tippers for new limestone mining concession near Rajsamand.',
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: udrLead1.id,
      employeeId: tataSales.employee.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Deliver pro-forma quotation and finance interest rate comparison.',
      status: 'PENDING',
    },
  });

  const udrLead2 = await prisma.lead.create({
    data: {
      leadNumber: 'LD-UDR-2026-002',
      prospectName: 'Suresh Sisodia',
      companyName: 'Udaipur Marble Carriers',
      customerId: udrCustomer2.customer.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      assignedEmployeeId: tataSales.employee.id,
      status: 'CONTACTED',
      priority: 'MEDIUM',
      interestedModel: 'Tata Prima 5530.S',
      expectedBudget: 4350000,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: udrLead2.id,
      employeeId: tataSales.employee.id,
      activityType: 'MEETING',
      title: 'Yard Inspection and Trailer Capacity Verification',
      description: 'Inspected existing 10-wheeler fleet. Recommended 5530.S 4x2 prime mover for marble block transit.',
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: udrLead2.id,
      employeeId: tataSales.employee.id,
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'Schedule demo vehicle inspection at Sukher dealership yard.',
      status: 'PENDING',
    },
  });

  // 2 Quotations
  const udrQuote1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-UDR-001',
      customerId: udrCustomer1.customer.id,
      leadId: udrLead1.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      salespersonEmployeeId: tataSales.employee.id,
      createdByUserId: tataSales.user.id,
      variantId: variantSigna.id,
      quantity: 1,
      unitBasePrice: 4179687,
      subtotal: 4179687,
      gstRate: 28.0,
      gstAmount: 1170313,
      totalAmount: 5350000,
      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      notes: 'Approved with dealer comprehensive warranty package and roadside assistance.',
    },
  });

  const udrQuote2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-UDR-002',
      customerId: udrCustomer2.customer.id,
      leadId: udrLead2.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      salespersonEmployeeId: tataSales.employee.id,
      createdByUserId: tataSales.user.id,
      variantId: variantPrima.id,
      quantity: 1,
      unitBasePrice: 3398437,
      subtotal: 3398437,
      gstRate: 28.0,
      gstAmount: 951563,
      totalAmount: 4350000,
      validityDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'SUBMITTED',
      notes: 'Submitted for manager review with festive body-building subsidy.',
    },
  });

  // 2 Bookings & Allocations
  const udrBooking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-UDR-001',
      customerId: udrCustomer1.customer.id,
      quotationId: udrQuote1.id,
      vehicleId: udrVeh2.id,
      branchId: branchUdaipur.id,
      salespersonEmployeeId: tataSales.employee.id,
      bookingAmount: 500000,
      totalAmount: 5350000,
      status: 'CONFIRMED',
      bookingDate: new Date(),
    },
  });

  await prisma.vehicleAllocation.create({
    data: {
      bookingId: udrBooking1.id,
      vehicleId: udrVeh2.id,
      allocatedByUserId: tataSales.user.id,
      previousVehicleStatus: 'IN_STOCK',
      notes: 'Allocated for confirmed booking',
    },
  });

  const udrBooking2 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-UDR-002',
      customerId: udrCustomer2.customer.id,
      quotationId: udrQuote2.id,
      branchId: branchUdaipur.id,
      salespersonEmployeeId: tataSales.employee.id,
      bookingAmount: 200000,
      totalAmount: 4350000,
      status: 'PENDING',
      bookingDate: new Date(),
    },
  });

  // 2 Invoices & Payments
  const udrInv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-UDR-001',
      customerId: udrCustomer1.customer.id,
      bookingId: udrBooking1.id,
      vehicleId: udrVeh2.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      billingAddress: 'Sukher Industrial Area, Udaipur, Rajasthan',
      gstin: '08AAACM1234N1Z2',
      subtotal: 390625,
      taxableAmount: 390625,
      cgstAmount: 54687.5,
      sgstAmount: 54687.5,
      totalAmount: 500000,
      status: 'ISSUED',
      paymentStatus: 'PAID',
      issuedAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: udrBooking1.id,
      invoiceId: udrInv1.id,
      gateway: 'BANK_TRANSFER',
      gatewayPaymentId: 'NEFT-UDR-2026-001',
      amount: 500000,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RTGS',
      paidAt: new Date(),
    },
  });

  const udrInv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-UDR-002',
      customerId: udrCustomer2.customer.id,
      bookingId: udrBooking2.id,
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      billingAddress: 'Udaipur Marble Market, Amberi, Udaipur',
      gstin: '08AAACU5678Q1Z4',
      subtotal: 781250,
      taxableAmount: 781250,
      cgstAmount: 109375,
      sgstAmount: 109375,
      totalAmount: 1000000,
      status: 'ISSUED',
      paymentStatus: 'PARTIALLY_PAID',
      issuedAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: udrBooking2.id,
      invoiceId: udrInv2.id,
      gateway: 'CHEQUE',
      gatewayPaymentId: 'CHQ-UDR-481920',
      amount: 300000,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'CHEQUE_CLEARING',
      paidAt: new Date(),
    },
  });

  // Insurance & Vehicle Finance (Udaipur)
  await prisma.insurancePolicy.create({
    data: {
      policyNumber: 'POL-UDR-2026-001',
      customerId: udrCustomer1.customer.id,
      bookingId: udrBooking1.id,
      vehicleId: udrVeh2.id,
      insurer: 'Tata AIG General Insurance',
      policyType: 'Comprehensive Commercial Fleet',
      premium: 85000,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      coverageDetails: 'Zero depreciation, engine protect, 3rd party liability up to 50 Lakhs',
      isManual: false,
    },
  });

  const udrFinApp = await prisma.financeApplication.create({
    data: {
      applicationNumber: 'FIN-UDR-2026-001',
      customerId: udrCustomer1.customer.id,
      bookingId: udrBooking1.id,
      vehicleId: udrVeh2.id,
      financeProvider: 'Tata Motors Finance Limited',
      loanAmount: 4000000,
      downPayment: 1350000,
      vehiclePrice: 5350000,
      tenureMonths: 48,
      interestRate: 9.25,
      interestMethod: 'REDUCING_BALANCE',
      emiAmount: 99980,
      status: 'APPROVED',
      firstEmiDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isManual: false,
      remarks: 'Sanctioned against fleet operator GST turnover evaluation',
    },
  });

  await prisma.financeEmiSchedule.createMany({
    data: [
      {
        financeApplicationId: udrFinApp.id,
        installmentNumber: 1,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        emiAmount: 99980,
        principalComponent: 69147,
        interestComponent: 30833,
        paidAmount: 0,
        status: 'UPCOMING',
      },
      {
        financeApplicationId: udrFinApp.id,
        installmentNumber: 2,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        emiAmount: 99980,
        principalComponent: 69680,
        interestComponent: 30300,
        paidAmount: 0,
        status: 'UPCOMING',
      },
    ],
  });

  // 2 Service Appointments & Service Jobs
  const udrApt1 = await prisma.serviceAppointment.create({
    data: {
      appointmentNumber: 'APT-2026-UDR-001',
      customerId: udrCustomer1.customer.id,
      vehicleId: udrVeh1.id,
      branchId: branchUdaipur.id,
      serviceAdvisorId: tataAdvisor.employee.id,
      requestedService: 'Periodic 40,000 km Major Maintenance',
      preferredDate: new Date(),
      status: 'CONFIRMED',
    },
  });

  const udrJob1 = await prisma.serviceJob.create({
    data: {
      jobNumber: 'JOB-2026-UDR-001',
      appointmentId: udrApt1.id,
      customerId: udrCustomer1.customer.id,
      vehicleId: udrVeh1.id,
      branchId: branchUdaipur.id,
      serviceAdvisorId: tataAdvisor.employee.id,
      assignedMechanicId: tataMechanic.employee.id,
      complaint: 'Heavy brake pedal vibration and reduced retarder braking efficiency',
      status: 'IN_PROGRESS',
      odometer: 38450,
      fuelLevel: '75%',
      estimatedCost: 14500,
    },
  });

  await prisma.serviceDiagnosis.create({
    data: {
      serviceJobId: udrJob1.id,
      mechanicId: tataMechanic.employee.id,
      findings: 'Front axle S-cam brake lining worn down past 3mm indicator groove.',
      recommendedWork: 'Replace brake lining kit on front and rear tandem axles.',
      severity: 'HIGH',
      notes: 'Diagnostic Code: BRK-WORN-04',
    },
  });

  await prisma.serviceLabour.create({
    data: {
      serviceJobId: udrJob1.id,
      labourType: 'MECHANICAL',
      description: 'Axle hub removal and brake lining re-shoeing',
      hours: 4.5,
      hourlyRate: 800,
      totalAmount: 3600,
    },
  });

  const udrApt2 = await prisma.serviceAppointment.create({
    data: {
      appointmentNumber: 'APT-2026-UDR-002',
      customerId: udrCustomer2.customer.id,
      vehicleId: udrVeh2.id,
      branchId: branchUdaipur.id,
      serviceAdvisorId: tataAdvisor.employee.id,
      requestedService: 'Transmission Oil Flush and Primary Filter Swap',
      preferredDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  const udrJob2 = await prisma.serviceJob.create({
    data: {
      jobNumber: 'JOB-2026-UDR-002',
      appointmentId: udrApt2.id,
      customerId: udrCustomer2.customer.id,
      vehicleId: udrVeh2.id,
      branchId: branchUdaipur.id,
      serviceAdvisorId: tataAdvisor.employee.id,
      assignedMechanicId: tataMechanic.employee.id,
      complaint: 'Routine pre-dispatch oil replacement and primary filter swap',
      status: 'COMPLETED',
      odometer: 1200,
      actualCost: 6500,
      actualCompletionTime: new Date(),
    },
  });

  // 2 Spare Parts Stocks & Movements
  const udrStock1 = await prisma.partStock.create({
    data: {
      branchId: branchUdaipur.id,
      partId: partBrake.id,
      quantityOnHand: 24,
      reorderThreshold: 6,
    },
  });

  await prisma.partStockMovement.create({
    data: {
      partStockId: udrStock1.id,
      movementType: 'PURCHASE',
      quantity: 24,
      referenceRef: 'PO-UDR-2026-081',
      notes: 'Initial OEM batch receipt from Pune Plant.',
    },
  });

  const udrStock2 = await prisma.partStock.create({
    data: {
      branchId: branchUdaipur.id,
      partId: partFuelFilter.id,
      quantityOnHand: 40,
      reorderThreshold: 10,
    },
  });

  // 2 Compliance Documents
  await prisma.vehicleComplianceDocument.create({
    data: {
      vehicleId: udrVeh1.id,
      documentType: 'PUC',
      documentNumber: 'PUC-RJ27-2026-00481',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: 'VALID',
    },
  });

  await prisma.vehicleComplianceDocument.create({
    data: {
      vehicleId: udrVeh2.id,
      documentType: 'FITNESS_CERTIFICATE',
      documentNumber: 'FIT-RJ27-2026-00912',
      issueDate: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Expiring in 20 days
      status: 'VALID',
    },
  });

  // 2 Marketing Campaigns & Expenses
  const udrCamp1 = await prisma.campaign.create({
    data: {
      name: 'Mewar Mining Fleet Conclave 2026',
      description: 'Customer meet and product showcase for mining transporters',
      location: 'Hotel Radisson Blu, Udaipur',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      coordinatorId: tataSales.employee.id,
      budget: 150000,
      status: 'ACTIVE',
    },
  });

  await prisma.campaignExpense.create({
    data: {
      campaignId: udrCamp1.id,
      title: 'Conference Hall & Audio-Visual Equipment Rental',
      amount: 45000,
      category: 'VENUE',
      expenseDate: new Date(),
    },
  });

  await prisma.campaignMember.create({
    data: {
      campaignId: udrCamp1.id,
      employeeId: tataSales.employee.id,
      roleInCamp: 'Lead Presenter & Product Specialist',
    },
  });

  const udrCamp2 = await prisma.campaign.create({
    data: {
      name: 'Sukher Highway Truckers Safety & Mileage Clinic',
      description: 'Highway clinic and free inspection camp',
      location: 'NH-8 Highway Toll Plaza, Sukher',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      franchiseId: franchiseTata.id,
      branchId: branchUdaipur.id,
      coordinatorId: tataAdvisor.employee.id,
      budget: 80000,
      status: 'UPCOMING',
    },
  });

  await prisma.campaignExpense.create({
    data: {
      campaignId: udrCamp2.id,
      title: 'Roadside Canopy & Banner Printing',
      amount: 12000,
      category: 'PROMOTION',
      expenseDate: new Date(),
    },
  });

  // 2 Announcements
  const udrAnn1 = await prisma.announcement.create({
    data: {
      title: 'Tata Commercial Signa Heavy Tipper Delivery Schedule',
      content: 'All dealership sales advisors must ensure RTO Form 20 and temporary permit filings are finalized 48 hours prior to quarry dispatch.',
      category: 'OPERATIONS',
      priority: 'HIGH',
      status: 'PUBLISHED',
      targetAudience: 'BRANCH',
      branchId: branchUdaipur.id,
      franchiseId: franchiseTata.id,
      authorUserId: tataBM.user.id,
      authorName: 'Bhanwar Rathore',
      authorRole: 'Branch Manager',
      publishedAt: new Date(),
    },
  });

  await prisma.announcementRead.create({
    data: {
      announcementId: udrAnn1.id,
      userId: tataSales.user.id,
      readAt: new Date(),
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Udaipur Bay #3 Hydraulic Lift Calibration Completed',
      content: 'Service bay lift certified for 55-ton gross load capacity. Heavy tipper maintenance may proceed at normal throughput.',
      category: 'SERVICE',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      targetAudience: 'BRANCH',
      branchId: branchUdaipur.id,
      franchiseId: franchiseTata.id,
      authorUserId: tataAdvisor.user.id,
      authorName: 'Mahesh Sharma',
      authorRole: 'Service Advisor',
      publishedAt: new Date(),
    },
  });

  // 2 Customer Reminders
  await prisma.customerReminder.create({
    data: {
      customerId: udrCustomer1.customer.id,
      vehicleId: udrVeh1.id,
      branchId: branchUdaipur.id,
      category: 'SERVICE_DUE',
      recipientName: 'Pradeep Gehlot',
      recipientPhone: '+919829111001',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      draftMessage: 'Dear Pradeep Gehlot, your Tata Signa 4825.TK tipper is due for periodic 40,000 km service. Contact Tata Motors Udaipur at +91 294 2441100 to reserve your workshop bay.',
      status: 'PREPARED',
    },
  });

  await prisma.customerReminder.create({
    data: {
      customerId: udrCustomer2.customer.id,
      vehicleId: udrVeh2.id,
      branchId: branchUdaipur.id,
      category: 'COMPLIANCE_EXPIRY',
      recipientName: 'Suresh Sisodia',
      recipientPhone: '+919829111002',
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      draftMessage: 'Dear Suresh Sisodia, commercial vehicle fitness certificate for your Tata Prima trailer expires in 20 days. Visit Tata Motors Udaipur RTO desk for renewal assistance.',
      status: 'USER_INITIATED',
      initiatedAt: new Date(),
    },
  });

  // ==========================================
  // 9. POPULATE BRANCH 2: ASHOK LEYLAND — JAIPUR
  // ==========================================
  console.log('\n--- STEP 6: POPULATING ASHOK LEYLAND — JAIPUR DATASET ---');

  // Staff
  const ashokFranchiseAdmin = await createBranchStaff('franchise.ashok@titanauto.com', '+919829000201', 'Anand', 'Agrawal', 'Franchise Partner', branchJaipur.id, ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER']);
  const ashokBM = await createBranchStaff('bm.jaipur@titanauto.com', '+919829000202', 'Devendra', 'Shekhawat', 'Senior Branch Manager', branchJaipur.id, ['BRANCH_MANAGER']);
  const ashokSales = await createBranchStaff('sales.jaipur@titanauto.com', '+919829000203', 'Aman', 'Khandelwal', 'Senior Fleet Sales Executive', branchJaipur.id, ['SALES_EMPLOYEE']);
  const ashokAdvisor = await createBranchStaff('advisor.jaipur@titanauto.com', '+919829000204', 'Dinesh', 'Verma', 'Commercial Service Advisor', branchJaipur.id, ['SERVICE_ADVISOR']);
  const ashokMechanic = await createBranchStaff('mechanic.jaipur@titanauto.com', '+919829000205', 'Ramesh', 'Saini', 'Lead Heavy Truck Mechanic', branchJaipur.id, ['MECHANIC']);

  // Customers
  const jaiCustomer1 = await createFleetCustomer('Jaipur Express Cargo Carriers', 'jaipur.cargo@fleet.in', '+919829222001', 'Jaipur Express Cargo Pvt Ltd', '08AAACJ9012K1Z8', 'AAACJ9012K', branchJaipur.id, franchiseAshok.id);
  const jaiCustomer2 = await createFleetCustomer('Pink City Transport & Logistics', 'pinkcity.transport@fleet.in', '+919829222002', 'Pink City Transport LLP', '08AAACP3456L1Z9', 'AAACP3456L', branchJaipur.id, franchiseAshok.id);

  // 2 Vehicles
  const jaiVeh1 = await prisma.vehicle.create({
    data: {
      vin: 'MAL881021JAI00201',
      engineNumber: 'ENG-AL-JAI-00201',
      variantId: variantAvtr.id,
      branchId: branchJaipur.id,
      status: 'IN_STOCK',
      manufacturingYear: 2026,
      color: 'Signal Red',
      baseCost: 3350000,
      sellingPrice: 3950000,
    },
  });

  const jaiVeh2 = await prisma.vehicle.create({
    data: {
      vin: 'MAL881022JAI00202',
      engineNumber: 'ENG-AL-JAI-00202',
      variantId: variantBadaDost.id,
      branchId: branchJaipur.id,
      status: 'RESERVED',
      manufacturingYear: 2026,
      color: 'Casablanca White',
      baseCost: 760000,
      sellingPrice: 910000,
    },
  });

  // 2 Leads with Activities & Follow-ups
  const jaiLead1 = await prisma.lead.create({
    data: {
      leadNumber: 'LD-JAI-2026-001',
      prospectName: 'Harish Choudhary',
      companyName: 'Jaipur Express Cargo Carriers',
      customerId: jaiCustomer1.customer.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      assignedEmployeeId: ashokSales.employee.id,
      status: 'QUALIFIED',
      priority: 'HIGH',
      interestedModel: 'AVTR 5525.T',
      expectedBudget: 7900000,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: jaiLead1.id,
      employeeId: ashokSales.employee.id,
      activityType: 'CALL',
      title: 'Highway Route Feasibility and Payload Assessment',
      description: 'Customer plans to deploy 2 units of AVTR 5525.T on Delhi-Jaipur-Ahmedabad Golden Quadrilateral corridor.',
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: jaiLead1.id,
      employeeId: ashokSales.employee.id,
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'Finalize quotation approval with bulk discount and AMC bundle.',
      status: 'PENDING',
    },
  });

  const jaiLead2 = await prisma.lead.create({
    data: {
      leadNumber: 'LD-JAI-2026-002',
      prospectName: 'Mukesh Sharma',
      companyName: 'Pink City Transport & Logistics',
      customerId: jaiCustomer2.customer.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      assignedEmployeeId: ashokSales.employee.id,
      status: 'CONTACTED',
      priority: 'MEDIUM',
      interestedModel: 'Bada Dost',
      expectedBudget: 1820000,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: jaiLead2.id,
      employeeId: ashokSales.employee.id,
      activityType: 'TEST_DRIVE',
      title: 'City Intra-Hub Test Drive with Full Load',
      description: 'Completed 25 km test run across VKI Area and Transport Nagar with 1.8 ton sand bags. Customer satisfied with power.',
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: jaiLead2.id,
      employeeId: ashokSales.employee.id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Present commercial vehicle loan options and EMI plans.',
      status: 'PENDING',
    },
  });

  // 2 Quotations
  const jaiQuote1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-JAI-001',
      customerId: jaiCustomer1.customer.id,
      leadId: jaiLead1.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      salespersonEmployeeId: ashokSales.employee.id,
      createdByUserId: ashokSales.user.id,
      variantId: variantAvtr.id,
      quantity: 1,
      unitBasePrice: 3085938,
      subtotal: 3085938,
      gstRate: 28.0,
      gstAmount: 864062,
      totalAmount: 3950000,
      validityDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      notes: 'Approved with Ashok Leyland i-Alert telematics subscription for 2 years.',
    },
  });

  const jaiQuote2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-JAI-002',
      customerId: jaiCustomer2.customer.id,
      leadId: jaiLead2.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      salespersonEmployeeId: ashokSales.employee.id,
      createdByUserId: ashokSales.user.id,
      variantId: variantBadaDost.id,
      quantity: 1,
      unitBasePrice: 710938,
      subtotal: 710938,
      gstRate: 28.0,
      gstAmount: 199062,
      totalAmount: 910000,
      validityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'SUBMITTED',
      notes: 'Submitted for manager approval with cabin air conditioning option.',
    },
  });

  // 2 Bookings & Allocations
  const jaiBooking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-JAI-001',
      customerId: jaiCustomer1.customer.id,
      quotationId: jaiQuote1.id,
      vehicleId: jaiVeh2.id,
      branchId: branchJaipur.id,
      salespersonEmployeeId: ashokSales.employee.id,
      bookingAmount: 500000,
      totalAmount: 3950000,
      status: 'CONFIRMED',
      bookingDate: new Date(),
    },
  });

  await prisma.vehicleAllocation.create({
    data: {
      bookingId: jaiBooking1.id,
      vehicleId: jaiVeh2.id,
      allocatedByUserId: ashokSales.user.id,
      previousVehicleStatus: 'IN_STOCK',
      notes: 'Allocated for confirmed booking',
    },
  });

  const jaiBooking2 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-JAI-002',
      customerId: jaiCustomer2.customer.id,
      quotationId: jaiQuote2.id,
      branchId: branchJaipur.id,
      salespersonEmployeeId: ashokSales.employee.id,
      bookingAmount: 100000,
      totalAmount: 910000,
      status: 'PENDING',
      bookingDate: new Date(),
    },
  });

  // 2 Invoices & Payments
  const jaiInv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-JAI-001',
      customerId: jaiCustomer1.customer.id,
      bookingId: jaiBooking1.id,
      vehicleId: jaiVeh2.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      billingAddress: 'Agra Road Transport Nagar, Jaipur, Rajasthan',
      gstin: '08AAACJ9012K1Z8',
      subtotal: 390625,
      taxableAmount: 390625,
      cgstAmount: 54687.5,
      sgstAmount: 54687.5,
      totalAmount: 500000,
      status: 'ISSUED',
      paymentStatus: 'PAID',
      issuedAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: jaiBooking1.id,
      invoiceId: jaiInv1.id,
      gateway: 'BANK_TRANSFER',
      gatewayPaymentId: 'RTGS-JAI-2026-8801',
      amount: 500000,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RTGS',
      paidAt: new Date(),
    },
  });

  const jaiInv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-JAI-002',
      customerId: jaiCustomer2.customer.id,
      bookingId: jaiBooking2.id,
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      billingAddress: 'VKI Area Road No 9, Jaipur, Rajasthan',
      gstin: '08AAACP3456L1Z9',
      subtotal: 625000,
      taxableAmount: 625000,
      cgstAmount: 87500,
      sgstAmount: 87500,
      totalAmount: 800000,
      status: 'ISSUED',
      paymentStatus: 'PARTIALLY_PAID',
      issuedAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: jaiBooking2.id,
      invoiceId: jaiInv2.id,
      gateway: 'CHEQUE',
      gatewayPaymentId: 'CHQ-JAI-192837',
      amount: 250000,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'CHEQUE_CLEARING',
      paidAt: new Date(),
    },
  });

  // Insurance & Vehicle Finance (Jaipur)
  await prisma.insurancePolicy.create({
    data: {
      policyNumber: 'POL-JAI-2026-001',
      customerId: jaiCustomer1.customer.id,
      bookingId: jaiBooking1.id,
      vehicleId: jaiVeh2.id,
      insurer: 'ICICI Lombard Commercial',
      policyType: 'Commercial Goods Carrier Comprehensive',
      premium: 62000,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      coverageDetails: 'Bumper-to-bumper commercial cover, towing assistance up to 100km',
      isManual: false,
    },
  });

  const jaiFinApp = await prisma.financeApplication.create({
    data: {
      applicationNumber: 'FIN-JAI-2026-001',
      customerId: jaiCustomer1.customer.id,
      bookingId: jaiBooking1.id,
      vehicleId: jaiVeh2.id,
      financeProvider: 'Cholamandalam Investment and Finance',
      loanAmount: 3000000,
      downPayment: 950000,
      vehiclePrice: 3950000,
      tenureMonths: 36,
      interestRate: 9.5,
      interestMethod: 'REDUCING_BALANCE',
      emiAmount: 96115,
      status: 'DISBURSED',
      firstEmiDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isManual: false,
      remarks: 'Disbursed directly to dealership commercial escrow account',
    },
  });

  await prisma.financeEmiSchedule.createMany({
    data: [
      {
        financeApplicationId: jaiFinApp.id,
        installmentNumber: 1,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        emiAmount: 96115,
        principalComponent: 72365,
        interestComponent: 23750,
        paidAmount: 0,
        status: 'UPCOMING',
      },
      {
        financeApplicationId: jaiFinApp.id,
        installmentNumber: 2,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        emiAmount: 96115,
        principalComponent: 72938,
        interestComponent: 23177,
        paidAmount: 0,
        status: 'UPCOMING',
      },
    ],
  });

  // 2 Service Appointments & Service Jobs
  const jaiApt1 = await prisma.serviceAppointment.create({
    data: {
      appointmentNumber: 'APT-2026-JAI-001',
      customerId: jaiCustomer1.customer.id,
      vehicleId: jaiVeh1.id,
      branchId: branchJaipur.id,
      serviceAdvisorId: ashokAdvisor.employee.id,
      requestedService: 'Periodic Maintenance and Air Brake Inspection',
      preferredDate: new Date(),
      status: 'CONFIRMED',
    },
  });

  const jaiJob1 = await prisma.serviceJob.create({
    data: {
      jobNumber: 'JOB-2026-JAI-001',
      appointmentId: jaiApt1.id,
      customerId: jaiCustomer1.customer.id,
      vehicleId: jaiVeh1.id,
      branchId: branchJaipur.id,
      serviceAdvisorId: ashokAdvisor.employee.id,
      assignedMechanicId: ashokMechanic.employee.id,
      complaint: 'Engine air intake check and air pressure valve diagnostic',
      status: 'IN_PROGRESS',
      odometer: 42100,
      fuelLevel: '50%',
      estimatedCost: 11000,
    },
  });

  await prisma.serviceDiagnosis.create({
    data: {
      serviceJobId: jaiJob1.id,
      mechanicId: ashokMechanic.employee.id,
      findings: 'Primary air dryer filter cartridge clogged with highway dust residue.',
      recommendedWork: 'Replace air dryer filter cartridge and perform pneumatic pressure bleed test.',
      severity: 'HIGH',
      notes: 'Diagnostic Code: PNEU-VALVE-02',
    },
  });

  await prisma.serviceLabour.create({
    data: {
      serviceJobId: jaiJob1.id,
      labourType: 'MECHANICAL',
      description: 'Air brake pneumatic diagnostic and valve servicing',
      hours: 3.5,
      hourlyRate: 800,
      totalAmount: 2800,
    },
  });

  const jaiApt2 = await prisma.serviceAppointment.create({
    data: {
      appointmentNumber: 'APT-2026-JAI-002',
      customerId: jaiCustomer2.customer.id,
      vehicleId: jaiVeh2.id,
      branchId: branchJaipur.id,
      serviceAdvisorId: ashokAdvisor.employee.id,
      requestedService: 'Suspension Leaf Spring Bushing Check',
      preferredDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  const jaiJob2 = await prisma.serviceJob.create({
    data: {
      jobNumber: 'JOB-2026-JAI-002',
      appointmentId: jaiApt2.id,
      customerId: jaiCustomer2.customer.id,
      vehicleId: jaiVeh2.id,
      branchId: branchJaipur.id,
      serviceAdvisorId: ashokAdvisor.employee.id,
      assignedMechanicId: ashokMechanic.employee.id,
      complaint: 'Rear suspension leaf spring squeak during load transit',
      status: 'COMPLETED',
      odometer: 14500,
      actualCost: 5200,
      actualCompletionTime: new Date(),
    },
  });

  // 2 Spare Parts Stocks & Movements
  const jaiStock1 = await prisma.partStock.create({
    data: {
      branchId: branchJaipur.id,
      partId: partBrake.id,
      quantityOnHand: 18,
      reorderThreshold: 5,
    },
  });

  await prisma.partStockMovement.create({
    data: {
      partStockId: jaiStock1.id,
      movementType: 'PURCHASE',
      quantity: 18,
      referenceRef: 'PO-JAI-2026-042',
      notes: 'Direct consignment receipt from Ennore Plant.',
    },
  });

  const jaiStock2 = await prisma.partStock.create({
    data: {
      branchId: branchJaipur.id,
      partId: partFuelFilter.id,
      quantityOnHand: 35,
      reorderThreshold: 8,
    },
  });

  // 2 Compliance Documents
  await prisma.vehicleComplianceDocument.create({
    data: {
      vehicleId: jaiVeh1.id,
      documentType: 'PUC',
      documentNumber: 'PUC-RJ14-2026-00388',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: 'VALID',
    },
  });

  await prisma.vehicleComplianceDocument.create({
    data: {
      vehicleId: jaiVeh2.id,
      documentType: 'FITNESS_CERTIFICATE',
      documentNumber: 'FIT-RJ14-2026-00741',
      issueDate: new Date(Date.now() - 345 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Expiring in 15 days
      status: 'VALID',
    },
  });

  // 2 Marketing Campaigns & Expenses
  const jaiCamp1 = await prisma.campaign.create({
    data: {
      name: 'Pink City Commercial Fleet Expo 2026',
      description: 'Expo and live commercial vehicle showcase',
      location: 'JECC Exhibition Ground, Sitapura, Jaipur',
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      coordinatorId: ashokSales.employee.id,
      budget: 200000,
      status: 'ACTIVE',
    },
  });

  await prisma.campaignExpense.create({
    data: {
      campaignId: jaiCamp1.id,
      title: 'Custom Pavillion Stall Fabrication & Power Supply',
      amount: 60000,
      category: 'STALL_SETUP',
      expenseDate: new Date(),
    },
  });

  await prisma.campaignMember.create({
    data: {
      campaignId: jaiCamp1.id,
      employeeId: ashokSales.employee.id,
      roleInCamp: 'Lead Commercial Vehicle Consultant',
    },
  });

  const jaiCamp2 = await prisma.campaign.create({
    data: {
      name: 'Agra Highway Transport Operators Mileage Clinic',
      description: 'Highway clinic for operators',
      location: 'Dausa Toll Plaza Rest Area, NH-21',
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      franchiseId: franchiseAshok.id,
      branchId: branchJaipur.id,
      coordinatorId: ashokAdvisor.employee.id,
      budget: 90000,
      status: 'UPCOMING',
    },
  });

  await prisma.campaignExpense.create({
    data: {
      campaignId: jaiCamp2.id,
      title: 'Refreshments & Free Driver Health Checkup Kits',
      amount: 15000,
      category: 'LOGISTICS',
      expenseDate: new Date(),
    },
  });

  // 2 Announcements
  const jaiAnn1 = await prisma.announcement.create({
    data: {
      title: 'Ashok Leyland AVTR i-Gen6 Mileage Telematics Advisory',
      content: 'Fleet customers operating on the Delhi-Mumbai Expressway must activate real-time DEF consumption alerts through the customer portal.',
      category: 'OPERATIONS',
      priority: 'HIGH',
      status: 'PUBLISHED',
      targetAudience: 'BRANCH',
      branchId: branchJaipur.id,
      franchiseId: franchiseAshok.id,
      authorUserId: ashokBM.user.id,
      authorName: 'Devendra Shekhawat',
      authorRole: 'Branch Manager',
      publishedAt: new Date(),
    },
  });

  await prisma.announcementRead.create({
    data: {
      announcementId: jaiAnn1.id,
      userId: ashokSales.user.id,
      readAt: new Date(),
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Jaipur Dealership Express LCV Service Bay Launch',
      content: 'Dedicated fast-track servicing for Bada Dost and Dost vehicles operational from 8:00 AM to 8:00 PM on weekdays.',
      category: 'SERVICE',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      targetAudience: 'BRANCH',
      branchId: branchJaipur.id,
      franchiseId: franchiseAshok.id,
      authorUserId: ashokAdvisor.user.id,
      authorName: 'Dinesh Verma',
      authorRole: 'Service Advisor',
      publishedAt: new Date(),
    },
  });

  // 2 Customer Reminders
  await prisma.customerReminder.create({
    data: {
      customerId: jaiCustomer1.customer.id,
      vehicleId: jaiVeh1.id,
      branchId: branchJaipur.id,
      category: 'SERVICE_DUE',
      recipientName: 'Harish Choudhary',
      recipientPhone: '+919829222001',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      draftMessage: 'Dear Harish Choudhary, your Ashok Leyland AVTR 5525.T truck is due for scheduled 40,000 km air brake servicing. Contact Ashok Leyland Jaipur at +91 141 2618800.',
      status: 'PREPARED',
    },
  });

  await prisma.customerReminder.create({
    data: {
      customerId: jaiCustomer2.customer.id,
      vehicleId: jaiVeh2.id,
      branchId: branchJaipur.id,
      category: 'COMPLIANCE_EXPIRY',
      recipientName: 'Mukesh Sharma',
      recipientPhone: '+919829222002',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      draftMessage: 'Dear Mukesh Sharma, fitness certificate for your Bada Dost delivery vehicle expires in 15 days. Visit Ashok Leyland Jaipur service desk for renewal inspection.',
      status: 'USER_INITIATED',
      initiatedAt: new Date(),
    },
  });

  console.log('\n===============================================================');
  console.log('✅ CLEANUP AND SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===============================================================');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  prisma.$disconnect();
  process.exit(1);
});
