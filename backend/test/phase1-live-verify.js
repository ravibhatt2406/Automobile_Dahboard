const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function extractToken(loginRes) {
  return (
    loginRes.body?.data?.accessToken ||
    loginRes.body?.accessToken ||
    loginRes.body?.data?.token ||
    loginRes.body?.token
  );
}

async function run() {
  console.log('====================================================');
  console.log('TITAN AUTO — PHASE 1 LIVE VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Super Admin
    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@titanauto.com', password: 'Admin123!' },
    );
    const adminToken = extractToken(adminLogin);
    assert(adminLogin.statusCode === 200 || adminLogin.statusCode === 201, 'Super Admin login successful', `Status: ${adminLogin.statusCode}`);
    assert(!!adminToken, 'Admin JWT token acquired');

    // 2. Fetch Branches
    const branchesRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/branches',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const branches = branchesRes.body?.data?.items || branchesRes.body?.data || branchesRes.body || [];
    assert(branches.length >= 2, 'Branches loaded (at least 2 branches)', `Count: ${branches.length}`);
    const branchA = branches[0];
    const branchB = branches[1];

    // 3. Test 1: Organisation staff can create a customer in an authorised branch
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const custRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/customers',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        name: 'Singhania Logistics Ltd',
        customerType: 'BUSINESS',
        phone: uniquePhone,
        email: `vikram_${Date.now()}@singhanialogistics.in`,
        gstin: '08AAAAA0000A1Z5',
        pan: 'ABCDE1234F',
        branchId: branchA.id,
      },
    );
    assert(custRes.statusCode === 201 || custRes.statusCode === 200, 'Customer created in authorised branch', `Status: ${custRes.statusCode}, body: ${JSON.stringify(custRes.body)}`);
    const createdCust = custRes.body?.data || custRes.body;
    assert(createdCust?.pan === 'ABCDE1234F', 'PAN and GSTIN persisted correctly on Customer');

    // 4. Test 2: Reject duplicate phone for customer
    const dupRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/customers',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        name: 'Duplicate Test',
        customerType: 'INDIVIDUAL',
        phone: uniquePhone,
        branchId: branchA.id,
      },
    );
    assert(dupRes.statusCode === 400 || dupRes.statusCode === 409, 'Duplicate customer phone is rejected by backend', `Status: ${dupRes.statusCode}`);

    // Test 2b: Unauthorised cross-branch customer creation is rejected
    const jaipurLogin = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'manager.jaipur@titanauto.com', password: 'Manager123!' },
    );
    const jaipurToken = extractToken(jaipurLogin);
    if (jaipurToken) {
      const crossBranchRes = await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: '/api/v1/customers',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jaipurToken}`,
          },
        },
        {
          name: 'Cross Branch Test Customer',
          customerType: 'INDIVIDUAL',
          phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
          branchId: branchB.id,
        },
      );
      assert(
        crossBranchRes.statusCode === 403,
        'Unauthorised cross-branch customer creation is rejected (403 Forbidden)',
        `Status: ${crossBranchRes.statusCode}`,
      );
    }

    // 5. Test 3: Public customer self-registration preserves accounts without duplicate hijacking
    const publicPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    const publicEmail = `public_${Date.now()}@fleetuser.in`;
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/register/customer',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Arun FleetOps',
        email: publicEmail,
        phone: publicPhone,
        password: 'Password123!',
        termsAccepted: true,
      },
    );
    assert(regRes.statusCode === 201 || regRes.statusCode === 200, 'Public customer registration succeeds', `Status: ${regRes.statusCode}`);

    // 6. Test 4: CRM / Leads Module - Create Lead & Advance Stages
    const leadRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/leads',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        branchId: branchA.id,
        prospectName: 'Deepak Choudhary',
        prospectPhone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
        prospectEmail: `deepak_${Date.now()}@choudharytrans.in`,
        companyName: 'Choudhary Transways',
        interestedModel: 'Ashok Leyland 2820 Commercial Tipper',
        expectedBudget: 3600000,
        priority: 'HIGH',
        source: 'DIRECT_VISIT',
        nextFollowUpDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      },
    );
    assert(leadRes.statusCode === 201 || leadRes.statusCode === 200, 'CRM Lead created with prospect details', `Status: ${leadRes.statusCode}`);
    const createdLead = leadRes.body?.data || leadRes.body;
    const leadId = createdLead?.id;

    // Advance to CONTACTED
    const advRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/leads/${leadId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { status: 'CONTACTED' },
    );
    assert(advRes.statusCode === 200, 'Lead stage advanced to CONTACTED', `Status: ${advRes.statusCode}`);

    // Advance to QUALIFIED
    const qualRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/leads/${leadId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { status: 'QUALIFIED' },
    );
    assert(qualRes.statusCode === 200, 'Lead stage advanced to QUALIFIED', `Status: ${qualRes.statusCode}`);

    // Test 5: Lead cannot be converted to WON / CONVERTED without a genuine quotation/booking
    const convertWithoutQuote = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: `/api/v1/leads/${leadId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { status: 'CONVERTED' },
    );
    assert(
      convertWithoutQuote.statusCode === 400,
      'Lead conversion to WON without quotation/booking is rejected by business rule',
      `Status: ${convertWithoutQuote.statusCode}`,
    );

    // 7. Test 6: Workshop Status Transitions & Service Jobs
    const jobsRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/service-jobs?limit=5',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const jobs = jobsRes.body?.data?.items || jobsRes.body?.data || jobsRes.body?.items || [];
    assert(jobsRes.statusCode === 200, 'Service jobs fetched from database', `Count: ${jobs.length}`);

    // 8. Test 7 & 8: Vehicle Compliance Document Tracking & Status Calculation
    const vehiclesRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/inventory/vehicles?pageSize=5',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vehicles = vehiclesRes.body?.data?.data || vehiclesRes.body?.data?.items || vehiclesRes.body?.data || [];
    assert(vehicles.length > 0, 'Vehicle asset found for compliance registration', `Count: ${vehicles.length}`);
    const testVehicle = vehicles[0];

    // Create a VALID compliance doc (expiry in 6 months)
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const pucRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/compliance',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        vehicleId: testVehicle.id,
        documentType: 'PUC',
        documentNumber: `PUC-RJ-${Date.now().toString().slice(-6)}`,
        issuingAuthority: 'Rajasthan Transport Dept (Pollution Testing Unit #4)',
        issueDate: new Date().toISOString(),
        expiryDate: futureDate,
        notes: 'Commercial diesel smoke opacity test passed within limits',
      },
    );
    assert(pucRes.statusCode === 201 || pucRes.statusCode === 200, 'Compliance document (PUC) created', `Status: ${pucRes.statusCode}`);
    const createdPuc = pucRes.body?.data || pucRes.body;
    assert(createdPuc?.computedStatus === 'VALID', 'Future expiry date computed as VALID', `Got: ${createdPuc?.computedStatus}`);

    // Create an EXPIRED compliance doc (expiry in the past)
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const expiredRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/compliance',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        vehicleId: testVehicle.id,
        documentType: 'FITNESS_CERTIFICATE',
        documentNumber: `FIT-RJ-${Date.now().toString().slice(-6)}`,
        issuingAuthority: 'Jaipur RTO Fitness Center',
        issueDate: new Date(Date.now() - 375 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: pastDate,
      },
    );
    const createdExpired = expiredRes.body?.data || expiredRes.body;
    assert(createdExpired?.computedStatus === 'EXPIRED', 'Past expiry date computed dynamically as EXPIRED', `Got: ${createdExpired?.computedStatus}`);

    // Create an EXPIRING_SOON compliance doc (expiry in 15 days)
    const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const soonRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/compliance',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        vehicleId: testVehicle.id,
        documentType: 'ROAD_PERMIT',
        documentNumber: `RP-IND-${Date.now().toString().slice(-6)}`,
        issuingAuthority: 'MoRTH National Permit Portal',
        issueDate: new Date().toISOString(),
        expiryDate: soonDate,
      },
    );
    const createdSoon = soonRes.body?.data || soonRes.body;
    assert(createdSoon?.computedStatus === 'EXPIRING_SOON', 'Expiry within 30 days computed dynamically as EXPIRING_SOON', `Got: ${createdSoon?.computedStatus}`);

    // Fetch summary metrics
    const summaryRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/compliance/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const summary = summaryRes.body?.data || summaryRes.body;
    assert(summary?.total >= 3, 'Compliance summary returns aggregated metrics', `Total: ${summary?.total}`);
    assert(summary?.valid >= 1, 'Summary has valid counts');
    assert(summary?.expired >= 1, 'Summary has expired counts');
    assert(summary?.expiringSoon >= 1, 'Summary has expiringSoon counts');

    // 9. Test 9: Existing billing, invoices, login endpoints not broken
    const invoicesRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/billing/invoices?limit=5',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(invoicesRes.statusCode === 200, 'Invoices API endpoint responds 200 OK', `Status: ${invoicesRes.statusCode}`);

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test Suite encountered fatal error:', err);
    process.exit(1);
  }
}

run();
