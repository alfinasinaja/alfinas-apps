import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { toDynamicQris } from './qris.js';

const rupiah = (n) => `Rp ${n.toLocaleString('id-ID')}`;

export default function QrisPayment({ donation, onAmountChange }) {
  const { qrisStatic, presetAmounts, customLabel, minAmount, maxAmount, qrisPlaceholder, qrisNote } = donation;
  const hasQris = typeof qrisStatic === 'string' && qrisStatic.startsWith('0002');

  const [choice, setChoice] = useState('none'); // 'none' | nominal preset | 'custom'
  const [custom, setCustom] = useState('');
  const [svg, setSvg] = useState('');

  const customValue = Number(custom.replace(/\D/g, ''));
  const customValid = custom !== '' && customValue >= minAmount && customValue <= maxAmount;

  let amount = 0;
  if (choice === 'custom') amount = customValid ? customValue : 0;
  else if (choice !== 'none') amount = Number(choice);

  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  const payload = useMemo(() => {
    if (!hasQris) return '';
    return amount ? toDynamicQris(qrisStatic, amount) : qrisStatic;
  }, [hasQris, qrisStatic, amount]);

  useEffect(() => {
    let alive = true;
    if (!payload) {
      setSvg('');
      return undefined;
    }
    QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#2A1B5C', light: '#FFFFFF' },
    })
      .then((s) => { if (alive) setSvg(s); })
      .catch(() => { if (alive) setSvg(''); });
    return () => { alive = false; };
  }, [payload]);

  const chip = (value, label) => (
    <button key={value} type="button" role="radio" className="chip"
      aria-checked={choice === value} onClick={() => setChoice(value)}>
      {label}
    </button>
  );

  let hint;
  if (!hasQris) hint = 'QRIS statis belum diisi di content.json.';
  else if (amount) hint = `QR ini sudah berisi nominal ${rupiah(amount)}.`;
  else if (choice === 'custom') hint = `Isi nominal antara ${rupiah(minAmount)} dan ${rupiah(maxAmount)}. Sementara QR tanpa nominal.`;
  else hint = 'QR tanpa nominal. Isi jumlah donasi di aplikasi pembayaranmu.';

  return (
    <>
      <div className="chips" role="radiogroup" aria-label="Pilih nominal donasi">
        {presetAmounts.map((n) => chip(String(n), rupiah(n)))}
        {chip('custom', customLabel)}
      </div>

      {choice === 'custom' && (
        <div className="field">
          <label htmlFor="custom-amount">Nominal (Rp)</label>
          <input id="custom-amount" type="text" inputMode="numeric" value={custom}
            onChange={(e) => setCustom(e.target.value)} placeholder={`Minimal ${rupiah(minAmount)}`} />
        </div>
      )}

      <div className="qris">
        {svg
          ? <div className="qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
          : <div className="qris-ph">{qrisPlaceholder}</div>}
      </div>
      <p className="note center">{qrisNote}</p>
      <p className="note center" aria-live="polite">{hint}</p>
    </>
  );
}
