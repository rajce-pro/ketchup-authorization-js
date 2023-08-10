const principal = { principal: 'username', credentials: 'password' };
let client;

beforeEach(() => {
    client = require('./index')({
        baseUrl: "http://localhost:8080",
    });
});

test('client.authorize() returns a promise', () => {
    expect(client.authorize(principal)).toBeInstanceOf(Promise);
});

test('client.authorize() success', async () => {
    expect((await client.authorize(principal)).authorized()).toBe(true);
});

test('client.authorize() failure', async () => {
    const badPrincipal = { principal: 'bad', credentials: 'bad' };
    const session = await client.authorize(badPrincipal);
    expect(session.authorized()).toBe(false);

    let present = false;

    try {
        session.token();
        session.refreshToken();
        present = true;
    } catch (e) {
    }

    expect(present).toBe(false);
});

test('client.authorize() token details', async () => {
    const result = await client.authorize(principal);
    expect(result.token()).not.toBe(undefined);
    expect(result.refreshToken()).not.toBe(undefined);
});
