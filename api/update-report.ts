import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    console.log(`[UPDATE] Starting update request`);
    console.log(`[UPDATE] Body:`, req.body);
    
    // Check API key if configured
    const apiSecret = process.env.API_KEY;
    if (apiSecret) {
      const providedKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
      const providedKeyStr = Array.isArray(providedKey) ? providedKey[0] : providedKey;
      console.log(`[UPDATE] API key check - Expected: ${apiSecret?.substring(0, 10)}..., Provided: ${providedKeyStr?.substring(0, 10)}...`);
      if (providedKeyStr !== apiSecret) {
        console.log(`[UPDATE] API key mismatch - returning 401`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      console.log(`[UPDATE] No API_KEY env var configured`);
    }
    
    // Parse body
    const { id, status } = req.body;
    
    // Validate inputs
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    if (!status || !['pending', 'reviewed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if report exists
    const reportKey = `report:${id}`;
    const report = await kv.get(reportKey);
    
    if (!report) {
      console.log(`[UPDATE] Report not found with key: ${reportKey}`);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update status
    const updatedReport = {
      ...(report as any),
      status,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[UPDATE] Updating KV with key ${reportKey}, new status: ${status}`);
    await kv.set(reportKey, updatedReport);
    
    // Verify the update
    const verifyReport = await kv.get(reportKey);
    console.log(`[UPDATE] Verification - Report ${id} status is now: ${(verifyReport as any)?.status}`);
    
    res.status(200).json({ 
      id, 
      status, 
      message: 'Report status updated successfully' 
    });
  } catch (error) {
    console.error('[UPDATE] Error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
}
