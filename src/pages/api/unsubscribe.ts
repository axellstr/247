import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Rate limiting check
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('subscribers')
      .update({ subscribed: false })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Email not found in our subscribers list.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'You have been successfully unsubscribed. We hope to see you again!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

