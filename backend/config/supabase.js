const { createClient } = require("@supabase/supabase-js");
const { logger } = require("./logger");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const configured = Boolean(
  supabaseUrl &&
    supabaseUrl.startsWith("http") &&
    supabaseKey
);

if (!configured) {
  logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY is missing or invalid in .env");
  logger.warn("Database features will fall back to in-memory storage.");
}

module.exports = {
  client: configured ? createClient(supabaseUrl, supabaseKey) : null,
  configured,
};
