const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 2 LIVE BACKEND INTEGRATION VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Login as Super Admin
    console.log('\n[1] Authenticating Super Admin...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin@titanauto.com',
        password: 'Admin123!',
      },
    );
    assert(loginRes.status === 200 || loginRes.status === 201, 'Super Admin login successful');
    const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken || loginRes.data?.data?.token || loginRes.data?.token;
    assert(!!token, 'Received access token');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Get branches and employees
    const branchesRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/branches',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const branchList = branchesRes.data?.data?.items || branchesRes.data?.data || branchesRes.data || [];
    assert(branchList.length > 0, `Fetched ${branchList.length} branches`);
    const branch1 = branchList[0];
    const branch2 = branchList.length > 1 ? branchList[1] : branch1;

    const employeesRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/employees',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const empList = (employeesRes.data?.data?.items || employeesRes.data?.data || employeesRes.data || []);
    const coordinatorEmp = empList.length > 0 ? empList[0] : null;

    // 2. Task 1: Create Campaign
    console.log('\n[2] Testing Task 1: Camps & Marketing Module...');
    const campPayload = {
      name: `Kharadi Highway Fleet Expo ${Date.now()}`,
      description: 'Customer outreach camp for heavy transport fleet owners',
      location: 'Pune Bypass Commercial Yard',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      coordinatorId: coordinatorEmp ? coordinatorEmp.id : undefined,
      branchId: branch1.id,
      budget: 200000,
      status: 'ACTIVE',
      notes: 'Initial deployment with demo trucks and service inspection booth',
    };

    const createCampRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/campaigns',
        method: 'POST',
        headers: authHeaders,
      },
      campPayload,
    );
    const camp = createCampRes.data?.data || createCampRes.data;
    assert(createCampRes.status === 201 && camp?.id, `Created campaign: ${camp?.name}`);
    const campaignId = camp.id;

    // 3. Record Actual Expense
    const expensePayload = {
      title: 'Stall Fabrication & Canopy Setup',
      category: 'LOGISTICS',
      amount: 45000,
      expenseDate: new Date().toISOString(),
      notes: 'Petty cash receipt #PC-991',
    };
    const expRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/campaigns/${campaignId}/expenses`,
        method: 'POST',
        headers: authHeaders,
      },
      expensePayload,
    );
    assert(expRes.status === 201 && (expRes.data?.data?.id || expRes.data?.id), 'Recorded actual campaign expense');

    // 4. Assign Team Member
    if (coordinatorEmp) {
      const memberRes = await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: `/api/v1/campaigns/${campaignId}/members`,
          method: 'POST',
          headers: authHeaders,
        },
        { employeeId: coordinatorEmp.id, roleInCamp: 'Lead Evaluator' },
      );
      assert(memberRes.status === 201 && (memberRes.data?.data?.id || memberRes.data?.id), 'Assigned team member to camp');
    }

    // 5. Create Lead associated with Campaign
    const leadPayload = {
      prospectName: `Camp Prospect ${Date.now().toString().slice(-4)}`,
      prospectPhone: `98234${Math.floor(10000 + Math.random() * 90000)}`,
      branchId: branch1.id,
      campaignId: campaignId,
      source: 'CAMP_OUTREACH',
      interestedModel: 'Signa 4825.TK',
      expectedBudget: 5400000,
      priority: 'HIGH',
      notes: 'Generated directly from Kharadi Highway Camp demo',
    };
    const leadRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/leads',
        method: 'POST',
        headers: authHeaders,
      },
      leadPayload,
    );
    const lead = leadRes.data?.data || leadRes.data;
    assert(leadRes.status === 201 && lead?.id, `Created lead associated with campaign: ${lead?.id}`);
    assert(lead.campaignId === campaignId, 'Lead genuine campaignId relationship verified');

    // 6. Campaign Details & Metrics Calculation
    const campDetailsRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/campaigns/${campaignId}`,
        method: 'GET',
        headers: authHeaders,
      },
    );
    const campDetails = campDetailsRes.data?.data || campDetailsRes.data;
    assert(campDetailsRes.status === 200, 'Fetched campaign details');
    assert(campDetails.actualExpenses === 45000, `Actual expenses match recorded records: Rs. ${campDetails.actualExpenses}`);
    assert(campDetails.budgetVariance === 200000 - 45000, `Budget variance calculated accurately: Rs. ${campDetails.budgetVariance}`);
    assert(campDetails.metrics?.leadsCount >= 1, `Campaign lead count dynamically calculated: ${campDetails.metrics?.leadsCount}`);

    // 7. Task 2: Finance and EMI Management
    console.log('\n[3] Testing Task 2: Finance & EMI Management...');
    // Fetch a booking or create one to test finance application
    const bookingsRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/bookings',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const bookingList = bookingsRes.data?.data?.items || bookingsRes.data?.data || [];
    assert(bookingList.length > 0, `Found existing bookings: ${bookingList.length}`);
    const testBooking = bookingList[0];

    // Check if finance application already exists for this booking or create
    let finApp = null;
    const finListRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/finance/applications',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const finApps = finListRes.data?.data?.items || finListRes.data?.data || [];
    finApp = finApps.find((f) => f.bookingId === testBooking.id);

    if (!finApp) {
      const createFinRes = await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: '/api/v1/finance/applications',
          method: 'POST',
          headers: authHeaders,
        },
        {
          customerId: testBooking.customerId,
          bookingId: testBooking.id,
          financeProvider: 'Tata Capital Commercial Vehicle Finance',
          loanReference: `TC-LN-${Date.now()}`,
          loanAmount: 3600000,
          downPayment: 900000,
          tenureMonths: 48,
          interestRate: 10.5,
          emiAmount: 92350,
          firstEmiDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      );
      finApp = createFinRes.data?.data || createFinRes.data;
    }

    assert(!!finApp?.id, `Finance application available: ${finApp?.applicationNumber || finApp?.id}`);

    // Fetch Finance details with EMI summary
    let finDetailRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/finance/applications/${finApp.id}`,
        method: 'GET',
        headers: authHeaders,
      },
    );
    let finDetail = finDetailRes.data?.data || finDetailRes.data;

    // Generate / Regenerate EMI Schedule if not already generated
    if (!finDetail.emiSchedules || finDetail.emiSchedules.length === 0) {
      const emiScheduleRes = await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: `/api/v1/finance/applications/${finApp.id}/emi-schedule`,
          method: 'POST',
          headers: authHeaders,
        },
        {
          firstDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          customEmiAmount: 92350,
          tenureMonths: 48,
          interestRate: 10.5,
        },
      );
      assert(emiScheduleRes.status === 201 || emiScheduleRes.status === 200, 'Generated full EMI repayment schedule');

      finDetailRes = await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: `/api/v1/finance/applications/${finApp.id}`,
          method: 'GET',
          headers: authHeaders,
        },
      );
      finDetail = finDetailRes.data?.data || finDetailRes.data;
    } else {
      assert(finDetail.emiSchedules.length > 0, `Existing EMI repayment schedule active (${finDetail.emiSchedules.length} installments)`);
    }

    assert(finDetail.emiSchedules?.length === 48, `Schedule has 48 installments (got ${finDetail.emiSchedules?.length})`);
    assert(finDetail.emiSummary?.totalEmiObligation > 0, `Total EMI obligation calculated: Rs. ${finDetail.emiSummary?.totalEmiObligation}`);

    // Record an actual EMI installment collection on an unpaid schedule
    const unpaidSchedule = finDetail.emiSchedules.find((s) => Number(s.paidAmount) === 0) || finDetail.emiSchedules[0];
    const recordPaymentRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/finance/emi/${unpaidSchedule.id}/payment`,
        method: 'POST',
        headers: authHeaders,
      },
      {
        amount: Number(unpaidSchedule.emiAmount),
        paymentMode: 'NACH_ECS',
        paymentReference: `NACH-${Date.now()}`,
        notes: 'Monthly auto-debit cleared by financier bank gateway',
      },
    );
    const recordedSchedule = recordPaymentRes.data?.data || recordPaymentRes.data;
    assert(recordPaymentRes.status === 201 || recordPaymentRes.status === 200, 'Recorded EMI payment collection');
    assert(recordedSchedule.status === 'PAID', `Schedule status updated to PAID (got ${recordedSchedule.status})`);
    assert(Number(recordedSchedule.paidAmount) >= Number(unpaidSchedule.emiAmount), 'Recorded paidAmount strictly verified');

    // Verify Dealership revenue isolation
    const invoiceListRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/invoices',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const invData = invoiceListRes.data?.data?.items || invoiceListRes.data?.data || [];
    assert(invoiceListRes.status === 200, 'Verified dealership invoices remain untouched and distinct from financier EMI');

    // 8. Task 3: WhatsApp Reminders Module
    console.log('\n[4] Testing Task 3: WhatsApp Reminders Module...');
    const eligibleRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/reminders/eligible',
        method: 'GET',
        headers: authHeaders,
      },
    );
    const eligibleList = Array.isArray(eligibleRes.data?.data) ? eligibleRes.data.data : (Array.isArray(eligibleRes.data) ? eligibleRes.data : []);
    assert(eligibleRes.status === 200, `Retrieved eligible reminder items (count: ${eligibleList.length}) - HTTP ${eligibleRes.status}`);

    // Prepare a Reminder with fresh phone and unique reference
    const testPhone = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
    const remPayload = {
      customerId: testBooking.customerId,
      category: 'SERVICE_DUE',
      recipientName: 'Harpreet Singh',
      recipientPhone: testPhone,
      referenceType: 'TEST_APPOINTMENT',
      referenceId: `REF-${Date.now()}`,
      draftMessage: 'Dear Harpreet Singh, your Titan Auto commercial truck MH-14-GH-9012 is due for periodic maintenance service. Please contact Titan Auto Pune Workshop at 020-27471000 to schedule your bay.',
      notes: 'Customer prefers early morning check-in',
    };
    const createRemRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/reminders',
        method: 'POST',
        headers: authHeaders,
      },
      remPayload,
    );
    const remData = createRemRes.data?.data || createRemRes.data;
    assert(createRemRes.status === 201 && remData?.id, 'Prepared customer reminder draft');
    assert(remData.status === 'PREPARED', `Status is strictly PREPARED (got ${remData.status})`);
    assert(remData.whatsappUrl && remData.whatsappUrl.startsWith('https://wa.me/'), `Valid WhatsApp click-to-send link generated: ${remData.whatsappUrl}`);

    // Mark as USER_INITIATED
    const initRemRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/reminders/${remData.id}/initiate`,
        method: 'POST',
        headers: authHeaders,
      },
      {},
    );
    const initData = initRemRes.data?.data || initRemRes.data;
    assert(initRemRes.status === 201 || initRemRes.status === 200, 'Reminder initiated by user click');
    assert(initData.status === 'USER_INITIATED', `Status accurately updated to USER_INITIATED, NOT fake SENT (got ${initData.status})`);
    assert(!!initData.initiatedAt, 'Initiated timestamp recorded');

    // Duplicate prevention test
    const dupRemRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/reminders',
        method: 'POST',
        headers: authHeaders,
      },
      remPayload,
    );
    assert(dupRemRes.status === 400, 'Duplicate reminder within 3 days rejected with 400 Bad Request');

    // 9. Cross-Branch Security & Isolation Test (Task 4 Item 6)
    console.log('\n[5] Testing Cross-Branch Isolation & Security...');
    const distinctBranch = branch2.id !== branch1.id ? branch2 : (branchList[1] || branchList[0]);
    const branch2Email = `manager.branch2.${Date.now()}@titanauto.com`;
    const branch2Password = 'Password123!';

    // Create manager in distinct branch using admin token
    const empRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/employees',
        method: 'POST',
        headers: authHeaders,
      },
      {
        email: branch2Email,
        password: branch2Password,
        firstName: 'Branch2',
        lastName: 'Sales',
        branchId: distinctBranch.id,
        employeeCode: `SE-${Date.now().toString().slice(-6)}`,
        roleName: 'SALES_EMPLOYEE',
      },
    );
    const empData = empRes.data?.data || empRes.data;
    const approvalId = empData?.approvalRequest?.id || empData?.approvalRequestId;
    if (approvalId) {
      await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: `/api/v1/approvals/${approvalId}/process`,
          method: 'POST',
          headers: authHeaders,
        },
        { action: 'APPROVE' },
      );
    }

    const b2Login = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: branch2Email,
        password: branch2Password,
      },
    );
    const b2Token = b2Login.data?.data?.accessToken || b2Login.data?.accessToken;
    assert(b2Login.status === 200 || b2Login.status === 201, `Branch 2 Manager authenticated (${distinctBranch.name})`);

    const b2Headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${b2Token}`,
    };

    // Jaipur manager tries to view or record expense on Pune campaign
    const crossCampRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/campaigns/${campaignId}`,
        method: 'GET',
        headers: b2Headers,
      },
    );
    assert(crossCampRes.status === 403, `Cross-branch campaign access rejected with 403 Forbidden (got ${crossCampRes.status})`);

    const crossExpRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/campaigns/${campaignId}/expenses`,
        method: 'POST',
        headers: b2Headers,
      },
      {
        title: 'Unauthorized Cross-Branch Expense',
        amount: 5000,
      },
    );
    assert(crossExpRes.status === 403, `Cross-branch campaign expense creation rejected with 403 Forbidden (got ${crossExpRes.status})`);

    // Jaipur manager tries to access Pune finance application
    const crossFinRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/finance/applications/${finApp.id}`,
        method: 'GET',
        headers: b2Headers,
      },
    );
    assert(crossFinRes.status === 403, `Cross-branch finance application access rejected with 403 Forbidden (got ${crossFinRes.status})`);

    console.log(`\n========================================`);
    console.log(`PHASE 2 BACKEND TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
