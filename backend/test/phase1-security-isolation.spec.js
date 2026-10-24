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
  console.log('================================================================');
  console.log('TITAN AUTO — PHASE 1 SECURITY & TENANT ISOLATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
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
    assert(!!adminToken, 'Super Admin authenticated successfully');

    // 2. Fetch Branches & Franchises
    const branchesRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/branches',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const branches = branchesRes.body?.data?.items || branchesRes.body?.data || branchesRes.body || [];
    assert(branches.length >= 2, 'Loaded at least 2 branches for multi-tenant isolation testing');
    const branch1 = branches[0];
    const branch2 = branches[1];

    // 3. Create a dedicated employee at Branch 2
    const b2Email = `manager.branch2.${Date.now()}@titanauto.com`;
    const b2Password = 'Password123!';
    const empRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/employees',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        email: b2Email,
        password: b2Password,
        firstName: 'Branch2',
        lastName: 'Manager',
        branchId: branch2.id,
        employeeCode: `EM-${Date.now().toString().slice(-6)}`,
        roleName: 'SALES_EMPLOYEE',
      },
    );
    assert(empRes.statusCode === 201 || empRes.statusCode === 200, 'Created dedicated Branch 2 Manager');

    const empData = empRes.body?.data || empRes.body;
    const approvalId = empData?.approvalRequest?.id || empData?.approvalRequestId;
    if (approvalId) {
      await request(
        {
          hostname: 'localhost',
          port: 4001,
          path: `/api/v1/approvals/${approvalId}/process`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
        },
        { action: 'APPROVE' },
      );
    }

    // Authenticate Branch 2 Manager
    const b2Login = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: b2Email, password: b2Password },
    );
    const b2Token = extractToken(b2Login);
    assert(!!b2Token, 'Branch 2 Manager authenticated successfully');

    // 4. Register and authenticate Customer
    const custEmail = `customer.sec.${Date.now()}@titanfleet.in`;
    const custPass = 'CustomerPass123!';
    const custRegRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Secured Fleet Logistics',
        phone: `+91987${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: custEmail,
        password: custPass,
        termsAccepted: true,
      },
    );
    assert(custRegRes.statusCode === 201 || custRegRes.statusCode === 200, 'Customer registered successfully');

    const custLogin = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: custEmail, password: custPass },
    );
    const custToken = extractToken(custLogin);
    assert(!!custToken, 'Customer authenticated successfully');

    console.log('\n--- SECTION A: Cross-Branch Isolation Checks ---');

    // TEST A1: Branch 2 employee attempting to create a Lead in Branch 1 is rejected (403 Forbidden)
    const crossLeadRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/crm/leads',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${b2Token}`,
        },
      },
      {
        branchId: branch1.id,
        prospectName: 'Cross Branch Infiltration Lead',
        prospectPhone: '9876543210',
      },
    );
    assert(
      crossLeadRes.statusCode === 403,
      'Branch 2 employee creating lead for Branch 1 rejected with 403 Forbidden',
      `Got status: ${crossLeadRes.statusCode}`,
    );

    // TEST A2: Branch 2 employee attempting to create an Invoice in Branch 1 is rejected (403 Forbidden)
    const crossInvoiceRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/invoices',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${b2Token}`,
        },
      },
      {
        branchId: branch1.id,
        customerId: 'any-id',
        items: [{ description: 'Test', quantity: 1, unitPrice: 1000 }],
        billingAddress: 'Test Address',
      },
    );
    assert(
      crossInvoiceRes.statusCode === 403,
      'Branch 2 employee creating invoice for Branch 1 rejected with 403 Forbidden',
      `Got status: ${crossInvoiceRes.statusCode}`,
    );

    // TEST A3: Branch 2 employee attempting to create a Booking in Branch 1 is rejected (403 Forbidden)
    const crossBookingRes = await request(
      {
        hostname: 'localhost',
        port: 4001,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${b2Token}`,
        },
      },
      {
        branchId: branch1.id,
        quotationId: '00000000-0000-0000-0000-000000000000',
        customerId: '00000000-0000-0000-0000-000000000000',
      },
    );
    assert(
      crossBookingRes.statusCode === 403 || crossBookingRes.statusCode === 404,
      'Branch 2 employee creating booking for Branch 1 rejected (403/404)',
      `Got status: ${crossBookingRes.statusCode}`,
    );

    console.log('\n--- SECTION B: Invalid Tenant & Resource ID Handling ---');

    // TEST B1: Request with non-existent Branch ID in header is rejected (404 Not Found)
    const invalidBranchRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/dashboards/SUPER_ADMIN',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-active-branch-id': 'non-existent-branch-id-99999',
      },
    });
    assert(
      invalidBranchRes.statusCode === 404,
      'Non-existent branch ID in header rejected with 404 Not Found',
      `Got status: ${invalidBranchRes.statusCode}`,
    );

    // TEST B2: Request with non-existent Franchise ID in header is rejected (404 Not Found)
    const invalidFranchiseRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/dashboards/SUPER_ADMIN',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-active-franchise-id': 'non-existent-franchise-id-99999',
      },
    });
    assert(
      invalidFranchiseRes.statusCode === 404,
      'Non-existent franchise ID in header rejected with 404 Not Found',
      `Got status: ${invalidFranchiseRes.statusCode}`,
    );

    console.log('\n--- SECTION C: Customer Privacy & Scoping ---');

    // TEST C1: Customer browsing trucks cannot see customer-owned vehicles
    const browseRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/vehicles/browse',
      method: 'GET',
    });
    const browseTrucks = browseRes.body?.data?.items || browseRes.body?.data || browseRes.body?.items || [];
    const hasCustomerOwned = browseTrucks.some((v) => v.customerId !== null && v.customerId !== undefined);
    assert(
      !hasCustomerOwned,
      'Public/Customer truck browse endpoint strictly contains 0 customer-owned vehicles',
    );

    // TEST C2: Customer attempting to access another customer profile is rejected (403 Forbidden)
    const otherCustRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/customers/00000000-0000-0000-0000-000000000001',
      method: 'GET',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert(
      otherCustRes.statusCode === 403 || otherCustRes.statusCode === 404,
      'Customer accessing unauthorized customer profile rejected (403/404)',
      `Got status: ${otherCustRes.statusCode}`,
    );

    // TEST C3: Unauthenticated direct API access is rejected (401 Unauthorized)
    const unauthRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/invoices',
      method: 'GET',
    });
    assert(
      unauthRes.statusCode === 401,
      'Direct unauthenticated API request rejected with 401 Unauthorized',
      `Got status: ${unauthRes.statusCode}`,
    );

    // TEST C4: Valid authorized requests continue to work
    const validLeadsRes = await request({
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/crm/leads',
      method: 'GET',
      headers: { Authorization: `Bearer ${b2Token}` },
    });
    assert(
      validLeadsRes.statusCode === 200,
      'Valid authorized request for leads succeeds with 200 OK',
      `Got status: ${validLeadsRes.statusCode}`,
    );

    console.log('\n================================================================');
    console.log(`PHASE 1 SECURITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

run();
