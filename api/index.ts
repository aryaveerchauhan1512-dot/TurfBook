import app from '../server';

export default function handler(req: any, res: any) {
  // Extract path from Vercel rewrite or headers
  let pathname = '';

  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    pathname = `/api/${rawPath.replace(/^\/+/, '')}`;
    delete req.query.path;
  } else {
    const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
    if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
      pathname = forwardedUri.split('?')[0];
    } else {
      const routeMatches = req.headers['x-now-route-matches'];
      if (typeof routeMatches === 'string') {
        const match = routeMatches.match(/1=([^&]+)/);
        if (match) {
          pathname = `/api/${decodeURIComponent(match[1]).replace(/^\/+/, '')}`;
        }
      }
    }
  }

  if (!pathname) {
    pathname = (req.url || '').split('?')[0];
  }

  if (!pathname.startsWith('/api/') && pathname !== '/api') {
    pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
  }

  // Reconstruct query parameters
  const searchParams = new URLSearchParams();
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && k !== 'path') {
        if (Array.isArray(v)) {
          v.forEach((val) => searchParams.append(k, String(val)));
        } else {
          searchParams.append(k, String(v));
        }
      }
    }
  }
  const queryString = searchParams.toString();
  const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;

  req.url = fullUrl;
  req.originalUrl = fullUrl;

  // Mark body as parsed if already provided by Vercel serverless environment
  if (req.body !== undefined && typeof req.body === 'object' && req.body !== null) {
    req._body = true;
  }

  return app(req, res);
}
