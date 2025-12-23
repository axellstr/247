import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory rate limiter
// In production, consider using Redis or a distributed solution
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

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

// Clean up old entries periodically (every 5 minutes)
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

    const { email, timezone } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomUUID();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, subscribed')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.subscribed) {
        return new Response(
          JSON.stringify({ error: 'This email is already subscribed!' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Re-subscribe
        const { error } = await supabase
          .from('subscribers')
          .update({ 
            subscribed: true, 
            unsubscribe_token: unsubscribeToken,
            timezone: timezone || 'UTC'
          })
          .eq('id', existing.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Welcome back! You have been re-subscribed.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase(),
        subscribed: true,
        unsubscribe_token: unsubscribeToken,
        timezone: timezone || 'UTC',
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Welcome! Your daily wisdom will arrive at 7 AM your local time.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

