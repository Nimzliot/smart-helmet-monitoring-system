const { logger } = require("../config/logger");

const notifyEmergencyContact = ({ helmetId, rider, location }) => {
  const coordinates =
    location && location.latitude != null && location.longitude != null
      ? `Location: ${location.latitude}, ${location.longitude}`
      : "Location unavailable";

  logger.warn(
    `Emergency notification triggered for ${helmetId}. ` +
      `Contact ${rider?.emergency_contact || "N/A"} | ${coordinates}`
  );
};

module.exports = {
  notifyEmergencyContact,
};
