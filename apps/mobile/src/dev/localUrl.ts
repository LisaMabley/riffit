// Parsed by hand because React Native's URL class doesn't reliably implement `hostname`.
// http only: the local stack never uses TLS, and hosted Supabase never goes without it.
const HTTP_HOST = /^http:\/\/([^/:?#@]+)(?::\d+)?(?:[/?#]|$)/i;

const LOCAL_HOST =
  /^(localhost|127(\.\d{1,3}){3}|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})$/i;

// Loopback or a private LAN address. A phone reaches the local stack through the computer's LAN
// address, so requiring localhost wouldn't work.
export function isLocalUrl(url: string): boolean {
  const host = HTTP_HOST.exec(url)?.[1];
  return host !== undefined && LOCAL_HOST.test(host);
}
