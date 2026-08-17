import express from 'express';
import crypto from 'crypto';

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

// In-Memory Database for Vercel Serverless
let memoryDb: any = null;

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'turfbook-salt', 1000, 64, 'sha512').toString('hex');
}

const DEFAULT_TURFS = [
  {
    id: 'turf-kickoff-mumbai',
    ownerId: 'owner-kickoff',
    ownerName: 'Vikram Malhotra',
    ownerPhone: '+91 98200 12345',
    name: 'KickOff Arena & Sports Hub',
    tagline: 'FIFA-grade 5G synthetic turf for Football & Box Cricket',
    description: 'Premier rooftop sports arena in Bandra. Features ultra-cushioned FIFA-certified synthetic turf, high-intensity LED floodlights, professional dugout seating, and changing rooms.',
    address: '4th Floor, Skyline Mall, Linking Road, Bandra West',
    city: 'Mumbai',
    distanceKm: 2.4,
    sports: ['Football', 'Cricket', 'Futsal'],
    isIndoor: false,
    rating: 4.9,
    reviewCount: 142,
    pricePerHour: 1400,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529900245534-47fbf565131e?w=800&auto=format&fit=crop&q=80',
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
  },
  {
    id: 'turf-skyline-bengaluru',
    ownerId: 'owner-skyline',
    ownerName: 'Rahul Sharma',
    ownerPhone: '+91 98450 67890',
    name: 'Skyline Box Cricket & Football Turf',
    tagline: 'High-netted box cricket arena with dual-color boundary marking',
    description: 'Spacious dual-pitch arena tailored for fast-paced 7v7 Box Cricket and 6v6 Futsal. Equipped with stadium-grade perimeter netting and live scoring digital display.',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    distanceKm: 3.1,
    sports: ['Cricket', 'Football', 'Futsal'],
    isIndoor: false,
    rating: 4.8,
    reviewCount: 98,
    pricePerHour: 1600,
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
  },
  {
    id: 'turf-smashpoint-delhi',
    ownerId: 'owner-smashpoint',
    ownerName: 'Ananya Desai',
    ownerPhone: '+91 98110 54321',
    name: 'SmashPoint Indoor Badminton & Pickleball Arena',
    tagline: 'BWF-standard synthetic wooden courts with central AC',
    description: 'Delhi’s premier indoor racquet hub offering 4 BWF-approved badminton courts and 2 dedicated USA Pickleball-regulation courts.',
    address: 'Near Metro Pillar 140, South Extension Part II',
    city: 'Delhi',
    distanceKm: 4.5,
    sports: ['Badminton', 'Pickleball', 'Table Tennis'],
    isIndoor: true,
    rating: 4.9,
    reviewCount: 115,
    pricePerHour: 950,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    ],
    facilities: ['AC', 'Washrooms', 'Changing Rooms', 'Parking', 'Cafeteria'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
  }
];

function getInitialDb() {
  const adminPasswordHash = hashPassword('ilovepotato@123');
  const demoOwnerPasswordHash = hashPassword('demo@123');

  return {
    users: [
      {
        id: 'admin-1',
        name: 'Master Admin',
        email: 'admin@turfbook.com',
        role: 'admin',
        passwordHash: adminPasswordHash,
        isVerified: true,
        createdAt: new Date('2026-01-01').toISOString(),
      },
      {
        id: 'owner-kickoff',
        name: 'Vikram Malhotra',
        email: 'vikram@kickoffturfs.com',
        role: 'owner',
        businessName: 'KickOff Sports Arena Ltd.',
        phone: '+91 98200 12345',
        isVerified: true,
        passwordHash: demoOwnerPasswordHash,
        createdAt: new Date('2026-01-15').toISOString(),
      },
    ],
    turfs: DEFAULT_TURFS,
    bookings: [],
    reviews: [],
    ownerApplications: [],
  };
}

function readDb(): any {
  if (!memoryDb) {
    memoryDb = getInitialDb();
  }
  return memoryDb;
}

function writeDb(db: any) {
  memoryDb = db;
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

app.get('/api/turfs', (req, res) => {
  const db = readDb();
  const activeTurfs = (db.turfs || []).filter((t: any) => !t.isUnposted);
  res.json(activeTurfs);
});

export default function handler(req: any, res: any) {
  // Normalize incoming URLs from Vercel routing
  const orig = req.url || '';
  if (!orig.startsWith('/api/') && !orig.startsWith('/api')) {
    req.url = '/api' + (orig.startsWith('/') ? orig : '/' + orig);
  }
  return app(req, res);
}
