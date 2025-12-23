import { schedules, task } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

// Collection of stoic quotes
const STOIC_QUOTES = [
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
  },
  {
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
  },
  {
    quote: "We suffer more often in imagination than in reality.",
    author: "Seneca",
  },
  {
    quote: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus",
  },
  {
    quote: "The best revenge is not being like your enemy.",
    author: "Marcus Aurelius",
  },
  {
    quote: "He who fears death will never do anything worth of a man who is alive.",
    author: "Seneca",
  },
  {
    quote: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.",
    author: "Marcus Aurelius",
  },
  {
    quote: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius",
  },
  {
    quote: "How long are you going to wait before you demand the best for yourself?",
    author: "Epictetus",
  },
  {
    quote: "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.",
    author: "Marcus Aurelius",
  },
  {
    quote: "Wealth consists not in having great possessions, but in having few wants.",
    author: "Epictetus",
  },
  {
    quote: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
  },
  {
    quote: "No person has the power to have everything they want, but it is in their power not to want what they don't have.",
    author: "Seneca",
  },
  {
    quote: "Accept whatever comes to you woven in the pattern of your destiny, for what could more aptly fit your needs?",
    author: "Marcus Aurelius",
  },
  {
    quote: "The key is to keep company only with people who uplift you, whose presence calls forth your best.",
    author: "Epictetus",
  },
  {
    quote: "If a man knows not to which port he sails, no wind is favorable.",
    author: "Seneca",
  },
  {
    quote: "You become what you give your attention to.",
    author: "Epictetus",
  },
  {
    quote: "The whole future lies in uncertainty: live immediately.",
    author: "Seneca",
  },
  {
    quote: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
  },
  {
    quote: "He suffers more than necessary, who suffers before it is necessary.",
    author: "Seneca",
  },
  {
    quote: "First say to yourself what you would be; and then do what you have to do.",
    author: "Epictetus",
  },
  {
    quote: "The mind that is anxious about future events is miserable.",
    author: "Seneca",
  },
  {
    quote: "Nothing happens to anybody which he is not fitted by nature to bear.",
    author: "Marcus Aurelius",
  },
  {
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
  },
  {
    quote: "No great thing is created suddenly.",
    author: "Epictetus",
  },
  {
    quote: "The only way to happiness is to cease worrying about things which are beyond the power of our will.",
    author: "Epictetus",
  },
  {
    quote: "Begin at once to live, and count each separate day as a separate life.",
    author: "Seneca",
  },
  {
    quote: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
    author: "Marcus Aurelius",
  },
  {
    quote: "The wise man finds pleasure in water; the virtuous man finds it in a good name.",
    author: "Confucius",
  },
  {
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
  },
];

/**
 * Get a different stoic quote each day based on the day of the year
 * This ensures the same quote is sent to all recipients on the same day
 */
function getDailyQuote(): { quote: string; author: string } {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );

  const quoteIndex = dayOfYear % STOIC_QUOTES.length;
  return STOIC_QUOTES[quoteIndex];
}

/**
 * Get Supabase client for database access
 */
function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Scheduled task that runs daily at 8:00 AM UTC
 * Sends a different stoic quote to all active subscribers
 */
export const dailyStoicQuote = schedules.task({
  id: "daily-stoic-quote",
  cron: "0 8 * * *", // Every day at 8:00 AM UTC
  run: async (payload) => {
    const quote = getDailyQuote();
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`📬 Sending daily stoic quote for ${today}`);
    console.log(`📜 Quote: "${quote.quote}" - ${quote.author}`);

    // Get subscribers from Supabase
    const supabase = getSupabase();

    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("subscribed", true);

    if (error) {
      console.error("Failed to fetch subscribers:", error);
      throw new Error(`Failed to fetch subscribers: ${error.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.warn("⚠️ No active subscribers found");
      return {
        sent: false,
        reason: "No active subscribers",
        date: today,
      };
    }

    console.log(`📧 Sending quotes to ${subscribers.length} subscriber(s)`);

    // Get the app URL for unsubscribe links
    const appUrl = process.env.APP_URL || "https://your-app.vercel.app";

    // Trigger email sending for each subscriber
    const emailResults = await Promise.all(
      subscribers.map((subscriber) => {
        const unsubscribeUrl = `${appUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`;

        return sendStoicQuoteEmail.trigger({
          to: subscriber.email,
          quote: quote.quote,
          author: quote.author,
          date: today,
          unsubscribeUrl,
        });
      })
    );

    return {
      sent: true,
      date: today,
      quote: quote.quote,
      author: quote.author,
      subscribersCount: subscribers.length,
      emailResults: emailResults.map((r) => r.id),
    };
  },
});

/**
 * Task that sends a stoic quote email to a single recipient
 * Can be triggered individually or by the scheduled task
 */
export const sendStoicQuoteEmail = task({
  id: "send-stoic-quote-email",
  run: async (payload: {
    to: string;
    quote: string;
    author: string;
    date: string;
    unsubscribeUrl?: string;
  }) => {
    // Validate payload
    if (!payload.to || payload.to.trim() === "") {
      throw new Error("Email address (to) is required but was not provided");
    }

    if (!payload.quote || payload.quote.trim() === "") {
      throw new Error("Quote is required but was not provided");
    }

    if (!payload.author || payload.author.trim() === "") {
      throw new Error("Author is required but was not provided");
    }

    console.log(`📧 Sending stoic quote email to ${payload.to}`);

    const unsubscribeLink = payload.unsubscribeUrl
      ? `<a href="${payload.unsubscribeUrl}" style="color: #95a5a6;">Unsubscribe</a>`
      : "";

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Stoic Quote - ${payload.date}</title>
        </head>
        <body style="font-family: Georgia, serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #c9a962; margin: 0; font-size: 28px; font-weight: 400;">Daily Stoic</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0 0; font-size: 14px;">${payload.date}</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <blockquote style="font-size: 22px; font-style: italic; color: #2c3e50; margin: 0 0 20px 0; padding-left: 20px; border-left: 4px solid #c9a962; line-height: 1.5;">
              "${payload.quote}"
            </blockquote>
            
            <p style="text-align: right; color: #7f8c8d; font-size: 16px; margin: 0;">
              — <strong style="color: #c9a962;">${payload.author}</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              Start your day with wisdom from the Stoics
              ${unsubscribeLink ? `<br><br>${unsubscribeLink}` : ""}
            </p>
          </div>
        </body>
      </html>
    `;

    // Email plain text version
    const emailText = `
Daily Stoic - ${payload.date}

"${payload.quote}"

— ${payload.author}

Start your day with wisdom from the Stoics
${payload.unsubscribeUrl ? `\nUnsubscribe: ${payload.unsubscribeUrl}` : ""}
    `.trim();

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    let emailFrom = process.env.EMAIL_FROM || "Daily Stoic <onboarding@resend.dev>";
    emailFrom = emailFrom.trim().replace(/^["']|["']$/g, "");

    if (!emailFrom || !emailFrom.includes("@")) {
      throw new Error(`Invalid EMAIL_FROM format: "${emailFrom}"`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: payload.to,
        subject: `Daily Stoic — ${payload.author}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${error.message || response.statusText}`);
    }

    const result = await response.json();

    console.log(`✅ Email sent successfully to ${payload.to}`, {
      emailId: result.id,
    });

    return {
      sent: true,
      to: payload.to,
      quote: payload.quote,
      author: payload.author,
      date: payload.date,
      sentAt: new Date().toISOString(),
      emailId: result.id,
    };
  },
});
