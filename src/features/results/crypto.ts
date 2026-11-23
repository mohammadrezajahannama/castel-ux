import { storage } from "@/lib/storage";

/**
 * The admin's key pair. Test pages encrypt each result with the public key (site/shared/ux-submit.js: RSA-OAEP-256
 * wraps an AES-256-GCM key); only the private key, kept in this browser, opens them. Losing every copy of the private
 * key means the results sent with its public key can't be read, so creating one also downloads a backup file.
 */

const STORAGE_KEY = "ux-admin-key";
const RSA = { name: "RSA-OAEP", hash: "SHA-256" } as const;

export interface KeyFile {
  type: "castel-ux-admin-key";
  createdAt: string;
  /** Short id shared by both halves; the public key carries it as `kid`, so a result names the key it needs. */
  kid: string;
  privateKey: JsonWebKey;
  publicKey: JsonWebKey & { kid?: string };
}

export const getKeyFile = (): KeyFile | null => {
  const raw = storage.get(STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseKeyFile(raw);
  } catch {
    return null;
  }
};

export const hasKey = () => getKeyFile() !== null;

export const forgetKey = () => storage.remove(STORAGE_KEY);

/** Checks a key file's text (a backup) and keeps it in this browser. Throws when it isn't one. */
export const saveKeyFile = (text: string) => {
  const file = parseKeyFile(text);
  storage.set(STORAGE_KEY, JSON.stringify(file));
  return file;
};

function parseKeyFile(text: string): KeyFile {
  const file = JSON.parse(text) as KeyFile;
  if (file?.type !== "castel-ux-admin-key" || !file.privateKey?.d || !file.publicKey?.n) throw new Error("not a key");
  return file;
}

export async function createKeyFile(): Promise<KeyFile> {
  const pair = await crypto.subtle.generateKey(
    { ...RSA, modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["encrypt", "decrypt"],
  );
  const kid = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("");
  const [privateKey, publicKey] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.privateKey),
    crypto.subtle.exportKey("jwk", pair.publicKey),
  ]);
  return {
    type: "castel-ux-admin-key",
    createdAt: new Date().toISOString(),
    kid,
    privateKey,
    publicKey: { ...publicKey, kid },
  };
}

/** The public key as config.js takes it: `window.UX_PUBLIC_KEY = {…}`. */
export const publicKeyConfig = (file: KeyFile) => {
  const { kty, n, e, alg, kid } = file.publicKey;
  return JSON.stringify({ kty, n, e, alg, kid, ext: true, key_ops: ["encrypt"] });
};

export function downloadKeyFile(file: KeyFile) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `castel-ux-admin-key-${file.kid}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

let privateKey: Promise<CryptoKey> | null = null;
let privateKid = "";

/** Opens a `CASTELENC1:` payload into the result code inside it. */
export async function decryptPayload(payload: string): Promise<string> {
  const file = getKeyFile();
  if (!file) throw new Error("no key");
  if (!privateKey || privateKid !== file.kid) {
    privateKid = file.kid;
    privateKey = crypto.subtle.importKey("jwk", file.privateKey, RSA, false, ["decrypt"]);
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
