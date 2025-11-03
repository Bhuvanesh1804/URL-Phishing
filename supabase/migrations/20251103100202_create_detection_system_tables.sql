/*
  # Phishing and Spam Detection System Schema

  1. New Tables
    - `url_detections`
      - `id` (uuid, primary key) - Unique identifier
      - `url` (text) - The URL being analyzed
      - `is_phishing` (boolean) - Detection result
      - `confidence_score` (numeric) - ML model confidence (0-1)
      - `features` (jsonb) - Extracted features for analysis
      - `user_id` (uuid, nullable) - User who submitted (if authenticated)
      - `created_at` (timestamptz) - Timestamp of detection
      
    - `email_detections`
      - `id` (uuid, primary key) - Unique identifier
      - `subject` (text) - Email subject line
      - `content` (text) - Email body content
      - `sender` (text) - Email sender address
      - `is_spam` (boolean) - Detection result
      - `confidence_score` (numeric) - ML model confidence (0-1)
      - `features` (jsonb) - Extracted features for analysis
      - `user_id` (uuid, nullable) - User who submitted (if authenticated)
      - `created_at` (timestamptz) - Timestamp of detection
      
    - `detection_history`
      - `id` (uuid, primary key) - Unique identifier
      - `detection_type` (text) - 'url' or 'email'
      - `result` (text) - 'safe', 'phishing', or 'spam'
      - `confidence` (numeric) - Confidence score
      - `user_id` (uuid, nullable) - User who performed detection
      - `created_at` (timestamptz) - Timestamp

  2. Security
    - Enable RLS on all tables
    - Public can insert detections (for unauthenticated access)
    - Authenticated users can view their own detection history
    - Public read access to detection_history for analytics
    
  3. Important Notes
    - Designed for real-time phishing and spam detection
    - Supports both authenticated and anonymous usage
    - JSONB used for flexible feature storage from ML models
    - Indexes added for performance on common queries
*/

CREATE TABLE IF NOT EXISTS url_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  is_phishing boolean NOT NULL,
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  features jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  sender text NOT NULL,
  is_spam boolean NOT NULL,
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  features jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_type text NOT NULL CHECK (detection_type IN ('url', 'email')),
  result text NOT NULL CHECK (result IN ('safe', 'phishing', 'spam')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_url_detections_created_at ON url_detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_detections_created_at ON email_detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_history_type ON detection_history(detection_type);
CREATE INDEX IF NOT EXISTS idx_detection_history_created_at ON detection_history(created_at DESC);

ALTER TABLE url_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert URL detections"
  ON url_detections FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own URL detections"
  ON url_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view recent URL detections"
  ON url_detections FOR SELECT
  TO public
  USING (created_at > now() - interval '1 hour' AND user_id IS NULL);

CREATE POLICY "Anyone can insert email detections"
  ON email_detections FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own email detections"
  ON email_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view recent email detections"
  ON email_detections FOR SELECT
  TO public
  USING (created_at > now() - interval '1 hour' AND user_id IS NULL);

CREATE POLICY "Anyone can insert detection history"
  ON detection_history FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view detection history"
  ON detection_history FOR SELECT
  TO public
  USING (true);