import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');

function getSolanaProvider() {
  if (typeof window === 'undefined') return null;
  const p = window.solana || window.phantom?.solana;
  return p && p.isPhantom ? p : null;
}

function getEvmProvider() {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
}

// Solana signMessage returns a Uint8Array — convert to base64 for HTTP transport
function uint8ToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function useWallet(chain) {
  const key = `ooh_wallet_${chain}`;
  // Do NOT restore address or verified from localStorage on mount.
  // Address: wait for the provider to confirm the account is still connected.
  // Verified: must be freshly confirmed by the server each session — never trusted from storage.
  const [address, setAddress] = useState(null);
  const [verified, setVerified] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reconnecting, setReconnecting] = useState(true);
  const [available, setAvailable] = useState(true);
  const [verifyError, setVerifyError] = useState(null);

  useEffect(() => {
    const provider = chain === 'solana' ? getSolanaProvider() : getEvmProvider();
    setAvailable(!!provider);
    if (!provider) {
      setReconnecting(false);
      return;
    }

    const tryReconnect = async () => {
      try {
        let a = null;
        if (chain === 'solana') {
          if (provider.isConnected && provider.publicKey) {
            a = provider.publicKey.toString();
          }
        } else {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length) a = accounts[0];
        }
        // Only set address if the provider confirms the account is still connected
        if (a) {
          setAddress(a);
          localStorage.setItem(key, a);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      } finally {
        setReconnecting(false);
      }
    };
    tryReconnect();

    const onAccountChanged = (info) => {
      const a =
        chain === 'solana'
          ? info?.publicKey?.toString()
          : Array.isArray(info)
            ? info[0]
            : typeof info === 'string'
              ? info
              : null;
      if (a) {
        setAddress(a);
        localStorage.setItem(key, a);
      } else {
        setAddress(null);
        localStorage.removeItem(key);
      }
      // Verification is voided on any account change
      setVerified(false);
      setVerifyError(null);
    };

    if (chain === 'solana') {
      provider.on?.('accountChanged', onAccountChanged);
      provider.on?.('disconnect', () => {
        setAddress(null);
        localStorage.removeItem(key);
        setVerified(false);
        setVerifyError(null);
      });
    } else {
      provider.on?.('accountsChanged', onAccountChanged);
    }

    return () => {
      provider.removeListener?.('accountChanged', onAccountChanged);
      provider.removeListener?.('accountsChanged', onAccountChanged);
    };
  }, [chain]);

  const connect = useCallback(async () => {
    const provider = chain === 'solana' ? getSolanaProvider() : getEvmProvider();
    if (!provider) {
      window.open(
        chain === 'solana' ? 'https://phantom.app/' : 'https://metamask.io/download/',
        '_blank',
      );
      return;
    }
    setConnecting(true);
    try {
      let a;
      if (chain === 'solana') {
        const resp = await provider.connect();
        a = resp?.publicKey?.toString();
      } else {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        a = Array.isArray(accounts) ? accounts[0] : accounts;
      }
      if (a) {
        setAddress(a);
        localStorage.setItem(key, a);
      }
    } catch {
    } finally {
      setConnecting(false);
    }
  }, [chain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setVerified(false);
    setVerifyError(null);
    localStorage.removeItem(key);
    const provider = chain === 'solana' ? getSolanaProvider() : getEvmProvider();
    provider?.disconnect?.();
  }, [chain]);

  const verifyOwnership = useCallback(async () => {
    if (!address) return false;
    const provider = chain === 'solana' ? getSolanaProvider() : getEvmProvider();
    if (!provider) return false;

    setVerifying(true);
    setVerifyError(null);
    try {
      const ts = Date.now();
      const message = `OOH Earth wallet verification\nAddress: ${address}\nTime: ${ts}\n\nSigning this message proves you own this wallet. No transaction is made.`;

      let signature;
      if (chain === 'solana') {
        const encoded = new TextEncoder().encode(message);
        const sigResult = await provider.signMessage(encoded, 'utf8');
        signature = uint8ToBase64(sigResult);
      } else {
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, address],
        });
      }

      // Server-side cryptographic verification — the signature is validated
      // against the claimed address. Only the server response is trusted.
      const res = await base44.functions.invoke('verifyWallet', {
        address,
        signature,
        message,
        chain,
        ts: String(ts),
      });

      if (res?.data?.verified) {
        setVerified(true);
        return true;
      }
      setVerifyError(res?.data?.error || 'Signature verification failed');
      return false;
    } catch (e) {
      setVerifyError(e?.message || 'Verification failed');
      return false;
    } finally {
      setVerifying(false);
    }
  }, [chain, address]);

  return {
    address,
    shortAddress: short(address),
    connecting,
    reconnecting,
    verifying,
    verified,
    verifyError,
    available,
    connect,
    disconnect,
    verifyOwnership,
  };
}
