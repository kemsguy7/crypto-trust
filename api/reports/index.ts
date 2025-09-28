import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Rate limiting helper
async function checkRateLimit(ip: string): Promise<boolean> {
  const threshold = parseInt(process.env.RL_THRESHOLD || '10');
  const minute = Math.floor(Date.now() / 60000);
  const key = `rl:${ip}:${minute}`;
  
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, 60); // TTL 60 seconds
    }
    return count <= threshold;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow on error
  }
}

// Dedupe by nullifier and epoch
async function checkDuplicate(nullifier: string, epoch: string): Promise<string | null> {
  const dedupeKey = `nullifier:${nullifier}:${epoch}`;
  return await kv.get(dedupeKey);
}

// GET /api/reports - List reports
async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const { limit = '50', cursor } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);
    
    // Get report IDs from index
    const indexKey = 'reports:index';
    const reportIds: string[] = await kv.lrange(indexKey, 0, -1) || [];
    
    // Apply cursor if provided
    let startIndex = 0;
    if (cursor) {
      startIndex = reportIds.indexOf(cursor as string) + 1;
      if (startIndex === 0) startIndex = reportIds.length; // Cursor not found
    }
    
    // Get paginated IDs
    const paginatedIds = reportIds.slice(startIndex, startIndex + limitNum);
    
    // Fetch report data
    const reports = await Promise.all(
      paginatedIds.map(async (id) => {
        const data = await kv.get(`report:${id}`);
        return data ? { id, ...data } : null;
      })
    );
    
    // Filter out nulls
    const validReports = reports.filter(r => r !== null);
    
    // Determine next cursor
    const nextCursor = startIndex + limitNum < reportIds.length 
      ? reportIds[startIndex + limitNum - 1] 
      : null;
    
    res.status(200).json({
      reports: validReports,
      nextCursor,
      total: reportIds.length
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

// POST /api/reports - Create report
async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    // Check API key if configured
    const apiSecret = process.env.SYNC_API_SECRET;
    if (apiSecret) {
      const providedKey = req.headers['x-api-key'];
      if (providedKey !== apiSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const allowed = await checkRateLimit(ip as string);
    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // Parse body
    const { encryptedData, proofPublicSignals, timestamp } = req.body;
    
    // Validate required fields
    if (!encryptedData || !proofPublicSignals || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract nullifier and epoch from public signals
    const [merkleRoot, epoch, nullifier, signalHash] = proofPublicSignals;
    
    // Check for duplicate
    const existingId = await checkDuplicate(nullifier, epoch);
    if (existingId) {
      return res.status(409).json({ 
        error: 'Duplicate report', 
        id: existingId,
        message: 'A report with this nullifier already exists for this epoch'
      });
    }
    
    // Generate ID
    const id = `report_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store report
    const report = {
      encryptedData,
      proofPublicSignals,
      timestamp,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`report:${id}`, report);
    
    // Add to index (newest first)
    await kv.lpush('reports:index', id);
    
    // Store dedupe key
    await kv.set(`nullifier:${nullifier}:${epoch}`, id);
    
    res.status(201).json({ id, message: 'Report created successfully' });
  } catch (error) {
    console.error('POST /api/reports error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

// PATCH /api/reports/:id - Update report status (delegated from index)
async function handlePatch(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract ID from URL path
    const url = req.url || '';
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1]?.split('?')[0]; // Get last part before query params
    
    console.log(`[PATCH] Starting update for report ${id} from URL: ${url}`);
    console.log(`[PATCH] Headers received:`, Object.keys(req.headers));
    console.log(`[PATCH] Body type:`, typeof req.body);
    console.log(`[PATCH] Raw body:`, req.body);
    
    // Check API key if configured
    const apiSecret = process.env.API_KEY;
    if (apiSecret) {
      const providedKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
      const providedKeyStr = Array.isArray(providedKey) ? providedKey[0] : providedKey;
      console.log(`[PATCH] API key check - Expected: ${apiSecret?.substring(0, 10)}..., Provided: ${providedKeyStr?.substring(0, 10)}...`);
      if (providedKeyStr !== apiSecret) {
        console.log(`[PATCH] API key mismatch - returning 401`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      console.log(`[PATCH] No API_KEY env var configured`);
    }
    
    // Parse body for PATCH request
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log(`[PATCH] Parsed body:`, body);
    } catch (e) {
      console.log(`[PATCH] Failed to parse body:`, e);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    
    const { status } = body;
    
    // Validate inputs
    if (!id || typeof id !== 'string' || id === 'reports') {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    if (!status || !['pending', 'reviewed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if report exists
    const reportKey = `report:${id}`;
    const report = await kv.get(reportKey);
    
    if (!report) {
      console.log(`[PATCH] Report not found with key: ${reportKey}`);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update status
    const updatedReport = {
      ...(report as any),
      status,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[PATCH] Updating KV with key ${reportKey}, new status: ${status}`);
    await kv.set(reportKey, updatedReport);
    
    // Verify the update
    const verifyReport = await kv.get(reportKey);
    console.log(`[PATCH] Verification - Report ${id} status is now: ${(verifyReport as any)?.status}`);
    
    res.status(200).json({ 
      id, 
      status, 
      message: 'Report status updated successfully' 
    });
  } catch (error) {
    console.error('PATCH /api/reports/:id error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PATCH':
      // Handle PATCH requests for updating report status
      return handlePatch(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
