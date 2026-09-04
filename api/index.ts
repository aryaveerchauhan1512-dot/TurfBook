import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Self-contained matching helpers for Vercel Serverless (no cross-boundary src/ imports)
function smartMatchDistrict(cityA?: string, cityB?: string): boolean {
  if (!cityA || !cityB) return false;
  const a = cityA.toLowerCase().trim();
  const b = cityB.toLowerCase().trim();
  return a.includes(b) || b.includes(a);
}

function smartMatchTurf(turf: any, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();
  const text = `${turf.name || ''} ${turf.address || ''} ${turf.city || ''} ${(turf.sports || []).join(' ')}`.toLowerCase();
  if (text.includes(q)) return true;
  const tokens = q.split(/[\s,+/]+/).filter(Boolean);
  return tokens.some(t => text.includes(t) || smartMatchDistrict(turf.city, t));
}

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '25mb' }));

// Robust URL normalization for Vercel rewrites & serverless invocations
app.use((req, res, next) => {
  const matchedPath = (req.headers['x-matched-path'] as string) || '';
  const invokePath = (req.headers['x-invoke-path'] as string) || '';

  // If Vercel rewrote the URL to /api/index or /api, recover original path
  if (req.url === '/api/index' || req.url === '/api' || req.url === '/index' || req.url === '/') {
    if (matchedPath && matchedPath !== '/api/index' && matchedPath !== '/api') {
      req.url = matchedPath;
    } else if (invokePath && invokePath !== '/api/index' && invokePath !== '/api') {
      req.url = invokePath;
    } else if (req.originalUrl && req.originalUrl.startsWith('/api/') && req.originalUrl !== '/api/index') {
      req.url = req.originalUrl;
    }
  }

  const orig = req.originalUrl || req.url || '';
  if (orig.startsWith('/auth/') || orig.startsWith('/turfs') || orig.startsWith('/admin') || orig.startsWith('/bookings') || orig.startsWith('/user')) {
    req.url = '/api' + orig;
  }
  next();
});

// OTP In-Memory Store
const otpStore = new Map<string, { otp: string; expiresAt: number; verified?: boolean }>();

// Brevo Transactional Email Service
async function sendBrevoOtpEmail(
  recipientEmail: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = (
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.BREVO_API ||
    process.env.VITE_BREVO_API_KEY ||
    process.env.NEXT_PUBLIC_BREVO_API_KEY ||
    process.env.brevo_api_key ||
    process.env.BREVO_TOKEN ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  const rawSender = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_SENDER ||
    process.env.SMTP_FROM ||
    process.env.VITE_BREVO_SENDER_EMAIL ||
    process.env.brevo_sender_email ||
    'turfbook.support@gmail.com'
  ).trim().replace(/^["']|["']$/g, '');
  const senderEmail = rawSender.replace(/\s+/g, '');
  const senderName = (
    process.env.BREVO_SENDER_NAME ||
    process.env.VITE_BREVO_SENDER_NAME ||
    'TurfBook Verification'
  ).trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY is not configured in Vercel environment variables.');
    return {
      success: false,
      error: 'BREVO_API_KEY was not detected in Vercel. Please check your Vercel Project Settings > Environment Variables, make sure Production is checked, and Redeploy.',
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .badge { display: inline-block; background-color: #2e7d32; color: #ffffff; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #15803d; background: #f0fdf4; border: 2px dashed #86efac; border-radius: 8px; text-align: center; padding: 16px 20px; margin: 24px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="text-align: center;">
            <span class="badge">TurfBook Account Security</span>
            <h2 style="font-size: 22px; font-weight: 800; margin: 8px 0 16px; color: #0f172a;">Verify Your Email</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px;">
              Use the 6-digit verification code below to verify your TurfBook account for <strong>${recipientEmail}</strong>:
            </p>
            <div class="otp-code">${otp}</div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">
              This code will expire in <strong>10 minutes</strong>. Never share this code with anyone.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipientEmail }],
        subject: `Your TurfBook Verification OTP: ${otp}`,
        htmlContent,
      }),
    });

    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[Brevo API Error]', response.status, data);
      const errMsg = data?.message || data?.error || `HTTP ${response.status}`;
      return {
        success: false,
        error: `Brevo email sending failed: ${errMsg}. Verify sender (${senderEmail}) is registered in Brevo.`,
      };
    }

    return { success: true, messageId: data?.messageId };
  } catch (netErr: any) {
    console.error('[Brevo Network Error]', netErr);
    return {
      success: false,
      error: `Could not connect to Brevo API: ${netErr?.message || 'Network error'}`,
    };
  }
}

