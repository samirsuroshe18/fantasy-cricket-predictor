import dns from 'dns';

const LOOPBACK = ['127.0.0.1', '::1'];
const PUBLIC_DNS = ['1.1.1.1', '8.8.8.8'];

// true when Node has no DNS server other than this machine itself
const hasNoUsableDns = (servers) => servers.every((server) => LOOPBACK.includes(server));

// A mongodb+srv:// address is found through a DNS lookup that Node does itself.
// On some networks Node ends up with only 127.0.0.1 as its DNS server and the lookup
// is refused, although the operating system resolves names fine. Public DNS servers
// are used in that case only, so a working setup is never overridden.
const useFallbackDnsIfNeeded = () => {
    if (hasNoUsableDns(dns.getServers())) {
        dns.setServers(PUBLIC_DNS);
    }
};

export { hasNoUsableDns, useFallbackDnsIfNeeded }
