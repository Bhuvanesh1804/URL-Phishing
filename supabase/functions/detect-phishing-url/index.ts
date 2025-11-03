import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface URLFeatures {
  length: number;
  hasIP: boolean;
  hasAtSymbol: boolean;
  dotCount: number;
  slashCount: number;
  hasHttps: boolean;
  subdomainCount: number;
  hasSuspiciousKeywords: boolean;
  entropyScore: number;
}

function extractURLFeatures(url: string): URLFeatures {
  const suspiciousKeywords = [
    'login', 'verify', 'secure', 'account', 'update', 'confirm',
    'banking', 'paypal', 'ebay', 'amazon', 'signin', 'password'
  ];

  const hasIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
  const hasAtSymbol = url.includes('@');
  const dotCount = (url.match(/\./g) || []).length;
  const slashCount = (url.match(/\//g) || []).length;
  const hasHttps = url.startsWith('https://');
  
  let subdomainCount = 0;
  try {
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');
    subdomainCount = Math.max(0, hostParts.length - 2);
  } catch {
    subdomainCount = 0;
  }

  const lowerURL = url.toLowerCase();
  const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => lowerURL.includes(keyword));

  const entropy = calculateEntropy(url);

  return {
    length: url.length,
    hasIP,
    hasAtSymbol,
    dotCount,
    slashCount,
    hasHttps,
    subdomainCount,
    hasSuspiciousKeywords,
    entropyScore: entropy,
  };
}

function calculateEntropy(str: string): number {
  const len = str.length;
  const frequencies: { [key: string]: number } = {};
  
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

function detectPhishing(features: URLFeatures): { isPhishing: boolean; confidence: number } {
  let riskScore = 0;
  let maxScore = 0;

  if (features.hasIP) {
    riskScore += 15;
  }
  maxScore += 15;

  if (features.hasAtSymbol) {
    riskScore += 10;
  }
  maxScore += 10;

  if (!features.hasHttps) {
    riskScore += 8;
  }
  maxScore += 8;

  if (features.length > 75) {
    riskScore += 12;
  }
  maxScore += 12;

  if (features.subdomainCount > 2) {
    riskScore += 10;
  }
  maxScore += 10;

  if (features.dotCount > 4) {
    riskScore += 8;
  }
  maxScore += 8;

  if (features.slashCount > 6) {
    riskScore += 7;
  }
  maxScore += 7;

  if (features.hasSuspiciousKeywords) {
    riskScore += 15;
  }
  maxScore += 15;

  if (features.entropyScore > 4.5) {
    riskScore += 15;
  }
  maxScore += 15;

  const normalizedScore = riskScore / maxScore;
  const isPhishing = normalizedScore > 0.5;
  const confidence = isPhishing ? normalizedScore : 1 - normalizedScore;

  return { isPhishing, confidence };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid URL required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    url = url.trim().toLowerCase();

    const features = extractURLFeatures(url);
    const { isPhishing, confidence } = detectPhishing(features);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('url_detections').insert({
      url,
      is_phishing: isPhishing,
      confidence_score: confidence,
      features,
    });

    await supabase.from('detection_history').insert({
      detection_type: 'url',
      result: isPhishing ? 'phishing' : 'safe',
      confidence,
    });

    return new Response(
      JSON.stringify({
        url,
        isPhishing,
        confidence: Math.round(confidence * 100) / 100,
        features,
        message: isPhishing 
          ? 'Warning: This URL appears to be a phishing attempt'
          : 'Safe: This URL appears to be safe',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});