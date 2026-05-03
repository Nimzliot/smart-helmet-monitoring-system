const env = require("../config/env");
const { logger } = require("../config/logger");

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

const normalizePhoneNumber = (value) => String(value || "").replace(/\D/g, "");

const buildMapLink = (location) =>
  location && location.latitude != null && location.longitude != null
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : null;

const buildEventLabel = (record) => {
  const alcohol = Boolean(record?.alcohol_detected);
  const drowsiness = Boolean(record?.drowsiness);
  const fall = Boolean(record?.fall_detected);
  const active = [
    alcohol ? "alcohol" : null,
    drowsiness ? "drowsiness" : null,
    fall ? "fall" : null,
  ].filter(Boolean);

  if (active.length === 3) return "Alcohol, drowsiness, and fall detected";
  if (active.length === 2) return `${active[0][0].toUpperCase()}${active[0].slice(1)} and ${active[1]} detected`;
  if (fall) return "Accident detected";
  if (record?.alcohol_detected) return "Alcohol detected";
  if (record?.drowsiness) return "Drowsiness detected";
  return "Emergency detected";
};

const buildSmsMessage = ({ helmetId, rider, vehicleName, location, record }) => {
  const mapLink = buildMapLink(location);
  const riderName = rider?.name || "Unknown rider";
  const vehicleLabel = vehicleName || helmetId;
  const eventLabel = buildEventLabel(record);

  return [
    `Smart Helmet Alert: ${eventLabel}.`,
    `Vehicle: ${vehicleLabel}.`,
    `Rider: ${riderName}.`,
    mapLink ? `Map: ${mapLink}` : "Map: unavailable.",
  ].join(" ");
};

const sendFast2Sms = async ({ message, numbers }) => {
  if (!env.fast2smsApiKey) {
    return { skipped: true, reason: "FAST2SMS_API_KEY not configured" };
  }

  if (typeof fetch !== "function") {
    return { skipped: true, reason: "Global fetch is unavailable in this Node runtime" };
  }

  if (!numbers.length) {
    return { skipped: true, reason: "No recipient number available" };
  }

  const body = new URLSearchParams({
    route: env.fast2smsRoute,
    language: env.fast2smsLanguage,
    numbers: numbers.join(","),
    message,
  });

  const response = await fetch(FAST2SMS_URL, {
    method: "POST",
    headers: {
      authorization: env.fast2smsApiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || payload?.return === false) {
    throw new Error(payload?.message?.join?.(", ") || payload?.message || `Fast2SMS failed with status ${response.status}`);
  }

  return payload;
};

const notifyEmergencyContact = async ({ helmetId, helmet, rider, location, record }) => {
  const mapLink = buildMapLink(location);
  const configuredFast2SmsNumber = normalizePhoneNumber(env.fast2smsNumber);
  const normalizedEmergencyContact = normalizePhoneNumber(rider?.emergency_contact);
  const smsRecipient = configuredFast2SmsNumber || normalizedEmergencyContact;
  const message = buildSmsMessage({
    helmetId,
    rider,
    vehicleName: helmet?.vehicle_name || helmet?.helmet_id || helmetId,
    location,
    record,
  });

  logger.warn(
    `Emergency event stored for ${helmetId}. ` +
      `Contact ${smsRecipient || "N/A"} | ${mapLink || "Map unavailable"} | ` +
      `ESP/GSM flow remains active${env.fast2smsApiKey ? " and backend Fast2SMS will be attempted." : "."}`
  );

  try {
    const smsResult = await sendFast2Sms({
      message,
      numbers: smsRecipient ? [smsRecipient] : [],
    });

    if (smsResult?.skipped) {
      logger.warn(`Fast2SMS skipped for ${helmetId}: ${smsResult.reason}`);
      return smsResult;
    }

    logger.info(`Fast2SMS notification sent for ${helmetId}`);
    return smsResult;
  } catch (error) {
    logger.error(`Fast2SMS notification failed for ${helmetId}`, error.message);
    return null;
  }
};

module.exports = {
  notifyEmergencyContact,
};