// In-Memory Database for Vercel Serverless with /tmp persistence fallback
let memoryDb: any = null;
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
const DATA_DIR = isVercel ? path.join('/tmp', 'turfbook-data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

const ENCRYPTION_KEY = crypto.createHash('sha256').update('turfbook-secret-key-2026').digest();
const IV_LENGTH = 16;

function encryptText(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (e) {
    return text;
  }
}

function decryptText(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text;
  }
}

function generateSampleQrCodeUrl(name: string): string {
  const safeName = (name || 'Turf Owner').toLowerCase().replace(/[^a-z0-9]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#ffffff" stroke="#2E7D32" stroke-width="4"/>
    <rect x="20" y="20" width="50" height="50" fill="#2E7D32"/>
    <rect x="30" y="30" width="30" height="30" fill="#ffffff"/>
    <rect x="130" y="20" width="50" height="50" fill="#2E7D32"/>
    <rect x="140" y="30" width="30" height="30" fill="#ffffff"/>
    <rect x="20" y="130" width="50" height="50" fill="#2E7D32"/>
    <rect x="30" y="140" width="30" height="30" fill="#ffffff"/>
    <rect x="80" y="80" width="40" height="40" fill="#2E7D32"/>
    <rect x="90" y="20" width="20" height="20" fill="#1F2937"/>
    <rect x="20" y="90" width="20" height="20" fill="#1F2937"/>
    <rect x="130" y="90" width="30" height="20" fill="#1F2937"/>
    <rect x="90" y="140" width="40" height="30" fill="#1F2937"/>
    <rect x="150" y="140" width="30" height="40" fill="#2E7D32"/>
    <text x="100" y="190" font-family="sans-serif" font-size="10" font-weight="bold" fill="#2E7D32" text-anchor="middle">UPI: ${safeName}@upi</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'turfbook-salt', 1000, 64, 'sha512').toString('hex');
}

const DEFAULT_TURFS: any[] = [];

function getInitialDb() {
  const adminPasswordHash = hashPassword('ilovepotato@123');

  return {
    users: [
      {
        id: 'usr-admin',
        name: 'Super Admin',
        email: 'Admin@1o1',
        role: 'admin',
        passwordHash: adminPasswordHash,
        isVerified: true,
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ],
    turfs: [],
    slots: [],
    bookings: [],
    reviews: [],
    notifications: [],
    ownerApplications: [],
  };
}

function readDb(): any {
  if (!memoryDb) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        memoryDb = JSON.parse(raw);
      }
    } catch (e) {}
  }

  if (!memoryDb) {
    memoryDb = getInitialDb();
  }

  if (!Array.isArray(memoryDb.users)) memoryDb.users = [];
  if (!Array.isArray(memoryDb.turfs)) memoryDb.turfs = [];
  if (!Array.isArray(memoryDb.slots)) memoryDb.slots = [];
  if (!Array.isArray(memoryDb.bookings)) memoryDb.bookings = [];
  if (!Array.isArray(memoryDb.reviews)) memoryDb.reviews = [];
  if (!Array.isArray(memoryDb.notifications)) memoryDb.notifications = [];
  return memoryDb;
}

