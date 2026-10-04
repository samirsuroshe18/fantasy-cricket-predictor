// The demo account lives under this address. Real accounts cannot use the domain,
// so nobody can sign up as something that looks like part of the demo.
const DEMO_DOMAIN = '@fantasy.demo';
const DEMO_EMAIL = `demo${DEMO_DOMAIN}`;
// published on the login page: anyone may use the demo account
const DEMO_PASSWORD = 'Demo@123';

const isDemoEmail = (email) => typeof email === 'string' && email.toLowerCase().endsWith(DEMO_DOMAIN);

export { DEMO_DOMAIN, DEMO_EMAIL, DEMO_PASSWORD, isDemoEmail }
