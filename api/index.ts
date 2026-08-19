import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { smartMatchDistrict, smartMatchTurf } from '../src/data/indianDistricts';

const app = express();

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
    console.warn('[Brevo] BREVO_API_KEY is not configured in environment variables.');
    return {
      success: false,
      error: 'BREVO_API_KEY was not detected in this deployment. In Vercel Project Settings > Environment Variables, verify that BREVO_API_KEY has the "Production" box checked, then trigger a new Redeploy.',
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
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d;">
                ${otp}
              </span>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 8px 0;">
              • This code is valid for <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
              • Never share this code with anyone. TurfBook support will never ask for your verification code.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              © 2026 TurfBook. All rights reserved.
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
const DATA_DIR = path.join('/tmp', 'turfbook-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// In-memory fallback
let inMemoryDb: any = null;

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'turfbook-salt', 1000, 64, 'sha512').toString('hex');
}

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
    <text x="100" y="190" font-family="sans-serif" font-size="10" font-weight="bold" fill="#2E7D32" text-anchor="middle">UPI: ${name.toLowerCase().replace(/[^a-z]/g, '')}@upi</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    turfs: [],
    slots: [],
    bookings: [],
    reviews: [],
    notifications: [],
  };
}

function readDb(): any {
  if (inMemoryDb) return inMemoryDb;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb;
    }
  } catch (e) {}

  inMemoryDb = getInitialDb();
  return inMemoryDb;
}

function writeDb(db: any) {
  inMemoryDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {}
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OTP Send
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

// OTP Verify
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

// Auth Register
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

// Auth Login
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

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
  const db = readDb();
  const totalRevenue = (db.bookings || [])
    .filter((b: any) => b.status === 'approved')
    .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

  res.json({
    totalUsers: (db.users || []).filter((u: any) => u.role === 'user').length,
    totalOwners: (db.users || []).filter((u: any) => u.role === 'owner').length,
    totalTurfs: (db.turfs || []).filter((t: any) => !t.isUnposted).length,
    totalBookings: (db.bookings || []).length,
    totalRevenue,
    pendingReports: 0
  });
});

// Admin Users
app.get('/api/admin/users', (req, res) => {
  const db = readDb();
  const sanitized = (db.users || []).map((u: any) => ({
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

// Admin Ban User
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

// Admin Verify Owner
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

// Admin Delete User
app.post('/api/admin/delete-user', (req, res) => {
  const { userId } = req.body;
  const db = readDb();
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

export default function handler(req: any, res: any) {
  // Normalize incoming URLs from Vercel routing
  const orig = req.url || '';
  if (!orig.startsWith('/api/') && !orig.startsWith('/api')) {
    req.url = '/api' + (orig.startsWith('/') ? orig : '/' + orig);
  }
  return app(req, res);
}
