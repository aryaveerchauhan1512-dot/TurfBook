import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { smartMatchDistrict, smartMatchTurf } from './src/data/indianDistricts';

const app = express();
const PORT = 3000;

// Permissive CORS and preflight handling
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

// OTP In-Memory Store
const otpStore = new Map<string, { otp: string; expiresAt: number; verified?: boolean }>();

// Brevo Transactional Email Service
async function sendBrevoOtpEmail(
  recipientEmail: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_SENDER ||
    process.env.SMTP_FROM ||
    'aryaveerchauhan1512@gmail.com'
  ).trim();
  const senderName = (process.env.BREVO_SENDER_NAME || 'TurfBook Verification').trim();

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY is not configured in environment variables.');
    return {
      success: false,
      error: 'Brevo API key is not configured. Please set the BREVO_API_KEY environment variable.',
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>TurfBook Verification Code</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">
              TURFBOOK
            </h1>
            <p style="color: #bbf7d0; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">
              Account Email Verification
            </p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
              Hello,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              Use the 6-digit One-Time Password (OTP) below to verify your email address on TurfBook:
            </p>

            <div style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; display: inline-block;">
                ${otp}
              </span>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin: 0 0 20px 0;">
              ⏱️ This code will expire in <strong>10 minutes</strong>. Never share this OTP with anyone.
            </p>

            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center; margin: 0;">
              If you did not request this verification code, please ignore this email.
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
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: recipientEmail,
          },
        ],
        subject: `Your TurfBook Verification OTP: ${otp}`,
        htmlContent: htmlContent,
      }),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Brevo API Error]', response.status, data);
      const errMsg = data?.message || data?.error || `HTTP ${response.status}`;
      return {
        success: false,
        error: `Brevo email sending failed: ${errMsg}. Please verify BREVO_API_KEY and that sender email (${senderEmail}) is registered in Brevo.`,
      };
    }

    console.log(`[Brevo] OTP Email delivered to: ${recipientEmail}, messageId:`, data?.messageId);
    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (netErr: any) {
    console.error('[Brevo Network Error]', netErr);
    return {
      success: false,
      error: `Could not connect to Brevo API: ${netErr?.message || 'Network error'}`,
    };
  }
}

// Support ephemeral writable directory in Vercel serverless environment
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
const DATA_DIR = isVercel ? path.join('/tmp', 'turfbook-data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seedFile = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(seedFile)) {
      try {
        fs.copyFileSync(seedFile, DB_FILE);
      } catch (e) {
        fs.writeFileSync(DB_FILE, JSON.stringify(getInitialDb(), null, 2), 'utf8');
      }
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(getInitialDb(), null, 2), 'utf8');
    }
  }
}

// Helper for encryption of personal data (phone numbers, etc)
const ENCRYPTION_KEY = crypto.createHash('sha256').update('turfbook-secret-key-2026').digest();
const IV_LENGTH = 16;

function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
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

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'turfbook-salt', 1000, 64, 'sha512').toString('hex');
}

// Generate simple sample QR code SVG Data URL
function generateSampleQrCodeUrl(name: string): string {
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
    <text x="100" y="190" font-family="sans-serif" font-size="10" font-weight="bold" fill="#2E7D32" text-anchor="middle">UPI: ${name.toLowerCase().replace(/[^a-z]/g, '')}@upi</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial Database Schema for production
function getInitialDb() {
  const adminPasswordHash = hashPassword('ilovepotato@123');

  return {
    users: [
      {
        id: 'usr-admin',
        name: 'Super Admin',
        email: 'Admin@1o1',
        passwordHash: adminPasswordHash,
        role: 'admin',
        phone: encryptText('+91 99999 88888'),
        createdAt: new Date().toISOString()
      }
    ],
    turfs: [],
    slots: [],
    bookings: [],
    reviews: [],
    notifications: []
  };
}

// Load or initialize DB
function readDb() {
  ensureDataFile();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    const initial = getInitialDb();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    } catch (e) {}
    return initial;
  }
}

function writeDb(db: any) {
  ensureDataFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// --- API ROUTES ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OTP Email Dispatch Endpoint via Brevo
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address to receive OTP.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpStore.set(cleanEmail, { otp, expiresAt });

    const result = await sendBrevoOtpEmail(cleanEmail, otp);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to send OTP email via Brevo. Please check Brevo configuration.',
      });
    }

    return res.json({
      success: true,
      emailSent: true,
      message: `OTP sent successfully to ${cleanEmail} via Brevo. Please check your inbox or spam folder.`,
    });
  } catch (err: any) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Failed to generate OTP code. Please try again.' });
  }
});

