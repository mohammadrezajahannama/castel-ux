/** Reads a result code (`CASTEL1R:` plain, `CASTEL1Z:` deflate-raw), as the test pages' encode() writes it. */
export async function decodeResultCode(code: string): Promise<unknown> {
  const match = /^CASTEL1([RZ]):([A-Za-z0-9_-]+)$/.exec(code.trim());
  if (!match) throw new Error("not a result code");
  const bin = atob(match[2].replace(/-/g, "+").replace(/_/g, "/"));
  let bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (match[1] === "Z") {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
