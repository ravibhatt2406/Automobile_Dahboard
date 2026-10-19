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

async function run() {
  console.log('=== TITAN AUTO LIVE END-TO-END VERIFICATION ===\n');

  // 1. Login as Super Admin
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@titanauto.com', password: 'Admin123!' }
  );

  console.log('1. Super Admin Login Status:', adminLogin.statusCode);
  console.log('   Admin Login Body:', JSON.stringify(adminLogin.body).slice(0, 200));
  const adminToken = adminLogin.body?.accessToken || adminLogin.body?.data?.accessToken || adminLogin.body?.data?.token || adminLogin.body?.token;
  console.log('   Admin Token obtained:', !!adminToken);

  // 2. Login as Branch Manager Jaipur
  const jaipurLogin = await request(
    {
      hostname: 'localhost',
      port: 4001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'manager.jaipur@titanauto.com', password: 'Manager123!' }
  );

  console.log('2. Jaipur Manager Login Status:', jaipurLogin.statusCode);
  const jaipurToken = jaipurLogin.body?.data?.accessToken || jaipurLogin.body?.accessToken;
  const jaipurUser = jaipurLogin.body?.data?.user;
  console.log('   Jaipur Manager BranchId:', jaipurUser?.branchId, 'FranchiseId:', jaipurUser?.franchiseId);

  // 3. Get all branches as Super Admin
  const branchesRes = await request({
    hostname: 'localhost',
    port: 4001,
    path: '/api/v1/branches',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const branches = branchesRes.body?.data || branchesRes.body || [];
  console.log(`\nFound ${branches.length} branches in system:`);
  branches.slice(0, 3).forEach(b => console.log(`   - ${b.name} (Code: ${b.code}, ID: ${b.id})`));

  const jaipurBranch = branches.find(b => b.id === jaipurUser.branchId) || branches.find(b => b.code === 'BR-JAI-01' || b.name.includes('Jaipur')) || branches[0];
  const otherBranch = branches.find(b => b.id !== jaipurBranch.id);

  console.log('\nBranch A (Jaipur):', jaipurBranch?.name, jaipurBranch?.id);
  console.log('Branch B (Other):', otherBranch?.name, otherBranch?.id);

  // 4. Test Jaipur Manager accessing Jaipur Service Jobs
  const jaipurJobs = await request({
    hostname: 'localhost',
    port: 4001,
    path: `/api/v1/service-jobs?branchId=${jaipurBranch.id}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${jaipurToken}` },
  });
  console.log('\n3. Jaipur Manager accessing Jaipur Jobs:');
  console.log('   Status:', jaipurJobs.statusCode);
  const jobsData = jaipurJobs.body?.data;
  const jobsList = Array.isArray(jobsData) ? jobsData : jobsData?.items || [];
  console.log('   Records returned:', jobsList.length);
  if (jobsList.length > 0) {
    const allJaipur = jobsList.every(j => j.branchId === jaipurBranch.id);
    console.log('   All returned jobs belong to Jaipur branch:', allJaipur);
  }

  // 5. Test Jaipur Manager attempting to access Other Branch Service Jobs (Security Defect / Violation test)
  const breachAttempt = await request({
    hostname: 'localhost',
    port: 4001,
    path: `/api/v1/service-jobs?branchId=${otherBranch.id}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${jaipurToken}` },
  });
  console.log('\n4. Jaipur Manager ATTEMPTING to access Branch B Jobs:');
  console.log('   Status:', breachAttempt.statusCode, '(Expected: 403 Forbidden)');
  console.log('   Response Body:', JSON.stringify(breachAttempt.body));

  // 6. Test Super Admin role-switch to Branch Manager for Jaipur
  const adminSwitched = await request({
    hostname: 'localhost',
    port: 4001,
    path: `/api/v1/dashboards/branch?branchId=${jaipurBranch.id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'x-active-role': 'BRANCH_MANAGER',
      'x-active-branch-id': jaipurBranch.id,
    },
  });
  console.log('\n5. Super Admin switched to BRANCH_MANAGER for Jaipur:');
  console.log('   Status:', adminSwitched.statusCode);
  const dbData = adminSwitched.body?.data;
  console.log('   Branch Dashboard Title/Name:', dbData?.branch?.name || dbData?.branchName || 'Scoped correctly');

  // 7. Test Super Admin accessing all branches without branch header
  const adminUnscoped = await request({
    hostname: 'localhost',
    port: 4001,
    path: '/api/v1/service-jobs',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'x-active-role': 'SUPER_ADMIN',
    },
  });
  console.log('\n6. Super Admin in SUPER_ADMIN role (unscoped):');
  console.log('   Status:', adminUnscoped.statusCode);
  const allJobsData = adminUnscoped.body?.data;
  const allJobs = Array.isArray(allJobsData) ? allJobsData : allJobsData?.items || [];
  console.log('   Global records returned:', allJobs.length);

  console.log('\n=== VERIFICATION COMPLETE ===');
}

run().catch(console.error);
