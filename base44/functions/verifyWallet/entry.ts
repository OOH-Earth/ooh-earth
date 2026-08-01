// Server-side wallet ownership verification.
// Validates that a signature was produced by the claimed wallet address
// for the exact message signed — cryptographically, not just a local flag.
// Supports EVM (personal_sign / EIP-191) and Solana (nacl detached verify).

import { verifyMessage } from "npm:ethers@6.13.4";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@4.0.1";

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, signature, message, chain, ts } = body;

    if (!address || !signature || !message || !chain || !ts) {
      return Response.json(
        { verified: false, error: "Missing required fields (address, signature, message, chain, ts)" },
        { status: 400 }
      );
    }

    // Replay protection — timestamp must be within 5 minutes of server time
    const timestamp = Number(ts);
    if (!timestamp || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return Response.json(
        { verified: false, error: "Timestamp expired or invalid" },
        { status: 400 }
      );
    }

    let verified = false;

    try {
      if (chain === "evm") {
        // ethers.verifyMessage handles EIP-191 personal_sign prefixing automatically
        const recovered = verifyMessage(String(message), String(signature));
        verified = recovered.toLowerCase() === String(address).toLowerCase();
      } else if (chain === "solana") {
        const msgBytes = new TextEncoder().encode(String(message));
        const sigBytes = base64ToUint8Array(String(signature));
        const pubBytes = bs58.decode(String(address));
        verified = nacl.sign.detached.verify(msgBytes, sigBytes, pubBytes);
      } else {
        return Response.json(
          { verified: false, error: `Unsupported chain: ${chain}` },
          { status: 400 }
        );
      }
    } catch {
      // Malformed signature / decode failure → not verified, not a server error
      verified = false;
    }

    return Response.json({ verified });
  } catch (error) {
    console.error("verifyWallet error:", error?.message || error);
    return Response.json(
      { verified: false, error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}