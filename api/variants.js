import fetch from 'node-fetch';

const PRINTFUL_API_BASE = 'https://api.printful.com';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://jorobean.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  // Verify API key exists
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // Get product variants
    const response = await fetch(`${PRINTFUL_API_BASE}/store/products/${id}`, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch product variants');
    }

    res.status(200).json({ result: data.result });
  } catch (error) {
    console.error('Printful API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
