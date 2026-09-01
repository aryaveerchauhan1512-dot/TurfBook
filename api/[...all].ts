import app from '../server';

export default function handler(req: any, res: any) {
  // Ensure req.url starts with /api if omitted
  let url = req.url || '';
  if (!url.startsWith('/api/') && url !== '/api') {
    url = '/api' + (url.startsWith('/') ? url : '/' + url);
  }
  req.url = url;
  req.originalUrl = url;

  // Handle pre-parsed JSON bodies from Vercel
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
      req._body = true;
    } catch {
      // not a json string
    }
  } else if (req.body && typeof req.body === 'object') {
    req._body = true;
  }

  return app(req, res);
}