function writeDb(db: any) {
  memoryDb = db;
  try {
    ensureDataFile();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {}
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address to receive OTP.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(cleanEmail, { otp, expiresAt });
    const result = await sendBrevoOtpEmail(cleanEmail, otp);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({
      success: true,
      emailSent: true,
      message: `OTP sent successfully to ${cleanEmail} via Brevo.`,
    });
  } catch (err: any) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Failed to generate OTP code.' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email or OTP expired. Click "Get OTP" first.' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  if (record.otp !== cleanOtp) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
  }

  record.verified = true;
  otpStore.set(cleanEmail, record);
  return res.json({ success: true, message: 'Email verified successfully!' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'user', phone, businessName, paymentQrUrl, otp } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full Name, Email, and Password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDb();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);

  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists. Please Sign In.' });
  }

  // Check OTP verification
  const otpRecord = otpStore.get(cleanEmail);
  const isOtpValid = (otpRecord && otpRecord.verified) || (otpRecord && otp && otpRecord.otp === otp.toString().trim());

  if (!isOtpValid) {
    return res.status(400).json({ error: 'Please enter and verify the 6-digit OTP code sent to your email.' });
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    email: cleanEmail,
    role: role === 'owner' ? 'owner' : 'user',
    phone: phone ? phone.trim() : '',
    businessName: businessName ? businessName.trim() : undefined,
    paymentQrUrl: paymentQrUrl || undefined,
    passwordHash: hashPassword(password),
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);
  otpStore.delete(cleanEmail);

  const { passwordHash, ...userWithoutPassword } = newUser;
  return res.json({ user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please register.' });
  }

  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  if (user.isBanned || user.isSuspended) {
    return res.status(403).json({ error: 'Your account has been suspended by administration.' });
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return res.json({ user: userWithoutPassword });
});

// Owner QR & Phone update
app.post('/api/owner/qr', (req, res) => {
  const { ownerId, phone, paymentQrUrl } = req.body;
  const db = readDb();
  const owner = db.users.find((u: any) => u.id === ownerId && u.role === 'owner');

  if (!owner) {
    return res.status(404).json({ error: 'Owner account not found.' });
  }

  if (phone) owner.phone = encryptText(phone);
  if (paymentQrUrl) owner.paymentQrUrl = paymentQrUrl;

  // Also update turfs belonging to this owner
  db.turfs.forEach((t: any) => {
    if (t.ownerId === ownerId) {
      if (phone) t.ownerPhone = owner.phone;
      if (paymentQrUrl) t.ownerPaymentQrUrl = paymentQrUrl;
    }
  });

  writeDb(db);
  res.json({ success: true, phone: decryptText(owner.phone), paymentQrUrl: owner.paymentQrUrl });
});

// Turfs Endpoint
app.get('/api/turfs', (req, res) => {
  const { sport, city, search, isIndoor, minRating, maxPrice, facilities } = req.query;
  const db = readDb();

  let result = (db.turfs || []).filter((t: any) => !t.isUnposted);

  if (city && typeof city === 'string' && city !== 'All') {
    result = result.filter((t: any) =>
      smartMatchDistrict(t.city, city) || smartMatchDistrict(t.address, city)
    );
  }

  if (sport && typeof sport === 'string' && sport !== 'All') {
    result = result.filter((t: any) => t.sports && t.sports.includes(sport));
  }

  if (search && typeof search === 'string' && search.trim()) {
    result = result.filter((t: any) => smartMatchTurf(t, search));
  }

  if (isIndoor && isIndoor !== 'all') {
    const indoorBool = isIndoor === 'indoor';
    result = result.filter((t: any) => t.isIndoor === indoorBool);
  }

  if (minRating) {
    result = result.filter((t: any) => t.rating >= parseFloat(minRating as string));
  }

  if (maxPrice) {
    result = result.filter((t: any) => t.pricePerHour <= parseFloat(maxPrice as string));
  }

  if (facilities) {
    const facilityList = (facilities as string).split(',');
    result = result.filter((t: any) => facilityList.every((f) => t.facilities && t.facilities.includes(f)));
  }

  const sanitized = result.map((t: any) => ({
    ...t,
    ownerPhone: decryptText(t.ownerPhone)
  }));

  res.json(sanitized);
});

app.get('/api/turfs/:id', (req, res) => {
  const db = readDb();
  const turf = (db.turfs || []).find((t: any) => t.id === req.params.id);
  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  const reviews = (db.reviews || []).filter((r: any) => r.turfId === turf.id);
  res.json({
    ...turf,
    ownerPhone: decryptText(turf.ownerPhone),
    reviews
  });
});

