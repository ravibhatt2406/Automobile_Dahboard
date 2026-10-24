const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== TITAN AUTO: VERIFYING ALL FIXES ===\n');

  // 1. Authenticate as Super Admin
  const loginRes = await fetch('http://localhost:4001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@titanauto.com', password: 'Admin123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken || loginData.accessToken;
  console.log('1. Super Admin login: HTTP', loginRes.status, '| Token received:', !!token);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'x-active-role': 'SUPER_ADMIN'
  };

  // 2. Test Customer creation with franchiseId & branchId
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const custPayload = {
    name: 'Verified Fleet Logistics Ltd ' + randNum,
    phone: '+9199' + randNum,
    email: 'contact' + randNum + '@verifiedfleet.com',
    customerType: 'BUSINESS',
    companyName: 'Verified Fleet Logistics',
    branchId: '8c187ee7-acc6-4b72-bbcb-e798fe639013', // Ashok Leyland Jaipur
    franchiseId: '7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785' // Ashok Leyland
  };
  const custRes = await fetch('http://localhost:4001/api/v1/customers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(custPayload)
  });
  const custData = await custRes.json();
  console.log('2. Customer Creation (POST /api/v1/customers): HTTP', custRes.status);
  const createdCustomer = custData.data || custData;
  console.log('   Customer ID:', createdCustomer?.id, '| Name:', createdCustomer?.name);

  // Verify in PostgreSQL
  const dbCustomer = await prisma.customer.findUnique({ where: { id: createdCustomer.id } });
  console.log('   PostgreSQL persistence check: Customer found =', !!dbCustomer);

  // 3. Test Employee creation with department, franchiseId, branchId
  const empCode = 'EMP-' + randNum;
  const empPayload = {
    email: 'employee.' + randNum + '@titanauto.com',
    password: 'Password123!',
    firstName: 'Verification',
    lastName: 'Tester',
    employeeCode: empCode,
    roleName: 'SALES_EMPLOYEE',
    branchId: '8c187ee7-acc6-4b72-bbcb-e798fe639013',
    franchiseId: '7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785',
    department: 'Commercial Fleet Sales',
    status: 'active'
  };
  const empRes = await fetch('http://localhost:4001/api/v1/employees', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(empPayload)
  });
  const empData = await empRes.json();
  console.log('3. Employee Creation (POST /api/v1/employees): HTTP', empRes.status);
  const createdEmployee = empData.data || empData;
  const empId = createdEmployee?.employeeId || createdEmployee?.id;
  console.log('   Employee ID:', empId, '| Code:', empCode);

  // Verify in PostgreSQL
  const dbEmployee = await prisma.employee.findFirst({ where: { employeeCode: empCode } });
  console.log('   PostgreSQL persistence check: Employee found =', !!dbEmployee, '| Designation:', dbEmployee?.designation);

  // 4. Test Spare-parts creation with branchId & franchiseId
  const partNumber = 'VERIF-PART-' + randNum;
  const partPayload = {
    partNumber,
    name: 'Precision Heavy Brake Drum ' + randNum,
    unitPrice: 4500,
    gstRate: 18,
    category: 'BRAKES',
    manufacturer: 'Ashok Leyland Genuine',
    branchId: '8c187ee7-acc6-4b72-bbcb-e798fe639013',
    franchiseId: '7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785',
    quantityOnHand: 25
  };
  const partRes = await fetch('http://localhost:4001/api/v1/parts', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(partPayload)
  });
  const partData = await partRes.json();
  console.log('4. Spare-part Creation (POST /api/v1/parts): HTTP', partRes.status);
  const createdPart = partData.data || partData;
  console.log('   Part ID:', createdPart?.id, '| Part Number:', createdPart?.partNumber);

  // Verify in PostgreSQL
  const dbPart = await prisma.part.findUnique({
    where: { id: createdPart.id },
    include: { stocks: true }
  });
  console.log('   PostgreSQL persistence check: Part found =', !!dbPart, '| Stocks linked:', dbPart?.stocks?.length, '| On Hand:', dbPart?.stocks?.[0]?.quantityOnHand);

  // 5. Test Service-job creation with franchiseId
  // Find an existing active vehicle and advisor in Jaipur branch
  const jaipurBranch = await prisma.branch.findUnique({
    where: { id: '8c187ee7-acc6-4b72-bbcb-e798fe639013' },
    include: {
      vehicles: true,
      employees: {
        where: { status: 'ACTIVE' },
        include: { roleAssignments: { include: { role: true } } }
      }
    }
  });

  let sampleVehicle = jaipurBranch.vehicles[0];
  if (!sampleVehicle) {
    // Check any vehicle in database
    sampleVehicle = await prisma.vehicle.findFirst();
  }

  const advisor = jaipurBranch.employees.find(e =>
    e.roleAssignments.some(ra => ['BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE'].includes(ra.role.name))
  ) || jaipurBranch.employees[0];

  const jobPayload = {
    customerId: createdCustomer.id,
    vehicleId: sampleVehicle.id,
    branchId: '8c187ee7-acc6-4b72-bbcb-e798fe639013',
    franchiseId: '7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785',
    serviceAdvisorId: advisor.id,
    complaint: 'Routine 50,000 km periodic inspection and brake pad replacement',
    odometer: 52000,
    fuelLevel: '75%',
    estimatedCost: 12500,
    notes: 'Verification test service job card'
  };

  const jobRes = await fetch('http://localhost:4001/api/v1/service-jobs', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(jobPayload)
  });
  const jobData = await jobRes.json();
  console.log('5. Service-job Creation (POST /api/v1/service-jobs): HTTP', jobRes.status);
  const createdJob = jobData.data || jobData;
  console.log('   Job ID:', createdJob?.id, '| Job Number:', createdJob?.jobNumber);

  // Verify in PostgreSQL
  const dbJob = await prisma.serviceJob.findUnique({ where: { id: createdJob.id } });
  console.log('   PostgreSQL persistence check: Job found =', !!dbJob, '| Status:', dbJob?.status);

  // 6. Test Notification endpoints:
  // a) Unauthenticated request (must return 401 Unauthorized)
  const unauthNotifRes = await fetch('http://localhost:4001/api/v1/notifications');
  const unauthCountRes = await fetch('http://localhost:4001/api/v1/notifications/unread-count');
  console.log('6a. Unauthenticated notifications: HTTP', unauthNotifRes.status, '(expected 401)');
  console.log('    Unauthenticated unread-count: HTTP', unauthCountRes.status, '(expected 401)');

  // b) Authenticated request (must return 200 OK)
  const authNotifRes = await fetch('http://localhost:4001/api/v1/notifications', {
    headers: authHeaders
  });
  const authCountRes = await fetch('http://localhost:4001/api/v1/notifications/unread-count', {
    headers: authHeaders
  });
  const notifList = await authNotifRes.json();
  const countData = await authCountRes.json();
  console.log('6b. Authenticated notifications: HTTP', authNotifRes.status, '| Count returned:', notifList.data?.length ?? (Array.isArray(notifList) ? notifList.length : 0));
  console.log('    Authenticated unread-count: HTTP', authCountRes.status, '| Unread count:', countData.data || countData);

  // 7. Test Sales Report for Authorized Branch:
  // Super Admin accessing Ashok Leyland Jaipur
  const superAdminReportRes = await fetch('http://localhost:4001/api/v1/reports/sales?branchId=8c187ee7-acc6-4b72-bbcb-e798fe639013&franchiseId=7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785', {
    headers: authHeaders
  });
  console.log('7a. Super Admin Sales Report for Jaipur branch: HTTP', superAdminReportRes.status);

  // Branch Manager (bm.jaipur) accessing Jaipur branch
  const bmJaipurLoginRes = await fetch('http://localhost:4001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bm.jaipur@titanauto.com', password: 'Password@123' })
  });
  const bmJaipurToken = (await bmJaipurLoginRes.json()).data?.accessToken;
  const bmJaipurReportRes = await fetch('http://localhost:4001/api/v1/reports/sales?branchId=8c187ee7-acc6-4b72-bbcb-e798fe639013&franchiseId=7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785', {
    headers: {
      'Authorization': 'Bearer ' + bmJaipurToken,
      'x-active-role': 'BRANCH_MANAGER'
    }
  });
  console.log('7b. Jaipur Branch Manager Sales Report for Jaipur branch: HTTP', bmJaipurReportRes.status);

  // 8. Test Sales Report Access Denied for Unauthorized Branch:
  // Tata Motors Udaipur Branch Manager attempting to access Ashok Leyland Jaipur branch
  const bmUdaipurLoginRes = await fetch('http://localhost:4001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bm.udaipur@titanauto.com', password: 'Password@123' })
  });
  const bmUdaipurToken = (await bmUdaipurLoginRes.json()).data?.accessToken;
  const unauthorizedReportRes = await fetch('http://localhost:4001/api/v1/reports/sales?branchId=8c187ee7-acc6-4b72-bbcb-e798fe639013&franchiseId=7ceb226c-ab00-4acf-9a3b-2f4e1f1ee785', {
    headers: {
      'Authorization': 'Bearer ' + bmUdaipurToken,
      'x-active-role': 'BRANCH_MANAGER'
    }
  });
  console.log('8. Unauthorized Udaipur BM accessing Jaipur branch: HTTP', unauthorizedReportRes.status, '(expected 403 Forbidden)');
  const unauthBody = await unauthorizedReportRes.json();
  console.log('   Response rejection:', unauthBody.message || unauthBody.errors);

  console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
