import type { URLDetectionResult, EmailDetectionResult } from '../types';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function getExistingURLDetection(url: string): Promise<URLDetectionResult | null> {
  const { data, error } = await supabase
    .from('url_detections')
    .select('url, is_phishing, confidence_score, features')
    .eq('url', url)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error || !data) return null;

  return {
    url: data.url,
    isPhishing: data.is_phishing,
    confidence: data.confidence_score,
    features: data.features || {},
    message: data.is_phishing
      ? 'Warning: This URL appears to be a phishing attempt'
      : 'Safe: This URL appears to be safe',
  };
}

export async function detectPhishingURL(url: string): Promise<URLDetectionResult> {
  const existing = await getExistingURLDetection(url);
  if (existing) {
    return existing;
  }

  const apiUrl = `${SUPABASE_URL}/functions/v1/detect-phishing-url`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to detect phishing URL');
  }

  return response.json();
}

export async function detectSpamEmail(
  subject: string,
  content: string,
  sender: string
): Promise<EmailDetectionResult> {
  const apiUrl = `${SUPABASE_URL}/functions/v1/detect-spam-email`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, content, sender }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to detect spam email');
  }

  return response.json();
}
