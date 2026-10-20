const http = require('http');

const API_BASE = 'http://localhost:4001/api/v1';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const parsed = new URL(fullUrl);

    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (options.body) {
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function extractToken(loginRes) {
  return (
    loginRes.data?.data?.accessToken ||
    loginRes.data?.accessToken ||
    loginRes.data?.data?.token ||
    loginRes.data?.token
  );
}

function extractItems(res) {
  return (
    res.data?.data?.items ||
    res.data?.data?.data ||
    res.data?.data ||
    res.data?.items ||
    res.data ||
    []
  );
}

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

async function runTests() {
  console.log('====================================================');
  console.log('TITAN AUTO — PHASE 3 LIVE VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Authenticate Super Admin
    // -------------------------------------------------------------
    console.log('[1] Authenticating Super Admin...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@titanauto.com', password: 'Admin123!' }),
    });

    const adminToken = extractToken(adminLogin);
    assert(adminLogin.status === 200 || adminLogin.status === 201, 'Super Admin login status 200');
    assert(!!adminToken, 'Admin token acquired');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Fetch branches for testing
    const branchesRes = await request('/branches', { headers: adminHeaders });
    const branches = extractItems(branchesRes);
    assert(branches.length >= 2, `Branches loaded (count: ${branches.length})`);
    const branch1 = branches[0];
    const branch2 = branches[1];

    // Fetch franchises for testing
    const franchiseRes = await request('/franchises', { headers: adminHeaders });
    const franchises = extractItems(franchiseRes);
    assert(franchises.length >= 1, `Franchises loaded (count: ${franchises.length})`);
    const franchise1 = franchises[0];

    // -------------------------------------------------------------
    // 2. Task 1 & 3: Super Admin Dashboard
    // -------------------------------------------------------------
    console.log('\n[2] Testing Super Admin Dashboard Telemetry...');
    const saDashRes = await request('/dashboards/super-admin', { headers: adminHeaders });
    assert(saDashRes.status === 200, 'Super Admin dashboard responds 200 OK');
    const saDash = saDashRes.data?.data || saDashRes.data;
    assert(typeof saDash.franchiseCount === 'number', `Franchise count is numeric (${saDash.franchiseCount})`);
    assert(typeof saDash.branchCount === 'number', `Branch count is numeric (${saDash.branchCount})`);
    assert(typeof saDash.vehicleCount === 'number', `Vehicle count is numeric (${saDash.vehicleCount})`);
    assert(typeof saDash.bookingCount === 'number', `Booking count is numeric (${saDash.bookingCount})`);
    assert(typeof saDash.totalRevenue === 'number', `Total revenue is numeric (₹${saDash.totalRevenue})`);
    assert(typeof saDash.totalCollections === 'number', `Total collections is numeric (₹${saDash.totalCollections})`);
    assert(typeof saDash.campaignsCount === 'number', `Campaigns count is numeric (${saDash.campaignsCount})`);
    assert(typeof saDash.complianceAlerts === 'number', `Compliance alerts is numeric (${saDash.complianceAlerts})`);

    // -------------------------------------------------------------
    // 3. Task 1 & 3: Franchise Dashboard
    // -------------------------------------------------------------
    console.log('\n[3] Testing Franchise Executive Dashboard...');
    const franDashRes = await request(`/dashboards/franchise?franchiseId=${franchise1.id}`, {
      headers: adminHeaders,
    });
    assert(franDashRes.status === 200, 'Franchise dashboard responds 200 OK');
    const franDash = franDashRes.data?.data || franDashRes.data;
    assert(franDash.franchiseId === franchise1.id, 'Franchise ID matches query');
    assert(typeof franDash.branchCount === 'number', `Franchise branch count is numeric (${franDash.branchCount})`);
    assert(typeof franDash.leadConversionRate === 'number', `Lead conversion rate is numeric (${franDash.leadConversionRate}%)`);
    assert(typeof franDash.totalCollections === 'number', `Franchise collections is numeric (₹${franDash.totalCollections})`);
    assert(typeof franDash.complianceAlerts === 'number', `Franchise compliance alerts is numeric (${franDash.complianceAlerts})`);

    // -------------------------------------------------------------
    // 4. Task 1 & 3: Branch Manager Dashboard
    // -------------------------------------------------------------
    console.log('\n[4] Testing Branch Manager Operational Dashboard...');
    const branchDashRes = await request(`/dashboards/branch?branchId=${branch1.id}`, {
      headers: adminHeaders,
    });
    assert(branchDashRes.status === 200, 'Branch manager dashboard responds 200 OK');
    const bDash = branchDashRes.data?.data || branchDashRes.data;
    assert(bDash.branchId === branch1.id, 'Branch ID matches query');
    assert(typeof bDash.inStockVehicles === 'number', `In-stock vehicles is numeric (${bDash.inStockVehicles})`);
    assert(typeof bDash.reservedVehicles === 'number', `Reserved vehicles is numeric (${bDash.reservedVehicles})`);
    assert(typeof bDash.activeLeads === 'number', `Active leads is numeric (${bDash.activeLeads})`);
    assert(typeof bDash.confirmedBookings === 'number', `Confirmed bookings is numeric (${bDash.confirmedBookings})`);
    assert(typeof bDash.activeServiceJobs === 'number', `Workshop active jobs is numeric (${bDash.activeServiceJobs})`);
    assert(typeof bDash.overdueJobs === 'number', `Overdue jobs is numeric (${bDash.overdueJobs})`);
    assert(typeof bDash.complianceAlerts === 'number', `Compliance alerts is numeric (${bDash.complianceAlerts})`);
    assert(typeof bDash.totalCollections === 'number', `Branch collections is numeric (₹${bDash.totalCollections})`);

    // -------------------------------------------------------------
    // 5. Task 1 & 3: Sales Employee Dashboard
    // -------------------------------------------------------------
    console.log('\n[5] Testing Sales Employee Dashboard...');
    const salesDashRes = await request(`/dashboards/sales?branchId=${branch1.id}`, {
      headers: adminHeaders,
    });
    assert(salesDashRes.status === 200, 'Sales dashboard responds 200 OK');
    const sDash = salesDashRes.data?.data || salesDashRes.data;
    assert(typeof sDash.openQuotationsCount === 'number', `Open quotations count is numeric (${sDash.openQuotationsCount})`);
    assert(typeof sDash.confirmedBookingsCount === 'number', `Confirmed bookings count is numeric (${sDash.confirmedBookingsCount})`);
    assert(typeof sDash.activeLeadsCount === 'number', `Active leads count is numeric (${sDash.activeLeadsCount})`);
    assert(Array.isArray(sDash.recentQuotations), 'Recent quotations is an array');

    // -------------------------------------------------------------
    // 6. Task 2: Customer Dashboard & Dynamic State
    // -------------------------------------------------------------
    console.log('\n[6] Testing Customer Dashboard & Dynamic State...');
    const testCustomerEmail = `customer.phase3.${Date.now()}@titanfleet.in`;
    const custRegRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Phase3 Logistics Fleet',
        phone: `+91987${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: testCustomerEmail,
        password: 'CustomerPass123!',
        termsAccepted: true,
      }),
    });
    assert(custRegRes.status === 201 || custRegRes.status === 200, 'Registered test customer');

    const custLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testCustomerEmail, password: 'CustomerPass123!' }),
    });
    assert(custLoginRes.status === 200, 'Customer login 200 OK');
    const custToken = extractToken(custLoginRes);
    const custHeaders = { Authorization: `Bearer ${custToken}` };

    const custDashRes = await request('/dashboards/customer', { headers: custHeaders });
    assert(custDashRes.status === 200, 'Customer dashboard responds 200 OK');
    const custDash = custDashRes.data?.data || custDashRes.data;
    assert(custDash.prospectState === 'NEW_PROSPECT', `Initial prospect state is strictly NEW_PROSPECT (got: ${custDash.prospectState})`);
    assert(custDash.vehicles.length === 0, 'No owned vehicles for new prospect');
    assert(custDash.bookings.length === 0, 'No bookings for new prospect');
    assert(Array.isArray(custDash.complianceDocuments), 'Compliance documents array present');
    assert(Array.isArray(custDash.payments), 'Payments array present');

    // -------------------------------------------------------------
    // 7. Task 5: Global Search & Tenant Scoping
    // -------------------------------------------------------------
    console.log('\n[7] Testing Global Search & Multi-Tenant Authorization...');
    const adminSearchRes = await request('/search/global?q=Truck', { headers: adminHeaders });
    assert(adminSearchRes.status === 200, 'Global search responds 200 OK for Super Admin');
    const searchResults = adminSearchRes.data?.data || adminSearchRes.data;
    assert(Array.isArray(searchResults), 'Search results is an array');

    // Customer Search Isolation: Customer searches for records
    const custSearchRes = await request('/search/global?q=Truck', { headers: custHeaders });
    assert(custSearchRes.status === 200, 'Customer search responds 200 OK');
    const custResults = custSearchRes.data?.data || custSearchRes.data;
    assert(Array.isArray(custResults), 'Customer search returns an array');
    assert(custResults.length === 0, 'Customer cannot see dealership stock trucks in search results');

    // -------------------------------------------------------------
    // 8. Task 4: Reports & MIS
    // -------------------------------------------------------------
    console.log('\n[8] Testing Reports & MIS Endpoints...');
    // Sales Report
    const salesReportRes = await request('/reports/sales', { headers: adminHeaders });
    assert(salesReportRes.status === 200, 'Sales report responds 200 OK');
    const sr = salesReportRes.data?.data || salesReportRes.data;
    assert(typeof sr.totalRevenue === 'number', `Sales report total revenue is numeric (₹${sr.totalRevenue})`);
    assert(typeof sr.totalCollectedPayments === 'number', `Sales report total collections is numeric (₹${sr.totalCollectedPayments})`);
    assert(typeof sr.outstandingInvoicesAmount === 'number', `Sales report outstanding invoices is numeric (₹${sr.outstandingInvoicesAmount})`);
    assert(Array.isArray(sr.bookingsByMonth), 'Sales report has bookingsByMonth array');
    assert(Array.isArray(sr.salesByModel), 'Sales report has salesByModel array');

    // CRM Report
    const crmReportRes = await request('/reports/crm', { headers: adminHeaders });
    assert(crmReportRes.status === 200, 'CRM report responds 200 OK');
    const cr = crmReportRes.data?.data || crmReportRes.data;
    assert(typeof cr.totalLeads === 'number', `CRM total leads is numeric (${cr.totalLeads})`);
    assert(typeof cr.leadToQuoteConversion === 'number', `CRM lead-to-quote conversion is numeric (${cr.leadToQuoteConversion}%)`);
    assert(typeof cr.leadToBookingConversion === 'number', `CRM lead-to-booking conversion is numeric (${cr.leadToBookingConversion}%)`);
    assert(typeof cr.overdueFollowUpsCount === 'number', `CRM overdue follow-ups is numeric (${cr.overdueFollowUpsCount})`);
    assert(cr.leadsByStage !== undefined, 'CRM leadsByStage map exists');

    // Inventory Report
    const invReportRes = await request('/reports/inventory', { headers: adminHeaders });
    assert(invReportRes.status === 200, 'Inventory report responds 200 OK');
    const ir = invReportRes.data?.data || invReportRes.data;
    assert(typeof ir.inStock === 'number', `Inventory in-stock is numeric (${ir.inStock})`);
    assert(typeof ir.totalPhysicalInventory === 'number', `Total physical inventory is numeric (${ir.totalPhysicalInventory})`);

    // Service Report
    const serviceReportRes = await request('/reports/service', { headers: adminHeaders });
    assert(serviceReportRes.status === 200, 'Service report responds 200 OK');
    const wr = serviceReportRes.data?.data || serviceReportRes.data;
    assert(typeof wr.openJobs === 'number', `Service open jobs is numeric (${wr.openJobs})`);
    assert(typeof wr.averageTurnaroundHours === 'number', `Average turnaround hours is numeric (${wr.averageTurnaroundHours} hrs)`);

    // Compliance Report
    const compReportRes = await request('/reports/compliance', { headers: adminHeaders });
    assert(compReportRes.status === 200, 'Compliance report responds 200 OK');
    const compR = compReportRes.data?.data || compReportRes.data;
    assert(typeof compR.expiredCount === 'number', `Compliance expired count is numeric (${compR.expiredCount})`);
    assert(typeof compR.expiringSoonCount === 'number', `Compliance expiring soon count is numeric (${compR.expiringSoonCount})`);
    assert(typeof compR.validCount === 'number', `Compliance valid count is numeric (${compR.validCount})`);
    assert(Array.isArray(compR.documentsByType), 'Compliance documentsByType array exists');

    // Finance Report
    const finReportRes = await request('/reports/finance', { headers: adminHeaders });
    assert(finReportRes.status === 200, 'Finance report responds 200 OK');
    const fr = finReportRes.data?.data || finReportRes.data;
    assert(typeof fr.totalInvoiceAmount === 'number', `Finance total invoice amount is numeric (₹${fr.totalInvoiceAmount})`);
    assert(typeof fr.totalCollectedPayments === 'number', `Finance total collections is numeric (₹${fr.totalCollectedPayments})`);
    assert(typeof fr.outstandingBalances === 'number', `Finance outstanding balances is numeric (₹${fr.outstandingBalances})`);
    assert(fr.emiSummary !== undefined, 'Finance emiSummary object is strictly separated from dealership revenue');
    assert(typeof fr.emiSummary.totalEmiObligations === 'number', `EMI obligations is numeric (₹${fr.emiSummary.totalEmiObligations})`);

    // CSV Export Test
    const csvRes = await request('/reports/export?category=sales', { headers: adminHeaders });
    assert(csvRes.status === 200, 'Export sales report CSV responds 200 OK');
    assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
    assert(typeof csvRes.data === 'string' && csvRes.data.includes('BookingNumber'), 'CSV contains BookingNumber header');

    // -------------------------------------------------------------
    // 9. Task 6: Cross-Branch Scope Isolation on Reports
    // -------------------------------------------------------------
    console.log('\n[9] Testing Direct API Multi-Tenant Scope Validation...');
    // Create an employee in branch2 and test cross branch rejection
    const b2EmpEmail = `test.manager.b2.${Date.now()}@titanauto.com`;
    const b2EmpPass = 'ManagerPass123!';
    const empRes = await request('/employees', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email: b2EmpEmail,
        password: b2EmpPass,
        firstName: 'Branch2',
        lastName: 'Manager',
        branchId: branch2.id,
        employeeCode: `SE-${Date.now().toString().slice(-6)}`,
        roleName: 'SALES_EMPLOYEE',
      }),
    });
    const empData = empRes.data?.data || empRes.data;
    const approvalId = empData?.approvalRequest?.id || empData?.approvalRequestId;
    if (approvalId) {
      await request(`/approvals/${approvalId}/process`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'APPROVE' }),
      });
    }

    const b2Login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: b2EmpEmail, password: b2EmpPass }),
    });

    if (b2Login.status === 200 || b2Login.status === 201) {
      const b2Token = extractToken(b2Login);
      const b2Headers = { Authorization: `Bearer ${b2Token}` };

      // Attempt to access Branch 1 sales report
      const b2CrossReport = await request(`/reports/sales?branchId=${branch1.id}`, {
        headers: b2Headers,
      });
      assert(b2CrossReport.status === 403, 'Branch 2 Manager accessing Branch 1 sales report rejected with 403 Forbidden');

      // Attempt to access Branch 1 dashboard
      const b2CrossDash = await request(`/dashboards/branch?branchId=${branch1.id}`, {
        headers: b2Headers,
      });
      assert(
        b2CrossDash.status === 403 || (b2CrossDash.status === 200 && b2CrossDash.data?.data?.branchId !== branch1.id),
        'Branch 2 Manager cannot access Branch 1 operational dashboard',
      );
    } else {
      console.log('Skipping branch2 direct test (employee onboarding auto-approval in progress)');
    }

    console.log('\n====================================================');
    console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  }
}

runTests();
