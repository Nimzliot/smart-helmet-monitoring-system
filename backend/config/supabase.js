require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { logger } = require("./logger");
const env = require("./env");
const AppError = require("../utils/appError");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = env.supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY;
const usingServiceRole = Boolean(env.supabaseServiceRoleKey);
const SUPABASE_TIMEOUT_MS = 5000;

const configured = Boolean(
  supabaseUrl &&
    supabaseUrl.startsWith("http") &&
    supabaseKey
);

if (!configured) {
  logger.error("Supabase configuration is invalid.");
  logger.error("SUPABASE_URL must be a valid http(s) URL and SUPABASE_SERVICE_ROLE_KEY is required in backend/.env");
  throw new AppError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env", 500);
} else if (usingServiceRole) {
  logger.info("Supabase configured with service role key for backend access.");
} else {
  logger.warn("Supabase is configured without service role key. Backend writes may be limited by RLS.");
}

const client = createClient(supabaseUrl, supabaseKey);

const formatSupabaseError = (error) => {
  if (!error) return "Unknown Supabase error";

  const parts = [];

  if (error.name) parts.push(`name=${error.name}`);
  if (error.message) parts.push(`message=${error.message}`);
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  if (error.cause?.message) parts.push(`cause=${error.cause.message}`);

  return parts.join(" | ") || String(error);
};

const logSupabaseError = (context, error) => {
  logger.error(`${context}: ${formatSupabaseError(error)}`);

  if (error?.stack) {
    logger.error(error.stack);
  }

  if (error?.cause) {
    logger.error("Supabase error cause:", error.cause);
  }
};

const withTimeout = async (operation, timeoutMs = SUPABASE_TIMEOUT_MS) => {
  let timer = null;

  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const timeoutError = new Error(`Supabase request timed out after ${timeoutMs}ms`);
          timeoutError.code = "SUPABASE_TIMEOUT";
          reject(timeoutError);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const isNetworkLevelError = (error) =>
  Boolean(
    error?.message?.includes("fetch failed") ||
    error?.message?.includes("ENOTFOUND") ||
    error?.message?.includes("ECONNREFUSED") ||
    error?.message?.includes("ETIMEDOUT") ||
    error?.cause?.code === "ENOTFOUND" ||
    error?.cause?.code === "ECONNREFUSED" ||
    error?.cause?.code === "ETIMEDOUT"
  );

const checkSupabaseConnection = async () => {
  try {
    const { error } = await withTimeout(() =>
      client.from("helmets").select("helmet_id", { head: true, count: "exact" }).limit(1)
    );

    if (error) {
      throw error;
    }

    return { status: "ok", error: null };
  } catch (error) {
    const prefix = isNetworkLevelError(error) ? "Network-level Supabase failure" : "Supabase connection failed";
    logSupabaseError(prefix, error);
    return { status: "fail", error: formatSupabaseError(error) };
  }
};

module.exports = {
  client,
  configured,
  SUPABASE_TIMEOUT_MS,
  withTimeout,
  formatSupabaseError,
  logSupabaseError,
  isNetworkLevelError,
  checkSupabaseConnection,
};
