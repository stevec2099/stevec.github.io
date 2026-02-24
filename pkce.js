
// PKCE helper functions
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

function base64urlencode(a) {
  let str = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < a.length; i += chunkSize) {
    str += String.fromCharCode.apply(null, a.subarray(i, i + chunkSize));
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}

function generateRandomString(length = 128) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Map to URL-safe characters
  return base64urlencode(array).slice(0, length);
}
