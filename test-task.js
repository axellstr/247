// Simple script to trigger your helloWorld task
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { configure, tasks } from "@trigger.dev/sdk";

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, ".env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (err) {
  console.error("❌ Error reading .env file:", err.message);
  process.exit(1);
}

// Configure the SDK
configure({
  secretKey: process.env["TRIGGER_SECRET_KEY"],
});

async function testTask() {
  try {
    console.log("🚀 Triggering helloWorld task...");
    
    // Test the stoic quote email task
    const handle = await tasks.trigger("send-stoic-quote-email", {
      to: "test@example.com", // Change to your email for testing
      quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius",
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    console.log("✅ Task triggered successfully!");
    console.log("📋 Run ID:", handle.id);
    console.log("\n💡 Check your Trigger.dev dashboard to see the task run!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testTask();

