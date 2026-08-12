import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, Send } from 'lucide-react';

export default function LeadCapture() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await base44.functions.invoke('captureLead', {
        name,
        email,
        amount: amount ? Number(amount) : 0,
        message,
      });
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="overflow-hidden border border-ozone/40 bg-card p-4 text-center md:p-6">
        <Check className="mx-auto h-7 w-7 text-ozone" />
        <p className="mt-3 font-display text-lg font-bold text-silver">Signal received</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
          // A team member will reach out
        </p>
        <button
          onClick={() => {
            setDone(false);
            setName('');
            setEmail('');
            setAmount('');
            setMessage('');
          }}
          className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-opacity hover:opacity-70"
        >
          Submit another
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-all placeholder:text-dim focus:border-ozone focus:shadow-[0_0_0_1px_rgba(237,255,0,0.2)]';

  return (
    <form
      onSubmit={submit}
      className="space-y-4 overflow-hidden border border-slate2/60 bg-card p-4 md:p-6"
    >
      <h3 className="font-display text-xl font-bold text-silver">Pledge / partner</h3>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
        // No money now — drop your signal
      </p>
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-slate2/60 bg-slate2/40">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name / org"
          className={`${inputCls} border-0 bg-card`}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email"
          className={`${inputCls} border-0 bg-card`}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Pledge amount (optional)"
          className={inputCls}
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="How you want to help…"
        className={`${inputCls} resize-none`}
      />
      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-all hover:bg-flare hover:border-flare active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? 'Transmitting…' : 'Transmit pledge'}
      </button>
    </form>
  );
}
