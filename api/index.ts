import app from '../server';

export default function handler(req: any, res: any) {
  // Normalize incoming URLs from Vercel routing
  const orig = req.url || '';
  if (!orig.startsWith('/api/') && !orig.startsWith('/api')) {
    req.url = '/api' + (orig.startsWith('/') ? orig : '/' + orig);
  }
  return app(req, res);
}