// OTP Verification Endpoint
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email or OTP expired. Please click "Send OTP".' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP code has expired. Please click "Resend OTP".' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Incorrect OTP code. Please check your email and try again.' });
    }

    record.verified = true;
    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'OTP verification failed. Please try again.' });
  }
});

// Authentication
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, phone, businessName, tosAccepted } = req.body || {};

    if (!tosAccepted) {
      return res.status(400).json({ error: 'You must accept the Terms of Service to create an account.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!role || (role !== 'user' && role !== 'owner')) {
      return res.status(400).json({ error: 'Please select a valid account type (Player or Turf Owner).' });
    }

    // Normalize and enforce 10 digits phone number
    let cleanPhone = (phone || '').toString().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Contact phone number must be a valid 10-digit mobile number (e.g. 9876543210).' });
    }

    const db = readDb();
    if (!db || !Array.isArray(db.users)) {
      db.users = [];
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.users.find((u: any) => u && u.email && u.email.toString().toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const encryptedPhone = encryptText(cleanPhone);
    const newUser: any = {
      id: `${role === 'owner' ? 'owner' : 'usr'}-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: role === 'owner' ? 'owner' : 'user',
      phone: encryptedPhone,
      createdAt: new Date().toISOString()
    };

    if (role === 'owner') {
      newUser.businessName = (businessName || name).trim();
      newUser.paymentQrUrl = generateSampleQrCodeUrl(newUser.businessName);
      newUser.isVerified = false;
    }

    db.users.push(newUser);
    writeDb(db);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: decryptText(newUser.phone || ''),
      businessName: newUser.businessName,
      paymentQrUrl: newUser.paymentQrUrl,
      isVerified: newUser.isVerified
    };

    return res.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Register endpoint error:', err);
    return res.status(500).json({ error: err?.message || 'Registration failed due to a server error. Please try again.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, expectedRole } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const db = readDb();
    if (!db || !Array.isArray(db.users)) {
      db.users = [];
    }

    const passwordHash = hashPassword(password);

    // Secret admin access check
    if (cleanEmail === 'admin@1o1' && password === 'ilovepotato@123') {
      const admin = db.users.find((u: any) => u && u.email && u.email.toString().toLowerCase() === 'admin@1o1') || {
        id: 'usr-admin',
        name: 'Super Admin',
        email: 'Admin@1o1',
        role: 'admin'
      };
      return res.json({
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
          phone: '+91 99999 88888'
        }
      });
    }

    const user = db.users.find(
      (u: any) => u && u.email && u.email.toString().toLowerCase() === cleanEmail && u.passwordHash === passwordHash
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended by Admin. Please contact support.' });
    }

    // Ensure role strictly matches expected flow
    if (expectedRole && user.role !== expectedRole && user.role !== 'admin') {
      return res.status(403).json({
        error: `This account is registered as a ${user.role.toUpperCase()}. Please use the ${user.role.toUpperCase()} login screen.`
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: decryptText(user.phone || ''),
      businessName: user.businessName,
      paymentQrUrl: user.paymentQrUrl,
      isVerified: user.isVerified
    };

    return res.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Login endpoint error:', err);
    return res.status(500).json({ error: err?.message || 'Login failed due to a server error. Please try again.' });
  }
});

// Update Owner QR and Phone Number
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

  let result = db.turfs.filter((t: any) => !t.isUnposted);

  if (city && typeof city === 'string' && city !== 'All') {
    result = result.filter((t: any) =>
      smartMatchDistrict(t.city, city) || smartMatchDistrict(t.address, city)
    );
  }

  if (sport && typeof sport === 'string' && sport !== 'All') {
    result = result.filter((t: any) => t.sports.includes(sport));
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
    result = result.filter((t: any) => facilityList.every((f) => t.facilities.includes(f)));
  }

  // Decrypt phone for return safely (omit or decrypt)
  const sanitized = result.map((t: any) => ({
    ...t,
    ownerPhone: decryptText(t.ownerPhone)
  }));

  res.json(sanitized);
});

app.get('/api/turfs/:id', (req, res) => {
  const db = readDb();
  const turf = db.turfs.find((t: any) => t.id === req.params.id);
  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  const reviews = db.reviews.filter((r: any) => r.turfId === turf.id);
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
  } = req.body;

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
  const owner = db.users.find((u: any) => u.id === ownerId);

  const newTurf: any = {
    id: `turf-${Date.now()}`,
    ownerId,
    ownerName: ownerName || owner?.businessName || owner?.name || 'Turf Owner',
    ownerPhone: owner?.phone || encryptText('+91 98765 43210'),
    ownerPaymentQrUrl: owner?.paymentQrUrl || generateSampleQrCodeUrl(name),
    name,
    tagline: tagline || `${name} in ${city}`,
    description: description || 'Modern state-of-the-art sports turf with professional amenities.',
    address,
    city,
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
  const turfIdx = db.turfs.findIndex((t: any) => t.id === id);

  if (turfIdx === -1) {
    return res.status(404).json({ error: 'Turf listing not found.' });
  }

  const { images } = req.body;
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
      date: targetDate,
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
  const { slotId, status } = req.body; // status: 'blocked' | 'available'
  const db = readDb();
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
  const { turfId, slotId, userId, userName, userEmail, userPhone, sport } = req.body;
  const db = readDb();

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
    turfImage: turf.images[0] || '',
    slotId,
    date: slot.date,
    time: slot.time,
    userId,
    userName,
    userEmail,
    userPhone: encryptedUserPhone,
    ownerId: turf.ownerId,
    sport: sport || turf.sports[0],
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
  const { cancelledByRole, userId } = req.body;
  const db = readDb();
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

// Owner/Admin Unbook Slot (Phone request or Admin override)
app.post('/api/bookings/:id/unbook', (req, res) => {
  const { id } = req.params;
  const db = readDb();
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

// Get User Bookings (Only exposes owner phone and QR code if status === 'approved')
app.get('/api/bookings/user/:userId', (req, res) => {
  const db = readDb();
  const userBookings = db.bookings.filter((b: any) => b.userId === req.params.userId);

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
      ownerPhone: undefined, // Hidden until approved!
      ownerPaymentQrUrl: undefined // Hidden until approved!
    };
  });

  res.json(processed);
});

// Get Owner Bookings
app.get('/api/bookings/owner/:ownerId', (req, res) => {
  const db = readDb();
  const ownerBookings = db.bookings.filter((b: any) => b.ownerId === req.params.ownerId);

  const processed = ownerBookings.map((b: any) => ({
    ...b,
    userPhone: decryptText(b.userPhone),
    ownerPhone: decryptText(b.ownerPhone)
  }));

  res.json(processed);
});

// Reviews API
app.post('/api/reviews', (req, res) => {
  const { turfId, userId, userName, rating, comment, photoUrl } = req.body;
  const db = readDb();

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
  const { ownerReply } = req.body;
  const db = readDb();

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
  const notifs = db.notifications.filter((n: any) => n.recipientUserId === req.params.userId);
  res.json(notifs.reverse());
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { userId } = req.body;
  const db = readDb();
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
  const totalRevenue = db.bookings
    .filter((b: any) => b.status === 'approved')
    .reduce((sum: number, b: any) => sum + b.totalAmount, 0);

  res.json({
    totalUsers: db.users.filter((u: any) => u.role === 'user').length,
    totalOwners: db.users.filter((u: any) => u.role === 'owner').length,
    totalTurfs: db.turfs.filter((t: any) => !t.isUnposted).length,
    totalBookings: db.bookings.length,
    totalRevenue,
    pendingReports: 0
  });
});

app.get('/api/admin/users', (req, res) => {
  const db = readDb();
  const sanitized = db.users.map((u: any) => ({
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
  const { userId } = req.body;
  const db = readDb();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);

  if (userIdx === -1) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  // Prevent deleting super admin
  if (db.users[userIdx].email === 'Admin@1o1' || db.users[userIdx].role === 'admin') {
    return res.status(400).json({ error: 'Super Admin account cannot be deleted.' });
  }

  db.users.splice(userIdx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Account permanently deleted.' });
});

app.post('/api/admin/ban-user', (req, res) => {
  const { userId, isBanned } = req.body;
  const db = readDb();
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
  const { ownerId, isVerified } = req.body;
  const db = readDb();
  const owner = db.users.find((u: any) => u.id === ownerId && u.role === 'owner');

  if (!owner) {
    return res.status(404).json({ error: 'Owner not found.' });
  }

  owner.isVerified = Boolean(isVerified);
  writeDb(db);
  res.json({ success: true, isVerified: owner.isVerified });
});

app.post('/api/admin/delete-listing', (req, res) => {
  const { turfId } = req.body;
  const db = readDb();
  const turf = db.turfs.find((t: any) => t.id === turfId);

  if (!turf) {
    return res.status(404).json({ error: 'Turf not found.' });
  }

  turf.isUnposted = true;
  writeDb(db);
  res.json({ success: true });
});

// Fallback for unmatched /api/* routes
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

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TurfBook server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

