import app from '../server';

export default function handler(req: any, res: any) {
  // Extract original requested path from Vercel headers or URL
  let targetUrl = '';
  
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
  if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
    targetUrl = forwardedUri;
  } else if (typeof req.url === 'string' && req.url.startsWith('/api/') && req.url !== '/api') {
    targetUrl = req.url;
  } else {
    // Check route matches header from Vercel
    const routeMatches = req.headers['x-now-route-matches'];
    if (typeof routeMatches === 'string') {
      const match = routeMatches.match(/1=([^&]+)/);
      if (match) {
        targetUrl = `/api/${decodeURIComponent(match[1]).replace(/^\/+/, '')}`;
      }
    }
  }

  if (!targetUrl) {
    targetUrl = req.url || '/api';
  }

  if (!targetUrl.startsWith('/api/') && targetUrl !== '/api') {
    targetUrl = '/api' + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
  }

  req.url = targetUrl;
  req.originalUrl = targetUrl;

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
