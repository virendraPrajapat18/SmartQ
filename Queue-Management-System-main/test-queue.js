async function test() {
    const BASE_URL = 'http://localhost:5001/api';
    
    async function api(path, method = 'GET', body = null, token = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        if (token) options.headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}${path}`, options);
        if (res.status === 204) return null;
        return res.json();
    }

    console.log('--- Starting Queue Test ---');

    // 1. Login or Register User A
    let resA = await api('/auth/login', 'POST', {email: 'user@example.com', password: 'user123'});
    if (!resA.token) {
        console.log('User A login failed, trying to register...');
        resA = await api('/auth/register', 'POST', {name: 'Test Citizen', nic: '123456789V', email: 'user@example.com', password: 'user123'});
    }
    let tokenA = resA.token;
    if (!tokenA) { console.error('Failed to get token for User A'); return; }
    console.log('User A logged in');

    // 2. Login or Register User B
    let resB = await api('/auth/login', 'POST', {email: 'test_user_unique@example.com', password: 'password123'});
    if (!resB.token) {
        console.log('User B login failed, trying to register...');
        resB = await api('/auth/register', 'POST', {name: 'Test User B', nic: 'NIC' + Date.now(), email: 'test_user_unique@example.com', password: 'password123'});
        if (!resB.token) console.log('User B registration failed:', resB);
    }
    let tokenB = resB.token;
    if (!tokenB) { console.error('Failed to get token for User B'); return; }
    console.log('User B logged in');

    // 3. Clean up existing queues for both users
    const statusA = await api('/queue/status', 'GET', null, tokenA);
    if (statusA && statusA.ticket) {
        console.log('Cleaning up existing queue for User A...');
        await api(`/queue/remove/${statusA.ticket._id}`, 'DELETE', null, tokenA);
    }
    
    const statusB_old = await api('/queue/status', 'GET', null, tokenB);
    if (statusB_old && statusB_old.ticket) {
        console.log('Cleaning up existing queue for User B...');
        await api(`/queue/remove/${statusB_old.ticket._id}`, 'DELETE', null, tokenB);
    }

    // 4. Get available services
    let services = await api('/queue/services');
    if (!services || services.length === 0) {
        console.error('No services available. Test cannot continue.');
        return;
    }
    let serviceId = services[0]._id;
    console.log(`Using service: ${services[0].name}`);

    // 5. User A joins queue
    let joinA = await api('/queue/join', 'POST', {serviceId}, tokenA);
    if(!joinA.ticket) { console.error("User A join failed:", joinA); return; }
    console.log('User A joined queue, ticket:', joinA.ticket.ticketNumber);

    // 6. User B joins queue
    let joinB = await api('/queue/join', 'POST', {serviceId}, tokenB);
    if(!joinB.ticket) { console.error("User B join failed:", joinB); return; }
    console.log('User B joined queue, ticket:', joinB.ticket.ticketNumber);

    // 7. Check status and position
    let finalStatusB = await api('/queue/status', 'GET', null, tokenB);
    console.log('User B status check:', finalStatusB.ticket.status, '| People ahead:', finalStatusB.peopleAhead);

    // 8. Clean up
    await api(`/queue/remove/${joinA.ticket._id}`, 'DELETE', null, tokenA);
    await api(`/queue/remove/${joinB.ticket._id}`, 'DELETE', null, tokenB);
    console.log('Test completed and cleaned up.');
}

test().catch(err => console.error('Test crashed:', err));
