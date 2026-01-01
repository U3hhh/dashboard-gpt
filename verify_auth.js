
const BASE_URL = 'http://localhost:3000/api/auth/login';

async function testAuth() {
    console.log('Starting Auth Verification...\n');

    // Test 1: Missing Credentials
    console.log('Test 1: Missing Credentials');
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        if (res.status === 400 && data.status === 'error' && data.code === 'invalid_credentials') {
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }
    } catch (e) {
        console.log('❌ FAIL (Exception)', e);
    }
    console.log('-----------------------------------');

    // Test 2: Invalid Email Format (Should be caught by client validation usually, but API might catch it or return invalid creds)
    // Note: My implementation removed the explicit regex check in favor of Supabase handling or generic "invalid credentials" to match spec "Invalid email or password"
    // Let's see what happens with empty strings which falls into "Missing Credentials" check usually, or just bad format.
    // The previous implementation had regex. I removed it to simplify and rely on "invalid_credentials" for everything as per spec.
    // Let's test with a non-email string.
    console.log('Test 2: Invalid Email Format');
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'not-an-email', password: 'password' })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        // Expecting 401 invalid_credentials or 400 if I kept validation. 
        // Looking at my code: I only check if (!email || !password). 'not-an-email' is truthy.
        // So it goes to Supabase. Supabase will likely say "Invalid login credentials" or "invalid email".
        // I mapped "invalid login credentials" to invalid_credentials.
        if (data.status === 'error') {
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }
    } catch (e) {
        console.log('❌ FAIL (Exception)', e);
    }
    console.log('-----------------------------------');

    // Test 3: Random Credentials (Invalid Credentials)
    console.log('Test 3: Random Credentials');
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'random@example.com', password: 'wrongpassword' })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        if (res.status === 401 && data.status === 'error' && data.code === 'invalid_credentials') {
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }
    } catch (e) {
        console.log('❌ FAIL (Exception)', e);
    }
    console.log('-----------------------------------');


    // Test 4: Real Login & Dashboard Access
    console.log('Test 4: Real Login & Dashboard Access');
    try {
        // 1. Login
        const loginRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }) // Replace with valid credentials if known, or use a test account
        });

        // Note: We need valid credentials for this to work. 
        // If we don't have them, we can't fully verify the dashboard fetch.
        // Assuming 'admin@example.com' / 'password123' might not work unless seeded.
        // But let's try to capture the cookie if login succeeds.

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);

        if (loginData.status === 'success') {
            const cookies = loginRes.headers.get('set-cookie');
            console.log('Auth Cookie obtained');

            // 2. Fetch Dashboard
            const dashRes = await fetch('http://localhost:3000/api/dashboard', {
                headers: {
                    'Cookie': cookies
                }
            });
            const dashData = await dashRes.json();
            console.log('Dashboard Status:', dashRes.status);
            console.log('Dashboard Data:', JSON.stringify(dashData, null, 2));

            if (dashRes.status === 200 && !dashData.error) {
                console.log('✅ PASS - Dashboard accessible');
                if (dashData.totalSubscribers === 0) {
                    console.log('⚠️ NOTE: Dashboard is empty (0 subscribers). This might be why user thinks it is broken.');
                }
            } else {
                console.log('❌ FAIL - Dashboard error');
            }
        } else {
            console.log('⚠️ SKIPPED Dashboard test - Login failed (need valid credentials)');
        }

    } catch (e) {
        console.log('❌ FAIL (Exception)', e);
    }
    console.log('-----------------------------------');

}

testAuth();
