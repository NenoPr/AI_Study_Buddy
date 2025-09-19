import { body, param, query, validationResult } from "express-validator";

/**
 * validateAndSanitizeId
 * @param {Object} options
 * @param {"body" | "params" | "query"} options.location - where the ID comes from
 * @param {"int" | "uuid"} options.type - type of ID
 * @param {string} options.fieldName - field name, e.g., "id" or "groups_ids"
 * @param {boolean} options.isArray - true if the field is an array of IDs
 */
export const validateAndSanitizeId = ({
  location = "body",
  type = "int",
  fieldName = "id",
  isArray = false,
}) => {
  const validator =
    location === "body"
      ? body(fieldName)
      : location === "params"
      ? param(fieldName)
      : query(fieldName);

  const checks = [];

  if (isArray) {
    // Field must be an array
    checks.push(
      validator
        .isArray({ min: 1 })
        .withMessage(`${fieldName} must be a non-empty array`)
    );

    // Each element
    if (type === "int") {
      checks.push(
        body(`${fieldName}.*`)
          .isInt({ min: 1 })
          .withMessage("Each ID must be a positive integer")
          .toInt()
      );
    } else if (type === "uuid") {
      checks.push(
        body(`${fieldName}.*`)
          .isUUID(4)
          .withMessage("Each ID must be a valid UUIDv4")
          .trim()
      );
    }
  } else {
    // Single ID
    if (type === "int") {
      checks.push(
        validator
          .isInt({ min: 1 })
          .withMessage("ID must be a positive integer")
          .toInt()
      );
    } else if (type === "uuid") {
      checks.push(
        validator
          .isUUID(4)
          .withMessage("ID must be a valid UUIDv4")
          .trim()
      );
    }
  }

  // Middleware to handle errors
  checks.push((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  });

  return checks;
};
