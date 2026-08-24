import { getFxResponse } from '../src/lib/fx/getFxResponse';

type NodeRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

type NodeReq = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

export default async function handler(req: NodeReq, res: NodeRes) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  try {
    const payload = await getFxResponse(req.headers || {});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload));
  } catch {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'fx_unavailable', delayed: true }));
  }
}
