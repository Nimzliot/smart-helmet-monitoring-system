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

const validators = {
  helmetData: expressValidator
    ? validate([
        expressValidator.body("helmet_id").notEmpty().withMessage("helmet_id is required"),
        expressValidator.body("battery_status").optional().isInt({ min: 0, max: 100 }),
        expressValidator.body("alcohol_value").optional().isNumeric(),
        expressValidator.body("blink_rate").optional().isNumeric(),
        expressValidator.body("eye_closure_duration").optional().isNumeric(),
        expressValidator.body("accel_x").optional().isNumeric(),
        expressValidator.body("accel_y").optional().isNumeric(),
        expressValidator.body("accel_z").optional().isNumeric(),
        expressValidator.body("gyro_x").optional().isNumeric(),
        expressValidator.body("gyro_y").optional().isNumeric(),
        expressValidator.body("gyro_z").optional().isNumeric(),
        expressValidator.body("battery_voltage").optional().isNumeric(),
        expressValidator.body("latitude").optional().isFloat({ min: -90, max: 90 }),
        expressValidator.body("longitude").optional().isFloat({ min: -180, max: 180 }),
      ])
    : validate([
        {
          field: "helmet_id",
          source: fieldSource.body,
          validate: (value) => Boolean(value),
          message: "helmet_id is required",
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
          validate: (value) => value === undefined || Number.isFinite(Number(value)),
          message: "alcohol_value must be numeric",
        },
        {
          field: "blink_rate",
          source: fieldSource.body,
          validate: (value) => value === undefined || Number.isFinite(Number(value)),
          message: "blink_rate must be numeric",
        },
        {
          field: "eye_closure_duration",
          source: fieldSource.body,
          validate: (value) => value === undefined || Number.isFinite(Number(value)),
          message: "eye_closure_duration must be numeric",
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
