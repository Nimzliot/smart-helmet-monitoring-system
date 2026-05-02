let expressValidator;

try {
  expressValidator = require("express-validator");
} catch (error) {
  expressValidator = null;
}

const AppError = require("../utils/appError");

const createManualValidator = (rules) => (req, _res, next) => {
  const errors = rules
    .map((rule) => {
      const value = rule.source(req)[rule.field];
      return rule.validate(value, req) ? null : { msg: rule.message, path: rule.field };
    })
    .filter(Boolean);

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  return next();
};

const validate = expressValidator
  ? (chains) => [
      ...chains,
      (req, _res, next) => {
        const result = expressValidator.validationResult(req);
        if (!result.isEmpty()) {
          return next(new AppError("Validation failed", 400, result.array()));
        }

        return next();
      },
    ]
  : (rules) => [createManualValidator(rules)];

const fieldSource = {
  body: (req) => req.body || {},
  query: (req) => req.query || {},
};

const hasHelmetIdentifier = (body) => Boolean(body.helmet_id || body.device_id);
const isOptionalNumeric = (value) => value === undefined || value === null || value === "" || Number.isFinite(Number(value));
const isOptionalBooleanLike = (value) =>
  value === undefined ||
  value === null ||
  value === "" ||
  value === true ||
  value === false ||
  value === 0 ||
  value === 1 ||
  value === "0" ||
  value === "1";

