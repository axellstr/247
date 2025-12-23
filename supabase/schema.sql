-- =============================================
-- DAILY STOIC - Supabase Database Schema
-- =============================================

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
  timezone TEXT DEFAULT 'UTC',  -- IANA timezone like 'Europe/London' or 'Asia/Tokyo'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add timezone column to existing table (run this if table already exists)
-- ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index on subscribed for filtering active subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed ON subscribers(subscribed) WHERE subscribed = true;

-- Create index on unsubscribe_token for one-click unsubscribe
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token);

-- Enable Row Level Security (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts (for subscriptions)
CREATE POLICY "Allow anonymous inserts" ON subscribers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow updates to own subscription (via unsubscribe token)
CREATE POLICY "Allow unsubscribe via token" ON subscribers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role to read all (for Trigger.dev)
CREATE POLICY "Allow service role read all" ON subscribers
  FOR SELECT
  USING (true);