// Create Turf (Owner required, MANDATORY MIN 3 IMAGES)
app.post('/api/turfs', (req, res) => {
  const {
    ownerId,
    ownerName,
    name,
    tagline,
    description,
    address,
    city,
    sports,
    isIndoor,
    pricePerHour,
    images,
    facilities
  } = req.body || {};

  if (!images || !Array.isArray(images) || images.length < 3) {
    return res.status(400).json({
      error: 'Mandatory requirement: Every turf must have at least 3 uploaded photos before publishing.'
    });
  }

  if (images.length > 15) {
    return res.status(400).json({ error: 'Maximum 15 photos allowed per turf.' });
  }

  if (!name || !address || !city || !pricePerHour || !sports || sports.length === 0) {
    return res.status(400).json({ error: 'Please fill in all required turf information fields.' });
  }

  const db = readDb();
  db.turfs = db.turfs || [];
  db.slots = db.slots || [];
  db.users = db.users || [];

  const owner = db.users.find((u: any) => u.id === ownerId);

  const newTurf: any = {
    id: `turf-${Date.now()}`,
    ownerId,
    ownerName: ownerName || owner?.businessName || owner?.name || 'Turf Owner',
    ownerPhone: owner?.phone || encryptText('+91 98765 43210'),
    ownerPaymentQrUrl: owner?.paymentQrUrl || generateSampleQrCodeUrl(name),
    name: name.trim(),
    tagline: tagline || `${name.trim()} in ${city.trim()}`,
    description: description || 'Modern state-of-the-art sports turf with professional amenities.',
    address: address.trim(),
    city: city.trim(),
    distanceKm: Math.floor(Math.random() * 50) / 10 + 1.2,
    sports,
    isIndoor: Boolean(isIndoor),
    rating: 5.0,
    reviewCount: 0,
    pricePerHour: Number(pricePerHour),
    images,
    facilities: facilities || ['Floodlights', 'Parking', 'Washrooms'],
    isUnposted: false,
    createdAt: new Date().toISOString()
  };

  db.turfs.push(newTurf);

  // Generate slots for this turf for next 3 days
  const timeSlots = [
    '06:00 - 07:00',
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '16:00 - 17:00',
    '17:00 - 18:00',
    '18:00 - 19:00',
    '19:00 - 20:00',
    '20:00 - 21:00'
  ];
  const dates = [
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  ];

  dates.forEach((date) => {
    timeSlots.forEach((time, tIdx) => {
      db.slots.push({
        id: `slot-${newTurf.id}-${date}-${tIdx}`,
        turfId: newTurf.id,
        date,
        time,
        price: newTurf.pricePerHour,
        status: 'available'
      });
    });
  });

  writeDb(db);
  res.json({ success: true, turf: newTurf });
});

// Edit Turf
app.put('/api/turfs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.turfs = db.turfs || [];
  const turfIdx = db.turfs.findIndex((t: any) => t.id === id);

  if (turfIdx === -1) {
    return res.status(404).json({ error: 'Turf listing not found.' });
  }

  const { images } = req.body || {};
  if (images && Array.isArray(images) && images.length < 3) {
    return res.status(400).json({ error: 'Minimum 3 images are required for publishing.' });
  }

  db.turfs[turfIdx] = {
    ...db.turfs[turfIdx],
    ...req.body,
    images: images || db.turfs[turfIdx].images
  };

  writeDb(db);
  res.json({ success: true, turf: db.turfs[turfIdx] });
});

// Unpost / Delete Turf
app.delete('/api/turfs/:id', (req, res) => {
  const db = readDb();
  db.turfs = db.turfs || [];
  const turf = db.turfs.find((t: any) => t.id === req.params.id);
  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  turf.isUnposted = true;
  writeDb(db);
  res.json({ success: true, message: 'Turf listing unposted successfully.' });
});

// Slot API
app.get('/api/turfs/:id/slots', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  const db = readDb();
  db.slots = db.slots || [];
  db.turfs = db.turfs || [];

  const targetDate = (date as string) || new Date().toISOString().split('T')[0];
  let slots = db.slots.filter((s: any) => s.turfId === id && s.date === targetDate);

  if (slots.length === 0) {
    const turf = db.turfs.find((t: any) => t.id === id);
    const price = turf ? turf.pricePerHour : 1500;
    const timeSlots = [
      '06:00 - 07:00',
      '07:00 - 08:00',
      '08:00 - 09:00',
      '09:00 - 10:00',
      '16:00 - 17:00',
      '17:00 - 18:00',
      '18:00 - 19:00',
      '19:00 - 20:00',
      '20:00 - 21:00'
    ];

    slots = timeSlots.map((time, tIdx) => ({
      id: `slot-${id}-${targetDate}-${tIdx}`,
      turfId: id,
      date,
      time,
      price,
      status: 'available'
    }));

    db.slots.push(...slots);
    writeDb(db);
  }

  res.json(slots);
});