const validators = {
  helmetData: expressValidator
    ? validate([
        expressValidator
          .body()
          .custom((body) => hasHelmetIdentifier(body))
          .withMessage("helmet_id or device_id is required"),
        expressValidator.body("battery_status").optional().isInt({ min: 0, max: 100 }),
        expressValidator.body("alcohol_value").optional().isNumeric(),
        expressValidator.body("alcohol_level").optional().isNumeric(),
        expressValidator.body("blink_rate").optional().isNumeric(),
        expressValidator.body("eye_closure_duration").optional().isNumeric(),
        expressValidator.body("accel_x").optional().isNumeric(),
        expressValidator.body("accel_y").optional().isNumeric(),
        expressValidator.body("accel_z").optional().isNumeric(),
        expressValidator.body("acceleration_x").optional().isNumeric(),
        expressValidator.body("acceleration_y").optional().isNumeric(),
        expressValidator.body("acceleration_z").optional().isNumeric(),
        expressValidator.body("acceleration.x").optional().isNumeric(),
        expressValidator.body("acceleration.y").optional().isNumeric(),
        expressValidator.body("acceleration.z").optional().isNumeric(),
        expressValidator.body("gyro_x").optional().isNumeric(),
        expressValidator.body("gyro_y").optional().isNumeric(),
        expressValidator.body("gyro_z").optional().isNumeric(),
        expressValidator.body("battery_voltage").optional().isNumeric(),
        expressValidator.body("drowsiness_status").optional().isInt({ min: 0, max: 1 }),
        expressValidator.body("accident_detected").optional().isInt({ min: 0, max: 1 }),
        expressValidator.body("latitude").optional().isFloat({ min: -90, max: 90 }),
        expressValidator.body("longitude").optional().isFloat({ min: -180, max: 180 }),
        expressValidator.body("gps.latitude").optional().isFloat({ min: -90, max: 90 }),
        expressValidator.body("gps.lat").optional().isFloat({ min: -90, max: 90 }),
        expressValidator.body("gps.longitude").optional().isFloat({ min: -180, max: 180 }),
        expressValidator.body("gps.lng").optional().isFloat({ min: -180, max: 180 }),
        expressValidator.body("gps_fix").optional().isBoolean().toBoolean(),
        expressValidator.body("gps.fix").optional().isBoolean().toBoolean(),
        expressValidator.body("gps_satellites").optional().isInt({ min: 0 }),
        expressValidator.body("gps.satellites").optional().isInt({ min: 0 }),
        expressValidator.body("gps_speed").optional().isNumeric(),
        expressValidator.body("gps.speed").optional().isNumeric(),
        expressValidator.body("gps_altitude").optional().isNumeric(),
        expressValidator.body("gps.altitude").optional().isNumeric(),
        expressValidator.body("gsm_signal_dbm").optional().isNumeric(),
        expressValidator.body("gsm.signal_dbm").optional().isNumeric(),
        expressValidator.body("gsm_registered").optional().isBoolean().toBoolean(),
        expressValidator.body("gsm.registered").optional().isBoolean().toBoolean(),
      ])
    : validate([
        {
          field: "helmet_id",
          source: fieldSource.body,
          validate: (_value, req) => hasHelmetIdentifier(req.body || {}),
          message: "helmet_id or device_id is required",
        },
        {
          field: "battery_status",
          source: fieldSource.body,
          validate: (value) =>
            value === undefined || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100),
          message: "battery_status must be between 0 and 100",
        },
        {
          field: "alcohol_value",
          source: fieldSource.body,
          validate: (value) => isOptionalNumeric(value),
          message: "alcohol_value must be numeric",
        },
        {
          field: "alcohol_level",
          source: fieldSource.body,
          validate: (value) => isOptionalNumeric(value),
          message: "alcohol_level must be numeric",
        },
        {
          field: "blink_rate",
          source: fieldSource.body,
          validate: (value) => isOptionalNumeric(value),
          message: "blink_rate must be numeric",
        },
        {
          field: "eye_closure_duration",
          source: fieldSource.body,
          validate: (value) => isOptionalNumeric(value),
          message: "eye_closure_duration must be numeric",
        },
        {
          field: "accident_detected",
          source: fieldSource.body,
          validate: (value) => isOptionalBooleanLike(value),
          message: "accident_detected must be 0 or 1",
        },
        {
          field: "drowsiness_status",
          source: fieldSource.body,
          validate: (value) => isOptionalBooleanLike(value),
          message: "drowsiness_status must be 0 or 1",
        },
        {
          field: "acceleration",
          source: fieldSource.body,
          validate: (value) =>
            value === undefined ||
            value === null ||
            (typeof value === "object" &&
              isOptionalNumeric(value.x) &&
              isOptionalNumeric(value.y) &&
              isOptionalNumeric(value.z)),
          message: "acceleration must include numeric x, y, and z values",
        },
        {
          field: "latitude",
          source: fieldSource.body,
          validate: (value, req) => {
            const latitude = value ?? req.body?.gps?.latitude ?? req.body?.gps?.lat;
            return latitude === undefined || (Number.isFinite(Number(latitude)) && Number(latitude) >= -90 && Number(latitude) <= 90);
          },
          message: "latitude must be between -90 and 90",
        },
        {
          field: "longitude",
          source: fieldSource.body,
          validate: (value, req) => {
            const longitude = value ?? req.body?.gps?.longitude ?? req.body?.gps?.lng;
            return longitude === undefined || (Number.isFinite(Number(longitude)) && Number(longitude) >= -180 && Number(longitude) <= 180);
          },
          message: "longitude must be between -180 and 180",
        },
        {
          field: "gps_fix",
          source: fieldSource.body,
          validate: (value, req) => isOptionalBooleanLike(value ?? req.body?.gps?.fix),
          message: "gps_fix must be boolean-like",
        },
        {
          field: "gps_satellites",
          source: fieldSource.body,
          validate: (value, req) => {
            const satellites = value ?? req.body?.gps?.satellites;
            return satellites === undefined || (Number.isFinite(Number(satellites)) && Number(satellites) >= 0);
          },
          message: "gps_satellites must be a non-negative number",
        },
        {
          field: "gps_speed",
          source: fieldSource.body,
          validate: (value, req) => isOptionalNumeric(value ?? req.body?.gps?.speed),
          message: "gps_speed must be numeric",
        },
        {
          field: "gps_altitude",
          source: fieldSource.body,
          validate: (value, req) => isOptionalNumeric(value ?? req.body?.gps?.altitude),
          message: "gps_altitude must be numeric",
        },
        {
          field: "gsm_signal_dbm",
          source: fieldSource.body,
          validate: (value, req) => isOptionalNumeric(value ?? req.body?.gsm?.signal_dbm),
          message: "gsm_signal_dbm must be numeric",
        },
        {
          field: "gsm_registered",
          source: fieldSource.body,
          validate: (value, req) => isOptionalBooleanLike(value ?? req.body?.gsm?.registered),
          message: "gsm_registered must be boolean-like",
        },
      ]),
  rider: expressValidator
    ? validate([
        expressValidator.body("name").notEmpty().withMessage("name is required"),
        expressValidator.body("phone").notEmpty().withMessage("phone is required"),
        expressValidator.body("emergency_contact").notEmpty().withMessage("emergency_contact is required"),
        expressValidator.body("email").isEmail().withMessage("A valid email is required"),
      ])
    : validate([
        {
          field: "name",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "name is required",
        },
        {
          field: "phone",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "phone is required",
        },
        {
          field: "emergency_contact",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "emergency_contact is required",
        },
        {
          field: "email",
          source: fieldSource.body,
          validate: (value) => typeof value === "string" && value.includes("@"),
          message: "A valid email is required",
        },
      ]),
  helmet: expressValidator
    ? validate([
        expressValidator.body("helmet_id").notEmpty().withMessage("helmet_id is required"),
        expressValidator.body("status").optional().isString(),
        expressValidator.body("battery_level").optional().isInt({ min: 0, max: 100 }),
        expressValidator.body("communication_mode").optional().isString(),
        expressValidator.body("gsm_network").optional().isString(),
        expressValidator.body("gsm_operator").optional().isString(),
      ])
    : validate([
        {
          field: "helmet_id",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "helmet_id is required",
        },
      ]),
  login: expressValidator
    ? validate([
        expressValidator.body("email").isEmail().withMessage("A valid email is required"),
        expressValidator.body("password").notEmpty().withMessage("password is required"),
      ])
    : validate([
        {
          field: "email",
          source: fieldSource.body,
          validate: (value) => typeof value === "string" && value.includes("@"),
          message: "A valid email is required",
        },
        {
          field: "password",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "password is required",
        },
      ]),
};

module.exports = validators;
