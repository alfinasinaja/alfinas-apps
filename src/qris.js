// Konversi QRIS statis ke dinamis (nominal ditanam di payload).
// Alurnya: ubah tag 01 dari 11 ke 12, sisipkan tag 54 (nominal) setelah tag 53,
// buang tag 63 lama, lalu hitung ulang CRC16 di akhir.

export function parseTLV(data) {
  const items = [];
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.slice(i, i + 2);
    const len = parseInt(data.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len) || i + 4 + len > data.length) {
      throw new Error('Format QRIS tidak valid');
    }
    items.push({ tag, value: data.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  return items;
}

const toTLV = (tag, value) => tag + String(value.length).padStart(2, '0') + value;

// CRC16-CCITT (poly 0x1021, init 0xFFFF)
export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function toDynamicQris(staticPayload, amount) {
  const kept = parseTLV(staticPayload)
    .filter((t) => t.tag !== '63' && t.tag !== '54')
    .map((t) => (t.tag === '01' ? { tag: '01', value: '12' } : t));

  const idx = kept.findIndex((t) => t.tag === '53');
  const at = idx >= 0 ? idx + 1 : kept.length;
  kept.splice(at, 0, { tag: '54', value: String(amount) });

  const body = kept.map((t) => toTLV(t.tag, t.value)).join('') + '6304';
  return body + crc16(body);
}