// Owner toggle slot status (block / unblock / available)
app.post('/api/turfs/:id/slots/block', (req, res) => {
  const { slotId, status } = req.body || {};
  const db = readDb();
  db.slots = db.slots || [];
  const slot = db.slots.find((s: any) => s.id === slotId);

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  slot.status = status;
  if (status === 'available') {
    slot.bookedByUserId = undefined;
    slot.bookingId = undefined;
  }

  writeDb(db);
  res.json({ success: true, slot });
});

// Bookings Request API
app.post('/api/bookings/request', (req, res) => {
  const { turfId, slotId, userId, userName, userEmail, userPhone, sport } = req.body || {};
  const db = readDb();
  db.turfs = db.turfs || [];
  db.slots = db.slots || [];
  db.bookings = db.bookings || [];
  db.notifications = db.notifications || [];

  const turf = db.turfs.find((t: any) => t.id === turfId);
  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  const slot = db.slots.find((s: any) => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  if (slot.status !== 'available') {
    return res.status(400).json({ error: `This slot is currently ${slot.status}.` });
  }

  const bookingId = `bk-${Date.now()}`;
  const encryptedUserPhone = encryptText(userPhone || '+91 99999 00000');

  const newBooking = {
    id: bookingId,
    turfId,
    turfName: turf.name,
    turfImage: (turf.images && turf.images[0]) || '',
    slotId,
    date: slot.date,
    time: slot.time,
    userId,
    userName,
    userEmail,
    userPhone: encryptedUserPhone,
    ownerId: turf.ownerId,
    sport: sport || (turf.sports && turf.sports[0]) || 'Football',
    totalAmount: slot.price,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  slot.status = 'pending';
  slot.bookedByUserId = userId;
  slot.bookedByUserName = userName;
  slot.bookingId = bookingId;

  db.bookings.push(newBooking);

  // Send notification to Owner
  db.notifications.push({
    id: `notif-${Date.now()}-1`,
    recipientUserId: turf.ownerId,
    title: 'New Booking Request ⚽',
    message: `${userName} requested slot ${slot.time} on ${slot.date} for ${turf.name}.`,
    date: new Date().toISOString(),
    read: false,
    type: 'booking_request'
  });

  // Notification to User
  db.notifications.push({
    id: `notif-${Date.now()}-2`,
    recipientUserId: userId,
    title: 'Booking Request Sent 📩',
    message: `Your booking request for ${turf.name} on ${slot.date} (${slot.time}) is pending owner approval.`,
    date: new Date().toISOString(),
    read: false,
    type: 'booking_request'
  });

  writeDb(db);
  res.json({ success: true, booking: newBooking });
});

// Owner Approve Booking
app.post('/api/bookings/:id/approve', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.bookings = db.bookings || [];
  db.turfs = db.turfs || [];
  db.users = db.users || [];
  db.slots = db.slots || [];
  db.notifications = db.notifications || [];

  const booking = db.bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const turf = db.turfs.find((t: any) => t.id === booking.turfId);
  const owner = db.users.find((u: any) => u.id === booking.ownerId);

  booking.status = 'approved';
  booking.ownerPhone = owner?.phone || turf?.ownerPhone || encryptText('+91 98765 43210');
  booking.ownerPaymentQrUrl = owner?.paymentQrUrl || turf?.ownerPaymentQrUrl || generateSampleQrCodeUrl(turf?.name || 'Owner');
  booking.updatedAt = new Date().toISOString();

  // Update Slot to Booked
  const slot = db.slots.find((s: any) => s.id === booking.slotId);
  if (slot) {
    slot.status = 'booked';
  }

  // Send notification to user
  db.notifications.push({
    id: `notif-${Date.now()}`,
    recipientUserId: booking.userId,
    title: 'Booking Approved! 🎉',
    message: `Your booking for ${booking.turfName} on ${booking.date} (${booking.time}) is confirmed! Owner contact phone & payment QR code are now unlocked.`,
    date: new Date().toISOString(),
    read: false,
    type: 'booking_approved'
  });

  writeDb(db);

  res.json({
    success: true,
    booking: {
      ...booking,
      ownerPhone: decryptText(booking.ownerPhone)
    }
  });
});

// Owner Reject Booking
app.post('/api/bookings/:id/reject', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.bookings = db.bookings || [];
  db.slots = db.slots || [];
  db.notifications = db.notifications || [];

  const booking = db.bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  booking.status = 'rejected';
  booking.updatedAt = new Date().toISOString();

  // Slot becomes Available again
  const slot = db.slots.find((s: any) => s.id === booking.slotId);
  if (slot) {
    slot.status = 'available';
    slot.bookedByUserId = undefined;
    slot.bookingId = undefined;
  }

  db.notifications.push({
    id: `notif-${Date.now()}`,
    recipientUserId: booking.userId,
    title: 'Booking Rejected ❌',
    message: `Your booking request for ${booking.turfName} on ${booking.date} (${booking.time}) was declined by the owner.`,
    date: new Date().toISOString(),
    read: false,
    type: 'booking_rejected'
  });

  writeDb(db);
  res.json({ success: true, booking });
});

