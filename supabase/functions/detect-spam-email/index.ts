import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailFeatures {
  subjectLength: number;
  contentLength: number;
  hasUrgentWords: boolean;
  hasMoneyWords: boolean;
  hasLinkCount: number;
  hasAllCaps: boolean;
  hasExclamationCount: number;
  hasSuspiciousSender: boolean;
  hasAttachmentKeywords: boolean;
  capitalRatio: number;
}

function extractEmailFeatures(subject: string, content: string, sender: string): EmailFeatures {
  const urgentWords = [
    'urgent', 'immediate', 'action required', 'act now', 'limited time',
    'expires', 'hurry', 'quick', 'fast', 'now', 'today only'
  ];
  
  const moneyWords = [
    'free', 'cash', 'money', 'prize', 'winner', 'congratulations',
    'claim', 'reward', 'discount', '50%', '100%', '$$$', 'million',
    'billion', 'inheritance', 'lottery', 'credit card'
  ];

  const attachmentKeywords = [
    'invoice', 'receipt', 'document', 'file attached', 'see attachment',
    'open attachment', 'download', 'click here'
  ];

  const fullText = (subject + ' ' + content).toLowerCase();
  
  const hasUrgentWords = urgentWords.some(word => fullText.includes(word));
  const hasMoneyWords = moneyWords.some(word => fullText.includes(word));
  const hasAttachmentKeywords = attachmentKeywords.some(word => fullText.includes(word));
  
  const linkCount = (content.match(/https?:\/\//gi) || []).length;
  const exclamationCount = (fullText.match(/!/g) || []).length;
  
  const allCapsWords = (subject + ' ' + content).match(/\b[A-Z]{3,}\b/g) || [];
  const hasAllCaps = allCapsWords.length > 2;
  
  const letters = (subject + content).replace(/[^a-zA-Z]/g, '');
  const capitals = letters.match(/[A-Z]/g) || [];
  const capitalRatio = letters.length > 0 ? capitals.length / letters.length : 0;
  
  const suspiciousSenderPatterns = [
    /noreply/i,
    /no-reply/i,
    /admin@/i,
    /support@/i,
    /info@/i,
    /[0-9]{5,}/,
  ];
  
  const hasSuspiciousSender = suspiciousSenderPatterns.some(pattern => pattern.test(sender));

  return {
    subjectLength: subject.length,
    contentLength: content.length,
    hasUrgentWords,
    hasMoneyWords,
    hasLinkCount: linkCount,
    hasAllCaps,
    hasExclamationCount: exclamationCount,
    hasSuspiciousSender,
    hasAttachmentKeywords,
    capitalRatio,
  };
}

function detectSpam(features: EmailFeatures): { isSpam: boolean; confidence: number } {
  let riskScore = 0;
  let maxScore = 0;

  if (features.hasUrgentWords) {
    riskScore += 15;
  }
  maxScore += 15;

  if (features.hasMoneyWords) {
    riskScore += 18;
  }
  maxScore += 18;

  if (features.hasLinkCount > 3) {
    riskScore += 12;
  } else if (features.hasLinkCount > 1) {
    riskScore += 6;
  }
  maxScore += 12;

  if (features.hasAllCaps) {
    riskScore += 10;
  }
  maxScore += 10;

  if (features.hasExclamationCount > 2) {
    riskScore += 8;
  }
  maxScore += 8;

  if (features.hasSuspiciousSender) {
    riskScore += 12;
  }
  maxScore += 12;

  if (features.hasAttachmentKeywords) {
    riskScore += 10;
  }
  maxScore += 10;

  if (features.capitalRatio > 0.3) {
    riskScore += 10;
  }
  maxScore += 10;

  if (features.subjectLength > 100) {
    riskScore += 5;
  }
  maxScore += 5;

  const normalizedScore = riskScore / maxScore;
  const isSpam = normalizedScore > 0.45;
  const confidence = isSpam ? normalizedScore : 1 - normalizedScore;

  return { isSpam, confidence };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { subject, content, sender } = await req.json();

    if (!subject || !content || !sender) {
      return new Response(
        JSON.stringify({ error: 'Subject, content, and sender are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const features = extractEmailFeatures(subject, content, sender);
    const { isSpam, confidence } = detectSpam(features);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('email_detections').insert({
      subject,
      content,
      sender,
      is_spam: isSpam,
      confidence_score: confidence,
      features,
    });

    await supabase.from('detection_history').insert({
      detection_type: 'email',
      result: isSpam ? 'spam' : 'safe',
      confidence,
    });

    return new Response(
      JSON.stringify({
        subject,
        sender,
        isSpam,
        confidence: Math.round(confidence * 100) / 100,
        features,
        message: isSpam
          ? 'Warning: This email appears to be spam'
          : 'Safe: This email appears to be legitimate',
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