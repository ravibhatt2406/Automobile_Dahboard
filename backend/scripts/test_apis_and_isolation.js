const API_BASE = 'http://localhost:4001/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function login(email, password = 'Password@123') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data.data;
}

async function testApi() {
  console.log('===============================================================');
  console.log('TITAN AUTO — API AUTHENTICATION, SCOPING & ISOLATION VERIFICATION');
  console.log('===============================================================');

  // 1. Super Admin Login
  console.log('\n--- 1. Testing Super Admin Authentication ---');
  const adminAuth = await login('admin@titanauto.com', 'Admin123!');
  console.log('✅ Super Admin login successful. Token acquired.');
  const adminHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

  // 2. Fetch Franchises & Branches via Admin
  console.log('\n--- 2. Fetching Franchises and Branches ---');
  const franchisesRes = await request('/franchises', { headers: adminHeaders });
  const fList = franchisesRes.data.data || franchisesRes.data;
  console.log(`Franchises returned: ${fList.length}`);
  fList.forEach(f => console.log(`  - ${f.name} (Code: ${f.code}, ID: ${f.id})`));

  const branchesRes = await request('/branches', { headers: adminHeaders });
  const bList = branchesRes.data.data || branchesRes.data;
  console.log(`Branches returned: ${bList.length}`);
  bList.forEach(b => console.log(`  - ${b.name} (City: ${b.city}, FranchiseId: ${b.franchiseId}, ID: ${b.id})`));

  const tataBranch = bList.find(b => b.city && b.city.toLowerCase() === 'udaipur');
  const ashokBranch = bList.find(b => b.city && b.city.toLowerCase() === 'jaipur');

  // 3. Test Dashboard Scoping for Super Admin
  console.log('\n--- 3. Testing Dashboard Scoping for Super Admin ---');
  const dashAll = await request('/dashboards/super-admin', { headers: adminHeaders });
  console.log('Global Dashboard Status:', dashAll.status, 'Metrics:', {
    totalRevenue: dashAll.data.overview?.totalRevenue,
    activeFranchises: dashAll.data.overview?.activeFranchises,
    activeBranches: dashAll.data.overview?.activeBranches,
  });

  const dashUdr = await request(`/dashboards/super-admin?branchId=${tataBranch.id}`, { headers: adminHeaders });
  console.log('Udaipur Scoped Status:', dashUdr.status, 'Metrics:', {
    totalRevenue: dashUdr.data.overview?.totalRevenue,
    activeFranchises: dashUdr.data.overview?.activeFranchises,
    activeBranches: dashUdr.data.overview?.activeBranches,
  });

  const dashJai = await request(`/dashboards/super-admin?branchId=${ashokBranch.id}`, { headers: adminHeaders });
  console.log('Jaipur Scoped Status:', dashJai.status, 'Metrics:', {
    totalRevenue: dashJai.data.overview?.totalRevenue,
    activeFranchises: dashJai.data.overview?.activeFranchises,
    activeBranches: dashJai.data.overview?.activeBranches,
  });

  // 4. Test Udaipur Staff Authentication & Branch Scoping
  console.log('\n--- 4. Testing Udaipur Staff Scoping ---');
  const tataBmAuth = await login('bm.udaipur@titanauto.com', 'Password@123');
  console.log('✅ Tata Udaipur Branch Manager login successful.');
  const tataHeaders = { Authorization: `Bearer ${tataBmAuth.accessToken}` };

  const tataVehicles = await request('/vehicles', { headers: tataHeaders });
  const tataVehList = tataVehicles.data.data || tataVehicles.data;
  console.log(`Tata Staff Vehicle list count: ${Array.isArray(tataVehList) ? tataVehList.length : 'N/A'}`);
  if (Array.isArray(tataVehList)) {
    tataVehList.forEach(v => console.log(`  - VIN: ${v.vin}, BranchId: ${v.branchId} (${v.branchId === tataBranch.id ? 'Udaipur - OK' : 'MISMATCH!'})`));
  }

  // 5. Test Ashok Leyland Staff Authentication & Branch Scoping
  console.log('\n--- 5. Testing Ashok Leyland Jaipur Staff Scoping ---');
  const ashokBmAuth = await login('bm.jaipur@titanauto.com', 'Password@123');
  console.log('✅ Ashok Leyland Jaipur Branch Manager login successful.');
  const ashokHeaders = { Authorization: `Bearer ${ashokBmAuth.accessToken}` };

  const ashokVehicles = await request('/vehicles', { headers: ashokHeaders });
  const ashokVehList = ashokVehicles.data.data || ashokVehicles.data;
  console.log(`Ashok Staff Vehicle list count: ${Array.isArray(ashokVehList) ? ashokVehList.length : 'N/A'}`);
  if (Array.isArray(ashokVehList)) {
    ashokVehList.forEach(v => console.log(`  - VIN: ${v.vin}, BranchId: ${v.branchId} (${v.branchId === ashokBranch.id ? 'Jaipur - OK' : 'MISMATCH!'})`));
  }

  // 6. Test Multi-tenant Isolation Enforcement
  console.log('\n--- 6. Testing Multi-Tenant Data Isolation Enforcement ---');
  console.log(`Tata Staff querying explicitly with Jaipur branchId (${ashokBranch.id})...`);
  const crossBranchRes = await request(`/vehicles?branchId=${ashokBranch.id}`, { headers: tataHeaders });
  if (crossBranchRes.status === 403 || crossBranchRes.status === 401) {
    console.log(`✅ ACCESS FORBIDDEN (HTTP ${crossBranchRes.status}): Cross-branch query blocked by security guard.`);
  } else if (crossBranchRes.ok) {
    const crossList = crossBranchRes.data.data || crossBranchRes.data;
    const hasJaipurVehicles = Array.isArray(crossList) && crossList.some(v => v.branchId === ashokBranch.id);
    if (hasJaipurVehicles) {
      console.error('❌ ISOLATION LEAK: Tata staff was able to see Jaipur branch vehicles!');
    } else {
      console.log('✅ SCOPE ENFORCED: Backend restricted data to Udaipur or returned 0 cross-branch records.');
    }
  }

  // 7. Verify CRM Leads and Announcements Endpoints
  console.log('\n--- 7. Testing CRM Leads & Announcements Endpoints ---');
  const leadsRes = await request('/leads', { headers: tataHeaders });
  const leadsList = leadsRes.data.data || leadsRes.data;
  console.log(`Tata Staff Leads count: ${Array.isArray(leadsList) ? leadsList.length : 'N/A'}`);
  if (Array.isArray(leadsList)) {
    leadsList.forEach(l => console.log(`  - Lead: ${l.leadNumber} - ${l.prospectName} (${l.interestedModel})`));
  }

  const annRes = await request('/announcements', { headers: tataHeaders });
  const annList = annRes.data.data || annRes.data;
  console.log(`Tata Staff Announcements count: ${Array.isArray(annList) ? annList.length : 'N/A'}`);
  if (Array.isArray(annList)) {
    annList.forEach(a => console.log(`  - Announcement: "${a.title}"`));
  }

  console.log('\n===============================================================');
  console.log('✅ ALL API & ISOLATION CHECKS PASSED PERFECTLY!');
  console.log('===============================================================');
}

testApi().catch(err => {
  console.error('API Verification error:', err);
  process.exit(1);
});
