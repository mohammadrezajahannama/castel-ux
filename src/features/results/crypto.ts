import { storage } from "@/lib/storage";

/**
 * The admin's key pair, and the username and password that unlock it.
 *
 * Test pages encrypt each result with the public key (site/shared/ux-submit.js: RSA-OAEP-256 wraps an AES-256-GCM
 * key). The private key opens them. It is kept in the site as a "vault": encrypted with a key derived from the
 * username and password (PBKDF2-SHA-256, 600,000 rounds, then AES-256-GCM). The site has no server, so the vault is
 * public: only a strong password keeps it closed, and a forgotten password can't be reset.
 *
 * Signing in opens the vault and keeps the private key for this tab (or, if asked, for this browser).
 */

const RSA = { name: "RSA-OAEP", hash: "SHA-256" } as const;
const ROUNDS = 600_000;
const SESSION_KEY = "ux-admin-session";
export const MIN_PASSWORD = 12;

/** The vault as site/shared/admin-vault.json holds it. */
export interface Vault {
  type: "castel-ux-admin-vault";
  v: 1;
  /** Short id of the key pair; the public key carries it as `kid`, so a result names the key it needs. */
  kid: string;
  createdAt: string;
  rounds: number;
  salt: string;
  iv: string;
  /** The private key (JWK), encrypted. */
  ct: string;
  publicKey: JsonWebKey & { kid?: string };
}

interface Session {
  kid: string;
  privateKey: JsonWebKey;
}

const b64url = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

// sessionStorage keeps the key until the tab closes; localStorage too, when "stay signed in" was ticked.
const session = {
  get(): Session | null {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SESSION_KEY);
    } catch {
      // No sessionStorage: try localStorage.
    }
    raw ??= storage.get(SESSION_KEY);
    try {
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },
  set(value: Session, remember: boolean) {
    const raw = JSON.stringify(value);
    try {
      sessionStorage.setItem(SESSION_KEY, raw);
    } catch {
      // Not kept for this tab; localStorage below may still keep it.
    }
    if (remember) storage.set(SESSION_KEY, raw);
  },
  clear() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to remove.
    }
    storage.remove(SESSION_KEY);
  },
};

export const getSessionKid = () => session.get()?.kid ?? null;
export const hasKey = () => session.get() !== null;
export const forgetKey = () => session.clear();

/** The vault this site was built with (site/shared/admin-vault.json), or null before the admin account is set up. */
export async function loadVault(): Promise<Vault | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}../shared/admin-vault.json`, { cache: "no-store" });
    if (!response.ok) return null;
    const vault = (await response.json()) as Vault;
    return vault?.type === "castel-ux-admin-vault" ? vault : null;
  } catch {
    return null;
  }
}

// The username is part of what unlocks the vault (it is not stored in it), so both must be right.
async function passwordKey(username: string, password: string, salt: Uint8Array, rounds: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${username.trim().toLowerCase()}\n${password}`),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: rounds },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Makes the key pair and locks it with the username and password. Signs in on this tab. */
export async function createVault(username: string, password: string): Promise<Vault> {
  const pair = await crypto.subtle.generateKey(
    { ...RSA, modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["encrypt", "decrypt"],
  );
  const kid = b64url(crypto.getRandomValues(new Uint8Array(4)));
  const [privateKey, publicJwk] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.privateKey),
    crypto.subtle.exportKey("jwk", pair.publicKey),
  ]);
  const { kty, n, e, alg } = publicJwk;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const lock = await passwordKey(username, password, salt, ROUNDS);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    lock,
    new TextEncoder().encode(JSON.stringify(privateKey)),
  );

  session.set({ kid, privateKey }, false);
  return {
    type: "castel-ux-admin-vault",
    v: 1,
    kid,
    createdAt: new Date().toISOString(),
    rounds: ROUNDS,
    salt: b64url(salt),
    iv: b64url(iv),
    ct: b64url(new Uint8Array(ct)),
    publicKey: { kty, n, e, alg, kid, ext: true, key_ops: ["encrypt"] },
  };
}

/** Opens the vault and signs in. False when the username or the password is wrong. */
export async function unlockVault(vault: Vault, username: string, password: string, remember: boolean) {
  try {
    const lock = await passwordKey(username, password, fromB64url(vault.salt), vault.rounds);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64url(vault.iv) },
      lock,
      fromB64url(vault.ct),
    );
    session.set({ kid: vault.kid, privateKey: JSON.parse(new TextDecoder().decode(plain)) }, remember);
    return true;
  } catch {
    return false;
  }
}

let privateKey: Promise<CryptoKey> | null = null;
let privateKid = "";

/** Opens a `CASTELENC1:` payload into the result code inside it. */
export async function decryptPayload(payload: string): Promise<string> {
  const current = session.get();
  if (!current) throw new Error("signed out");
  if (!privateKey || privateKid !== current.kid) {
    privateKid = current.kid;
    privateKey = crypto.subtle.importKey("jwk", current.privateKey, RSA, false, ["decrypt"]);
  }
  const box = JSON.parse(new TextDecoder().decode(fromB64url(payload.replace(/^CASTELENC1:/, "")))) as {
    ek: string;
    iv: string;
    ct: string;
  };
  const raw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, await privateKey, fromB64url(box.ek));
  const aes = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64url(box.iv) }, aes, fromB64url(box.ct));
  return new TextDecoder().decode(plain);
}
