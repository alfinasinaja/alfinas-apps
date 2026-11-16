import { useEffect, useState } from 'react';
import content from './content.json';
import './styles.css';
import QrisPayment from './QrisPayment.jsx';

const ICONS = {
  book: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12Z M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12Z',
  bag: 'M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2',
  check: 'M5 12l4 4 10-10',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rupiah = (n) => `Rp ${n.toLocaleString('id-ID')}`;

function readStore(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStore(key, value) {
  try { localStorage.setItem(key, value); } catch { /* penyimpanan tidak tersedia */ }
}

function Icon({ name, size = 30, strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.book} />
    </svg>
  );
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = readStore('apps-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStore('apps-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

function buildWhatsAppUrl({ number, app, name, email, device, statusLabel, donated, amount }) {
  const lines = [
    'Halo kak,',
    donated
      ? `saya ingin mendukung aplikasi ${app.name}.`
      : `saya ingin mendukung aplikasi ${app.name}, tapi belum traktir kopi.`,
    '',
    `Nama: ${name}`,
    `Email: ${email}`,
    `Perangkat: ${device}`,
    `Status: ${statusLabel}`,
    '',
    'Semangat terus yaa kak kembangin aplikasinya.',
  ];
  if (donated) {
    lines.push(
      '',
      `saya izin berkontribusi untuk traktir kopi ${amount ? `sebesar *${rupiah(amount)}*` : 'dengan nominal bebas'}`,
      'Berikut saya lampirkan bukti traktir kopinya yaa kak',
    );
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function Phone({ src, alt, label }) {
  return (
    <div className="phone">
      {src ? <img src={src} alt={alt} /> : <div className="ph">{label}</div>}
    </div>
  );
}

function AppSection({ app, onPick }) {
  return (
    <section id={app.id} className="wrap block">
      <div className="detail">
        <div>
          <span className="tag">{app.tag}</span>
          <h2 className="h2">{app.name}</h2>
          <p className="lead">{app.description}</p>
          <p className="meta">Tersedia untuk {app.platform}</p>
          <h3 className="h3">Fitur utama</h3>
          <ul className="features">
            {app.features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => onPick(app.id)}>
              Dukung aplikasi ini
            </button>
          </div>
        </div>
        <div className="shots" aria-label={`Screenshot ${app.name}`}>
          {app.screenshots.length
            ? app.screenshots.map((src, i) => (
                <Phone key={src} src={src} alt={`${app.name}, screenshot ${i + 1}`} />
              ))
            : [1, 2, 3].map((n) => (
                <Phone key={n} label={`Screenshot ${n}`} />
              ))}
        </div>
      </div>
    </section>
  );
}

function Donation({ donation, apps, selectedId, onSelect }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [device, setDevice] = useState(donation.devices[0]);
  const [status, setStatus] = useState('');
  const [amount, setAmount] = useState(0);

  const app = apps.find((a) => a.id === selectedId);
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const statusItem = donation.donationStatus.find((s) => s.value === status);
  const donated = status === 'donated';
  const missing = [
    !app && 'pilih aplikasi',
    !trimmedName && 'nama',
    !EMAIL_RE.test(trimmedEmail) && 'email yang valid',
    !statusItem && 'status traktir kopi',
  ].filter(Boolean);
  const ready = missing.length === 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!ready) return;
    const url = buildWhatsAppUrl({
      number: donation.whatsappNumber,
      app,
      name: trimmedName,
      email: trimmedEmail,
      device,
      statusLabel: statusItem.label,
      donated,
      amount,
    });
    window.open(url, '_blank', 'noopener');
  }

  return (
    <section id="traktir kopi" className="wrap block">
      <h2 className="h2">{donation.heading}</h2>
      <p className="lead">{donation.intro}</p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>
            <span className="step">
              <span className="num">1</span>
              <span className="step-title">Pilih aplikasi yang ingin didukung</span>
            </span>
          </legend>
          <div className="apps">
            {apps.map((a) => (
              <label className="opt" key={a.id}>
                <input
                  type="radio"
                  name="app"
                  value={a.id}
                  checked={selectedId === a.id}
                  onChange={() => onSelect(a.id)}
                />
                <span className="card" style={{ '--c': a.color }}>
                  <span className="card-head">
                    <span className="icon"><Icon name={a.icon} /></span>
                    <span className="check"><Icon name="check" size={16} strokeWidth={3} /></span>
                  </span>
                  <h3>{a.name}</h3>
                  <p>{a.shortDescription}</p>
                  <span className="tag">{a.tag}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="row2">
          <div className="clay">
            <div className="step"><span className="num">2</span><span className="step-title">Isi data kamu</span></div>
            <div className="field">
              <label htmlFor="name">Nama lengkap</label>
              <input id="name" type="text" autoComplete="name" value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Contoh: Rina Maharani" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
            </div>
            <div className="field">
              <label htmlFor="device">Perangkat</label>
              <select id="device" value={device} onChange={(e) => setDevice(e.target.value)}>
                {donation.devices.map((d) => <option key={d}>{d}</option>)}
              </select>
              <p className="note">{donation.deviceNote}</p>
            </div>
            <fieldset className="status">
              <legend className="step-label">Status traktir kopi</legend>
              {donation.donationStatus.map((s) => (
                <label className="radio" key={s.value}>
                  <input type="radio" name="status" value={s.value}
                    checked={status === s.value} onChange={() => setStatus(s.value)} />
                  {s.label}
                </label>
              ))}
            </fieldset>
          </div>

          <div className="clay">
            <div className="step"><span className="num">3</span><span className="step-title">Traktir Kopi lewat QRIS</span></div>
            <QrisPayment donation={donation} onAmountChange={setAmount} />
          </div>
        </div>

        <div className="clay confirm">
          <div className="step"><span className="num">4</span><span className="step-title">Konfirmasi Traktir</span></div>
          <button className="btn btn-block" type="submit" disabled={!ready}>
            {!ready
              ? 'Lengkapi data untuk konfirmasi'
              : donated
                ? `Konfirmasi traktir untuk ${app.name} sebagai ${trimmedName} (${trimmedEmail})`
                : `Kirim data untuk ${app.name} sebagai ${trimmedName} (${trimmedEmail})`}
          </button>
          <p className="note" aria-live="polite">
            {!ready
              ? `Belum lengkap: ${missing.join(', ')}.`
              : donated
                ? 'Pesan akan dibuka di WhatsApp. Lampirkan bukti transfer QRIS di sana.'
                : 'Pesan akan dibuka di WhatsApp. Kamu bisa traktir kopi kapan saja.'}
          </p>
        </div>
      </form>
    </section>
  );
}

export default function App() {
  const { site, donation, apps } = content;
  const [theme, setTheme] = useTheme();
  const [selectedId, setSelectedId] = useState('');
  const dark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  function pick(id) {
    setSelectedId(id);
    document.getElementById('traktir kopi')?.scrollIntoView();
  }

  return (
    <>
      <nav className={`nav${menuOpen ? ' open' : ''}`} aria-label="Navigasi utama">
        <div className="nav-in">
          <a className="brand" href="#top" onClick={closeMenu}>{site.name}</a>
          <button className="burger" type="button" aria-expanded={menuOpen} aria-controls="site-menu"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
          </button>
          <div id="site-menu" className="links">
            {apps.map((a) => <a key={a.id} href={`#${a.id}`} onClick={closeMenu}>{a.navLabel}</a>)}
            <a className="pill" href="#traktir kopi" onClick={closeMenu}>traktir kopi</a>
            <button className="theme" type="button" aria-pressed={dark}
              onClick={() => setTheme(dark ? 'light' : 'dark')}>
              <Icon name={dark ? 'sun' : 'moon'} size={16} />
              {dark ? 'Mode terang' : 'Mode gelap'}
            </button>
          </div>
        </div>
      </nav>

      <header id="top" className="wrap hero">
        <h1>{site.title}</h1>
        <p>{site.subtitle}</p>
        <div className="row">
          <a className="btn" href={`#${apps[0]?.id ?? 'traktir kopi'}`}>Lihat aplikasi</a>
          <a className="btn btn-ghost" href="#traktir kopi">traktir kopi sekarang</a>
        </div>
      </header>

      {apps.map((app) => <AppSection key={app.id} app={app} onPick={pick} />)}

      <Donation donation={donation} apps={apps} selectedId={selectedId} onSelect={setSelectedId} />

      <footer className="wrap foot">{site.footerNote}</footer>
    </>
  );
}