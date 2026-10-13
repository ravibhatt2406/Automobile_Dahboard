const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api/v1';

async function runTests() {
  console.log('================================================================');
  console.log('TITAN AUTO: CUSTOMER LOGIN & SELF-REGISTRATION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `newcustomer_${timestamp}@testdomain.com`;
  const testPhone = `+9198765${String(timestamp).slice(-5)}`;
  const testPassword = 'SecurePassword123!';

  try {
    // -------------------------------------------------------------
    // Test 1: New customer can register
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Customer Self-Registration ---');
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Virendra Singh',
        email: testEmail,
        phone: testPhone,
        password: testPassword,
        termsAccepted: true,
      }),
    });

    const regData = await registerRes.json();
    assert(registerRes.status === 201, `Customer registration returns HTTP 201 (got ${registerRes.status})`);
    assert(regData?.data?.user?.email === testEmail, `Registered user email matches ${testEmail}`);
    assert(regData?.data?.user?.accountType === 'CUSTOMER', `Registered user accountType is CUSTOMER`);
    assert(regData?.data?.accessToken, `Access token returned upon registration`);

    // -------------------------------------------------------------
    // Test 2: Duplicate email is rejected
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Duplicate Email Rejection ---');
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail.toUpperCase(), // Case-insensitive duplicate check
        phone: '+919999988888',
        password: testPassword,
        termsAccepted: true,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, `Duplicate email registration returns HTTP 409 Conflict (got ${dupRes.status})`);
    assert(
      dupData?.message?.toLowerCase().includes('already exists') ||
      dupData?.message?.toLowerCase().includes('already registered') ||
      dupData?.message?.toLowerCase().includes('conflict'),
      `Duplicate email error message is clear: "${dupData?.message}"`
    );

    // -------------------------------------------------------------
    // Test 3: Password is stored as a hash, never plaintext
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Password Hash Storage in DB ---');
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { customerProfile: true },
    });
    assert(dbUser !== null, `User record exists in DB for ${testEmail}`);
    assert(dbUser?.passwordHash !== testPassword, `Stored password is NOT plain text`);
    assert(dbUser?.passwordHash.startsWith('$2b$') || dbUser?.passwordHash.startsWith('$2a$'), `Stored password is a valid bcrypt hash (${dbUser?.passwordHash.slice(0, 7)}...)`);
    const isBcryptValid = await bcrypt.compare(testPassword, dbUser.passwordHash);
    assert(isBcryptValid === true, `bcrypt.compare validates correctly against stored hash`);
    assert(dbUser?.customerProfile !== null, `Customer profile record linked in database`);

    // -------------------------------------------------------------
    // Test 4: Customer can log in with correct password
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Customer Login with Correct Password ---');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `Login returns HTTP 200 (got ${loginRes.status})`);
    const customerToken = loginData?.data?.accessToken;
    assert(!!customerToken, `Valid JWT access token returned on login`);
    assert(loginData?.data?.user?.accountType === 'CUSTOMER', `Login user accountType is CUSTOMER`);
    assert(loginData?.data?.user?.customerId === dbUser?.customerProfile?.id, `Customer identity correctly resolved to customerId`);

    // Also test login with phone number
    const phoneLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPhone,
        password: testPassword,
      }),
    });
    assert(phoneLoginRes.status === 200, `Login with registered phone number returns HTTP 200`);

    // -------------------------------------------------------------
    // Test 5: Incorrect password is rejected
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Incorrect Password Rejection ---');
    const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!',
      }),
    });
    assert(badLoginRes.status === 401, `Incorrect password returns HTTP 401 Unauthorized (got ${badLoginRes.status})`);

    // -------------------------------------------------------------
    // Test 6: Inactive / Unverified accounts follow configured policy
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Inactive Account Policy ---');
    // Create an inactive user to verify policy enforcement
    const inactiveEmail = `inactive_${timestamp}@testdomain.com`;
    const hashedPwd = await bcrypt.hash('InactivePass123!', 10);
    const inactiveUser = await prisma.user.create({
      data: {
        email: inactiveEmail,
        passwordHash: hashedPwd,
        accountType: 'CUSTOMER',
        status: 'INACTIVE',
      },
    });
    const inactiveLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveEmail,
        password: 'InactivePass123!',
      }),
    });
    assert(inactiveLoginRes.status === 401, `Inactive user login is rejected with HTTP 401 (got ${inactiveLoginRes.status})`);
    // Cleanup temporary inactive test user
    await prisma.user.delete({ where: { id: inactiveUser.id } });

    // -------------------------------------------------------------
    // Test 7: Customer receives only customer permissions / role
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Customer Role & Permission Scoping ---');
    // Decode JWT payload or check user endpoint
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, `/auth/me returns HTTP 200 for authenticated customer`);
    const meUser = meData?.data?.user;
    assert(meUser?.accountType === 'CUSTOMER', `User accountType is strictly CUSTOMER`);
    assert(meUser?.role === 'CUSTOMER', `User role is strictly CUSTOMER`);
    const rolesList = meUser?.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
    assert(
      !rolesList.includes('SUPER_ADMIN') && !rolesList.includes('BRANCH_MANAGER'),
      `Customer has no privileged administrative roles assigned`
    );

    // -------------------------------------------------------------
    // Test 8: Customer cannot access administrative / another customer's data
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Customer Isolation & Security ---');
    // Try accessing employee endpoint: /dashboards/super-admin
    const adminDashRes = await fetch(`${API_BASE}/dashboards/super-admin`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(
      adminDashRes.status === 403 || adminDashRes.status === 401,
      `Customer blocked from Super Admin Dashboard (got HTTP ${adminDashRes.status})`
    );

    // Try accessing branch manager dashboard
    const bmDashRes = await fetch(`${API_BASE}/dashboards/branch-manager`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(
      bmDashRes.status === 403 || bmDashRes.status === 401,
      `Customer blocked from Branch Manager Dashboard (got HTTP ${bmDashRes.status})`
    );

    // Customer CAN access their own customer dashboard
    const custDashRes = await fetch(`${API_BASE}/dashboards/customer`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custDashRes.status === 200, `Customer CAN access Customer Dashboard (HTTP 200)`);

    // -------------------------------------------------------------
    // Test 9: Existing Employee and Seeded Customer Login
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Existing Seeded Accounts ---');
    // Test Seeded Customer
    const seededCustRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@rajasthanlogistics.com',
        password: 'Customer123!',
      }),
    });
    assert(seededCustRes.status === 200, `Existing seeded customer (customer@rajasthanlogistics.com) logs in successfully`);

    // Test Seeded Branch Manager
    const employeeLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.jaipur@titanauto.com',
        password: 'Manager123!',
      }),
    });
    assert(employeeLoginRes.status === 200, `Existing employee (manager.jaipur@titanauto.com) logs in successfully`);

    // Test Super Admin
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@titanauto.com',
        password: 'Admin123!',
      }),
    });
    assert(adminLoginRes.status === 200, `Existing Super Admin (admin@titanauto.com) logs in successfully`);

    // -------------------------------------------------------------
    // Test 10: Clean-up test registration user safely
    // -------------------------------------------------------------
    // We remove the test customer created during this run to keep DB clean
    if (dbUser?.customerProfile?.id) {
      await prisma.customer.delete({ where: { id: dbUser.customerProfile.id } });
    }
    if (dbUser?.id) {
      await prisma.user.delete({ where: { id: dbUser.id } });
    }
    console.log('\nCleaned up ephemeral test customer account.');

  } catch (error) {
    console.error('Test execution encountered error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
