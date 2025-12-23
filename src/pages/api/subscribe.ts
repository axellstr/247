import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

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
          .update({ subscribed: true, unsubscribe_token: unsubscribeToken })
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
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Welcome! You will receive your first stoic quote tomorrow at 8 AM.' }),
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

