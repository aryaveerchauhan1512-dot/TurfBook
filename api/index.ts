import app from '../server';

export default function handler(req: any, res: any) {
  try {
    // In Vercel, req.url might be rewritten to /api/index or have /api stripped
    const origUrl = req.url || '';
    const matchPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'];

    if (origUrl.startsWith('/api/index') && typeof matchPath === 'string') {
      req.url = matchPath;
    } else if (!origUrl.startsWith('/api/') && !origUrl.startsWith('/api')) {
      req.url = '/api' + (origUrl.startsWith('/') ? origUrl : '/' + origUrl);
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            err?.message ||
            'Serverless function error. Please ensure BREVO_API_KEY environment variable is set in Vercel settings.',
        })
      );
    }
  }
}