// Cancel Booking (User or Owner)
app.post('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { cancelledByRole } = req.body || {};
  const db = readDb();
  db.bookings = db.bookings || [];
  db.slots = db.slots || [];
  db.notifications = db.notifications || [];

  const booking = db.bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();

  // Slot becomes Available
  const slot = db.slots.find((s: any) => s.id === booking.slotId);
  if (slot) {
    slot.status = 'available';
    slot.bookedByUserId = undefined;
    slot.bookingId = undefined;
  }

  // Notify recipient
  const targetUserId = cancelledByRole === 'owner' ? booking.userId : booking.ownerId;
  db.notifications.push({
    id: `notif-${Date.now()}`,
    recipientUserId: targetUserId,
    title: 'Booking Cancelled ⚠️',
    message: `Booking for ${booking.turfName} on ${booking.date} (${booking.time}) was cancelled.`,
    date: new Date().toISOString(),
    read: false,
    type: 'booking_cancelled'
  });

  writeDb(db);
  res.json({ success: true, booking });
});

// Owner/Admin Unbook Slot
app.post('/api/bookings/:id/unbook', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.bookings = db.bookings || [];
  db.slots = db.slots || [];

  const booking = db.bookings.find((b: any) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking record not found.' });
  }

  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();

  const slot = db.slots.find((s: any) => s.id === booking.slotId);
  if (slot) {
    slot.status = 'available';
    slot.bookedByUserId = undefined;
    slot.bookingId = undefined;
  }

  writeDb(db);
  res.json({ success: true, message: 'Slot unbooked successfully.' });
});

// Get User Bookings
app.get('/api/bookings/user/:userId', (req, res) => {
  const db = readDb();
  const userBookings = (db.bookings || []).filter((b: any) => b.userId === req.params.userId);

  const processed = userBookings.map((b: any) => {
    if (b.status === 'approved') {
      return {
        ...b,
        userPhone: decryptText(b.userPhone),
        ownerPhone: decryptText(b.ownerPhone)
      };
    }
    return {
      ...b,
      userPhone: decryptText(b.userPhone),
      ownerPhone: undefined,
      ownerPaymentQrUrl: undefined
    };
  });

  res.json(processed);
});

// Get Owner Bookings
app.get('/api/bookings/owner/:ownerId', (req, res) => {
  const db = readDb();
  const ownerBookings = (db.bookings || []).filter((b: any) => b.ownerId === req.params.ownerId);

  const processed = ownerBookings.map((b: any) => ({
    ...b,
    userPhone: decryptText(b.userPhone),
    ownerPhone: decryptText(b.ownerPhone)
  }));

  res.json(processed);
});

