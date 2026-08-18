# NFT / Web3 Status — Precise Capability Audit

Per the mission's explicit format: every capability classified as REAL ON
CHAIN, PREPARED, EXTERNAL, or NOT IMPLEMENTED. No claim below is asserted
without having read the actual implementing code this session (`useWallet.jsx`,
`MintLocationPanel.jsx`, `NftCreator.jsx`, `NftStudioPanel.jsx`, `Mint.jsonc`).

| Capability | Classification | Evidence |
|---|---|---|
| Wallet connection | **REAL** | `useWallet.jsx` — real `window.ethereum.request({method:'eth_requestAccounts'})` (EVM) / Phantom `provider.connect()` (Solana). Not simulated. |
| Signing | **REAL** | `verifyOwnership()` in `useWallet.jsx` — real `personal_sign`/Solana `signMessage`, verified server-side via `base44.functions.invoke('verifyWallet', ...)`. The app trusts only the server's cryptographic verification result, not the client-reported signature. |
| Market data | **REAL** | `/zora` page shows live Zora market data (chart rendering confirmed working, recharts 3.x). |
| Metadata | **REAL/PREPARED** | `buildMetadata()` in `MintLocationPanel.jsx` builds a real NFT metadata JSON (name, description, image, attributes incl. lat/lng/SDG/status) and uploads it via `base44.integrations.Core.UploadFile` — a real file exists at a real URL after this step. |
| Location relationship | **REAL** | Metadata directly embeds the source `Location` record's real fields (title, type, coordinates, image). |
| Creative relationship | **PARTIAL** | `NftStudioPanel`'s trading-card visuals (casing/finish/label/artwork) are **not** connected to `MintLocationPanel`'s metadata — they're two separate, unconnected features under `/lab/nft` vs. the location detail page's mint panel. |
| Mint preparation | **PREPARED** | `Mint` entity record created with `status: 'prepared'`, `metadata_uri` pointing at the real uploaded JSON, `operative_address` from the connected wallet. This is a real database record, not a placeholder. |
| Actual on-chain minting | **EXTERNAL — NOT IMPLEMENTED IN-APP** | The UI explicitly sends the user to `https://zora.co/create` with instructions to paste the metadata URI. The app itself never constructs, signs, or broadcasts a mint transaction. |
| Ownership | **NOT VERIFIED ON-CHAIN** | After minting externally, the user manually pastes a token address back into the app (`markMinted()`), which sets `status: 'minted'` — this is **self-reported**, not read from the chain. The app never queries Base or Solana to confirm the mint happened or who owns it. |
| Display / collectibles | **PARTIAL** | `NftStudioPanel` renders a visual trading-card preview (3D slab viewer) — real rendering, but disconnected from any verified on-chain asset. |
| User trophies on NFT | **NOT IMPLEMENTED (shipped)** — prototype exists, unshipped | A working badge→NFT-studio prefill deep-link (earned badge's title/grade/color pre-fills the studio) was built and verified in an earlier loop this session, then deliberately shelved as out-of-priority-order. Sits in local git history only. See Decision E. |
| Physical collectible readiness | **CONTENT ONLY** | `/store` sells a physical trading card ($25) tied to the *visual design* produced by `NftStudioPanel`, not to any verified on-chain token. No production/fulfillment integration exists beyond the store listing itself. |

## Honesty check (explicitly required by the mission)

No code in this repository claims in-app on-chain minting happens. The UI
copy was already fixed in an earlier convergence effort (PR #77) to say
"View Zora Markets" instead of "Mint on Zora," and `NftStudioPanel.jsx`
carries an explicit code comment: "`/zora` is a display-only market page
(sample coin data) -- it has no mechanism to receive this artwork/config, so
this deliberately doesn't claim to mint it." This pass found no new honesty
gap to fix and introduced no new claims.

## What real on-chain minting would require (not built — see Decision D)

1. A deployed, audited smart contract (or committing to Zora's own contract
   as the permanent destination — current de facto state)
2. A choice of chain (Base vs. Solana — both already modeled in `Mint.jsonc`)
3. A decision on who pays gas, and whether the app custodies any signing
   authority (currently: none — all signing is client-side wallet-only)
4. A chain-read integration (RPC or indexer) to verify ownership/mint status
   instead of trusting a self-reported token address
