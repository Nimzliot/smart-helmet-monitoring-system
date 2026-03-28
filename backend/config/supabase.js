require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { logger } = require("./logger");
const env = require("./env");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = env.supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY;
const usingServiceRole = Boolean(env.supabaseServiceRoleKey);

const configured = Boolean(
  supabaseUrl &&
    supabaseUrl.startsWith("http") &&
    supabaseKey
);

if (!configured) {
  logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY is missing or invalid in .env");
  logger.warn("Database features will fall back to in-memory storage.");
} else if (usingServiceRole) {
  logger.info("Supabase configured with service role key for backend access.");
}

module.exports = {
  client: configured ? createClient(supabaseUrl, supabaseKey) : null,
  configured,
};
