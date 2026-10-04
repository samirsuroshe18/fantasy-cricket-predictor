import net from 'net';

// An IPv6 address written out as its eight groups, or null when it is not one
const groupsOf = (address) => {
    if (net.isIP(address) !== 6 || address.includes('.')) return null;

    const [head, tail] = address.split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const missing = address.includes('::') ? 8 - left.length - right.length : 0;

    return [...left, ...Array(missing).fill('0'), ...right].map((group) => group.toLowerCase().replace(/^0+(?=.)/, ''));
};

// One IPv6 connection has a whole network of addresses (a /64) to pick from, so the
// network is the visitor. An IPv4 address is the visitor as it is.
const networkOf = (address) => {
    const groups = groupsOf(address);
    return groups ? `${groups.slice(0, 4).join(':')}::/64` : address;
};

// The server sits behind the web app's proxy and the host's own. The first forwarded
// address is the visitor when the request came through the web app. Someone who calls
// the server directly can make that header up, so it is used only when it is an
// address at all, and limits that matter are also kept for the address the request
// really arrived from (connectionOf).
const visitorOf = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';

    return net.isIP(first) ? networkOf(first) : (req.ip || 'unknown');
};

// The address the request really arrived from. Normally that is the connecting address.
// Some hosts put proxies of their own in between, so the connecting address is one of
// theirs; such a host passes the caller's address in a header that a caller cannot set
// (Cloudflare: cf-connecting-ip). CONNECTION_IP_HEADER names that header. It must only
// be set where the host really overwrites it.
const connectionOf = (req) => {
    const header = (process.env.CONNECTION_IP_HEADER || '').trim().toLowerCase();
    const reported = header ? req.headers[header] : '';

    return typeof reported === 'string' && net.isIP(reported.trim()) ? networkOf(reported.trim()) : (req.ip || 'unknown');
};

export { visitorOf, connectionOf }
