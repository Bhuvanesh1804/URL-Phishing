export interface URLDetectionResult {
  url: string;
  isPhishing: boolean;
  confidence: number;
  features: Record<string, unknown>;
  message: string;
}

export interface EmailDetectionResult {
  subject: string;
  sender: string;
  isSpam: boolean;
  confidence: number;
  features: Record<string, unknown>;
  message: string;
}

export interface DetectionHistory {
  id: string;
  detection_type: 'url' | 'email';
  result: 'safe' | 'phishing' | 'spam';
  confidence: number;
  created_at: string;
}
