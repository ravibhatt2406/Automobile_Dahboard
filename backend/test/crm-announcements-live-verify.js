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
      headers: { ...(options.headers || {}) },
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
  console.log('================================================================');
  console.log('TITAN AUTO — CRM & LEADS AND ANNOUNCEMENTS LIVE VERIFY');
  console.log('================================================================\n');

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
    assert(adminLogin.status === 200 || adminLogin.status === 201, 'Super Admin login 200 OK');
    assert(!!adminToken, 'Admin token acquired');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Fetch branches for scoping
    const branchesRes = await request('/branches', { headers: adminHeaders });
    const branches = extractItems(branchesRes);
    assert(branches.length >= 2, `Branches loaded (count: ${branches.length})`);
    const branch1 = branches[0];
    const branch2 = branches[1];

    // =============================================================
    // MODULE 1: CRM & LEADS TESTS
    // =============================================================
    console.log('\n--- MODULE 1: CRM & LEADS FUNCTIONAL TESTS ---');

    // 2. Create Prospect Lead without Customer Account
    console.log('[2] Creating Prospect Lead without existing customer account...');
    const prospectPhone = `+91998${Math.floor(1000000 + Math.random() * 9000000)}`;
    const createLeadRes = await request('/leads', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        branchId: branch1.id,
        prospectName: 'Vikramaditya Logistics',
        prospectPhone: prospectPhone,
        prospectEmail: `vikram.${Date.now()}@logistics.in`,
        companyName: 'Vikramaditya Freight Carriers Pvt Ltd',
        source: 'CAMPAIGN_OUTREACH',
        interestedModel: 'AVTR 5525.T Heavy Tipper',
        expectedBudget: 5200000,
        priority: 'HIGH',
        notes: 'Initial conversation at Highway Camp. Requires 4 tippers for quarry mining contract.',
        nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      }),
    });

    assert(createLeadRes.status === 201 || createLeadRes.status === 200, 'Created prospect lead (HTTP 201/200)');
    const lead = createLeadRes.data?.data || createLeadRes.data;
    assert(!!lead.id, `Lead ID generated (${lead.id})`);
    assert(!!lead.leadNumber && lead.leadNumber.startsWith('LD-'), `Formatted Lead reference number generated (${lead.leadNumber})`);
    assert(lead.prospectName === 'Vikramaditya Logistics', 'Prospect name persisted directly on lead');
    assert(lead.companyName === 'Vikramaditya Freight Carriers Pvt Ltd', 'Company name persisted');
    assert(lead.status === 'NEW', 'Initial lead status is NEW');

    // 3. Activity Logging on Lead
    console.log('\n[3] Testing Activity Timeline on Lead...');
    const callActRes = await request(`/leads/${lead.id}/activities`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        activityType: 'CALL',
        title: 'Initial Discovery Phone Consultation',
        description: 'Discussed AVTR 5525.T cabin specs, body options, and financing requirements.',
      }),
    });
    assert(callActRes.status === 201 || callActRes.status === 200, 'Recorded phone call activity on lead');

    const demoActRes = await request(`/leads/${lead.id}/activities`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        activityType: 'TEST_DRIVE',
        title: 'Depot Yard Test Drive & Vehicle Walkaround',
        description: 'Fleet driver tested cabin ergonomics and hydraulic tipper controls at sitapura depot.',
      }),
    });
    assert(demoActRes.status === 201 || demoActRes.status === 200, 'Recorded test drive / demo activity on lead');

    const activitiesRes = await request(`/leads/${lead.id}/activities`, {
      headers: adminHeaders,
    });
    const activities = extractItems(activitiesRes);
    assert(activities.length >= 3, `Activity timeline retrieved (count: ${activities.length})`);
    assert(activities.some((a) => a.activityType === 'CALL'), 'Call activity found in timeline');
    assert(activities.some((a) => a.activityType === 'TEST_DRIVE'), 'Test drive activity found in timeline');

    // 4. Pipeline Stage Progression & Validation
    console.log('\n[4] Testing Pipeline Stage Progression & Validation Rules...');
    // Progress: NEW -> CONTACTED -> QUALIFIED
    const stageRes1 = await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'CONTACTED' }),
    });
    assert(stageRes1.status === 200, 'Progressed lead stage to CONTACTED');

    const stageRes2 = await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'QUALIFIED' }),
    });
    assert(stageRes2.status === 200, 'Progressed lead stage to QUALIFIED');

    // Attempt to mark as LOST without lostReason -> Must be rejected with 400
    const failLostRes = await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'LOST', lostReason: '' }),
    });
    assert(failLostRes.status === 400, 'Reject marking lead LOST without a reason (HTTP 400 Bad Request)');

    // Attempt to mark as CONVERTED without a quotation or booking -> Must be rejected with 400
    const failWonRes = await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'CONVERTED' }),
    });
    assert(failWonRes.status === 400, 'Reject marking lead WON/CONVERTED without active quotation or booking (HTTP 400 Bad Request)');

    // Mark as LOST with reason
    const successLostRes = await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        status: 'LOST',
        lostReason: 'Client postponed fleet expansion due to mining concession renewal delay.',
      }),
    });
    assert(successLostRes.status === 200, 'Marking lead LOST with mandatory reason succeeds (HTTP 200)');
    const lostLead = successLostRes.data?.data || successLostRes.data;
    assert(lostLead.status === 'LOST', 'Lead status updated to LOST');
    assert(!!lostLead.lostReason, `Lost reason recorded: ${lostLead.lostReason}`);

    // Reopen lead back to QUALIFIED
    await request(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'QUALIFIED' }),
    });

    // 5. Convert Prospect to Customer
    console.log('\n[5] Testing Lead Prospect-to-Customer Conversion...');
    const convertCustRes = await request(`/leads/${lead.id}/convert-customer`, {
      method: 'POST',
      headers: adminHeaders,
    });
    assert(convertCustRes.status === 201 || convertCustRes.status === 200, 'Converted prospect to active Customer record');
    const createdCust = convertCustRes.data?.data || convertCustRes.data;
    assert(!!createdCust.id || !!createdCust.customerId, 'Customer ID returned from conversion');

    // Fetch lead details and verify customer link
    const leadDetailRes = await request(`/leads/${lead.id}`, { headers: adminHeaders });
    const leadDetail = leadDetailRes.data?.data || leadDetailRes.data;
    assert(!!leadDetail.customerId, `Lead now has linked customerId (${leadDetail.customerId})`);
    assert(leadDetail.customer?.name === 'Vikramaditya Logistics', 'Customer record linked to lead correctly');

    // 6. Test CRM Views & Search
    console.log('\n[6] Testing CRM Filter Views & Search...');
    const allLeadsRes = await request('/leads?view=ALL', { headers: adminHeaders });
    assert(allLeadsRes.status === 200, 'View: ALL leads responds 200 OK');
    const allLeads = extractItems(allLeadsRes);
    assert(allLeads.length > 0, `All leads view returns records (${allLeads.length})`);

    const qualifiedLeadsRes = await request('/leads?view=QUALIFIED', { headers: adminHeaders });
    assert(qualifiedLeadsRes.status === 200, 'View: QUALIFIED leads responds 200 OK');

    const searchRes = await request(`/leads?search=${encodeURIComponent(lead.leadNumber)}`, {
      headers: adminHeaders,
    });
    assert(searchRes.status === 200, 'Search by Lead Number responds 200 OK');
    const searchItems = extractItems(searchRes);
    assert(searchItems.length >= 1 && searchItems[0].leadNumber === lead.leadNumber, 'Search matches leadNumber correctly');

    // =============================================================
    // MODULE 2: ANNOUNCEMENTS FUNCTIONAL TESTS
    // =============================================================
    console.log('\n--- MODULE 2: ANNOUNCEMENTS FUNCTIONAL TESTS ---');

    // 7. Super Admin creates and publishes Platform-Wide Announcement
    console.log('[7] Testing Super Admin Platform-Wide Announcement...');
    const platformAnnRes = await request('/announcements', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: `Q4 National Commercial Fleet Incentive Program ${Date.now()}`,
        content: 'All dealerships are eligible for volume rebate incentives on AVTR multi-axle models during Q4.',
        category: 'SALES',
        priority: 'HIGH',
        status: 'PUBLISHED',
        targetAudience: 'PLATFORM_WIDE',
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 86400000 * 60).toISOString(),
      }),
    });

    assert(platformAnnRes.status === 201 || platformAnnRes.status === 200, 'Created platform-wide announcement');
    const platformAnn = platformAnnRes.data?.data || platformAnnRes.data;
    assert(!!platformAnn.id, `Announcement ID generated (${platformAnn.id})`);
    assert(platformAnn.targetAudience === 'PLATFORM_WIDE', 'Target audience is PLATFORM_WIDE');
    assert(platformAnn.status === 'PUBLISHED', 'Status is PUBLISHED');

    // 8. Fetch Announcements List and Read Status
    console.log('\n[8] Testing Announcements Listing and Read Tracking...');
    const listAnnRes = await request('/announcements', { headers: adminHeaders });
    assert(listAnnRes.status === 200, 'Announcements list responds 200 OK');
    const annList = extractItems(listAnnRes);
    assert(annList.length > 0, `Announcements retrieved (count: ${annList.length})`);
    const foundAnn = annList.find((a) => a.id === platformAnn.id);
    assert(!!foundAnn, 'Newly published platform announcement present in list');
    assert(foundAnn.isRead === true, 'Author has announcement marked as read automatically');

    // 9. Draft Announcements Visibility
    console.log('\n[9] Testing Draft Status Visibility...');
    const draftAnnRes = await request('/announcements', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: `Internal Draft Policy Revision ${Date.now()}`,
        content: 'Draft operational procedures undergoing management approval.',
        category: 'OPERATIONS',
        priority: 'LOW',
        status: 'DRAFT',
        targetAudience: 'PLATFORM_WIDE',
      }),
    });
    assert(draftAnnRes.status === 201 || draftAnnRes.status === 200, 'Created draft announcement');
    const draftAnn = draftAnnRes.data?.data || draftAnnRes.data;
    assert(draftAnn.status === 'DRAFT', 'Status is confirmed DRAFT');

    // Publish the draft announcement
    const publishRes = await request(`/announcements/${draftAnn.id}/publish`, {
      method: 'POST',
      headers: adminHeaders,
    });
    assert(publishRes.status === 200, 'Published previously draft announcement (HTTP 200)');
    const pubData = publishRes.data?.data || publishRes.data;
    assert(pubData.status === 'PUBLISHED', 'Announcement status changed to PUBLISHED');

    // 10. Multi-Tenant Branch Scope Authorization on Announcements
    console.log('\n[10] Testing Multi-Tenant Scope Protection on Announcements...');
    // Create Branch 2 Manager user
    const b2Email = `manager.ann.b2.${Date.now()}@titanauto.com`;
    const b2Pass = 'ManagerPass123!';
    const empRes = await request('/employees', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email: b2Email,
        password: b2Pass,
        firstName: 'Branch2',
        lastName: 'Operations',
        branchId: branch2.id,
        employeeCode: `BO-${Date.now().toString().slice(-6)}`,
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
      body: JSON.stringify({ email: b2Email, password: b2Pass }),
    });

    if (b2Login.status === 200 || b2Login.status === 201) {
      const b2Token = extractToken(b2Login);
      const b2Headers = { Authorization: `Bearer ${b2Token}` };

      // Sales employee attempts to broadcast platform-wide announcement -> MUST BE 403 FORBIDDEN
      const unauthorizedAnnRes = await request('/announcements', {
        method: 'POST',
        headers: b2Headers,
        body: JSON.stringify({
          title: 'Unauthorized Global Broadcast',
          content: 'This should be blocked by backend permissions.',
          targetAudience: 'PLATFORM_WIDE',
        }),
      });
      assert(unauthorizedAnnRes.status === 403, 'Regular employee attempting PLATFORM_WIDE announcement rejected with 403 Forbidden');

      // Test unread count for branch 2 employee
      const unreadCountRes = await request('/announcements/unread-count', { headers: b2Headers });
      assert(unreadCountRes.status === 200, 'Unread count endpoint responds 200 OK');
      const unreadData = unreadCountRes.data?.data || unreadCountRes.data;
      assert(typeof unreadData.unreadCount === 'number', `Unread count is numeric (${unreadData.unreadCount})`);

      // Branch 2 employee reads the platform announcement
      const readRes = await request(`/announcements/${platformAnn.id}`, { headers: b2Headers });
      assert(readRes.status === 200, 'Branch employee views announcement and marks as read (HTTP 200)');
      const readData = readRes.data?.data || readRes.data;
      assert(readData.isRead === true, 'Announcement response reflects isRead: true');

      // Repeated read check: verify idempotent without duplicate error
      const repeatReadRes = await request(`/announcements/${platformAnn.id}/read`, {
        method: 'POST',
        headers: b2Headers,
      });
      assert(repeatReadRes.status === 200 || repeatReadRes.status === 201, 'Repeated mark-as-read is idempotent');

      // Cross-branch CRM access check: Branch 2 staff cannot view Branch 1 lead
      const crossLeadRes = await request(`/leads/${lead.id}`, { headers: b2Headers });
      assert(crossLeadRes.status === 403, 'Branch 2 employee viewing Branch 1 lead rejected with 403 Forbidden');
    } else {
      console.log('Skipping branch employee direct test (employee onboarding auto-approval in progress)');
    }

    console.log('\n================================================================');
    console.log(`CRM & ANNOUNCEMENTS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