// Reviews API
app.post('/api/reviews', (req, res) => {
  const { turfId, userId, userName, rating, comment, photoUrl } = req.body || {};
  const db = readDb();
  db.reviews = db.reviews || [];
  db.turfs = db.turfs || [];

  const newReview = {
    id: `rev-${Date.now()}`,
    turfId,
    userId,
    userName,
    rating: Number(rating),
    comment,
    photoUrl,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(newReview);

  // Recalculate rating
  const turfReviews = db.reviews.filter((r: any) => r.turfId === turfId);
  const avg = turfReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / turfReviews.length;

  const turf = db.turfs.find((t: any) => t.id === turfId);
  if (turf) {
    turf.rating = Math.round(avg * 10) / 10;
    turf.reviewCount = turfReviews.length;
  }

  writeDb(db);
  res.json({ success: true, review: newReview });
});

app.post('/api/reviews/:id/reply', (req, res) => {
  const { id } = req.params;
  const { ownerReply } = req.body || {};
  const db = readDb();
  db.reviews = db.reviews || [];

  const review = db.reviews.find((r: any) => r.id === id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  review.ownerReply = ownerReply;
  writeDb(db);
  res.json({ success: true, review });
});

// Notifications API
app.get('/api/notifications/:userId', (req, res) => {
  const db = readDb();
  const notifs = (db.notifications || []).filter((n: any) => n.recipientUserId === req.params.userId);
  res.json(notifs.slice().reverse());
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { userId } = req.body || {};
  const db = readDb();
  db.notifications = db.notifications || [];
  db.notifications.forEach((n: any) => {
    if (n.recipientUserId === userId) {
      n.read = true;
    }
  });
  writeDb(db);
  res.json({ success: true });
});

// Admin Panel APIs
app.get('/api/admin/stats', (req, res) => {
  const db = readDb();
  const users = db.users || [];
  const turfs = db.turfs || [];
  const bookings = db.bookings || [];

  const totalRevenue = bookings
    .filter((b: any) => b.status === 'approved')
    .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

  res.json({
    totalUsers: users.filter((u: any) => u.role === 'user').length,
    totalOwners: users.filter((u: any) => u.role === 'owner').length,
    totalTurfs: turfs.filter((t: any) => !t.isUnposted).length,
    totalBookings: bookings.length,
    totalRevenue,
    pendingReports: 0
  });
});

app.get('/api/admin/users', (req, res) => {
  const db = readDb();
  const users = db.users || [];
  const sanitized = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: decryptText(u.phone),
    businessName: u.businessName || undefined,
    isBanned: Boolean(u.isBanned),
    isSuspended: Boolean(u.isSuspended),
    isVerified: Boolean(u.isVerified),
    createdAt: u.createdAt || new Date().toISOString()
  }));
  res.json(sanitized);
});

app.post('/api/admin/delete-user', (req, res) => {
  const { userId } = req.body || {};
  const db = readDb();
  db.users = db.users || [];
  const userIdx = db.users.findIndex((u: any) => u.id === userId);

  if (userIdx === -1) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (db.users[userIdx].email === 'Admin@1o1' || db.users[userIdx].role === 'admin') {
    return res.status(400).json({ error: 'Super Admin account cannot be deleted.' });
  }

  db.users.splice(userIdx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Account permanently deleted.' });
});

app.post('/api/admin/ban-user', (req, res) => {
  const { userId, isBanned } = req.body || {};
  const db = readDb();
  db.users = db.users || [];
  const user = db.users.find((u: any) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  user.isBanned = Boolean(isBanned);
  if (user.role === 'owner') {
    user.isSuspended = Boolean(isBanned);
  }

  writeDb(db);
  res.json({ success: true, isBanned: user.isBanned });
});

app.post('/api/admin/verify-owner', (req, res) => {
  const { ownerId, isVerified } = req.body || {};
  const db = readDb();
  db.users = db.users || [];
  const owner = db.users.find((u: any) => u.id === ownerId && u.role === 'owner');

  if (!owner) {
    return res.status(404).json({ error: 'Owner not found.' });
  }

  owner.isVerified = Boolean(isVerified);
  writeDb(db);
  res.json({ success: true, isVerified: owner.isVerified });
});

app.post('/api/admin/delete-listing', (req, res) => {
  const { turfId } = req.body || {};
  const db = readDb();
  db.turfs = db.turfs || [];
  const turf = db.turfs.find((t: any) => t.id === turfId);

  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  turf.isUnposted = true;
  writeDb(db);
  res.json({ success: true });
});

// Fallback for unmatched /api/* routes returning clean JSON
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
});

// Global JSON Error Handler for Express
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', req.method, req.path, err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

export default app;
export { app };
