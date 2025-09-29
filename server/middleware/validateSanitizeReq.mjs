import { body, param, query, validationResult } from "express-validator";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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
    const elementValidator =
      location === "body"
        ? body(`${fieldName}.*`)
        : location === "params"
        ? param(`${fieldName}.*`)
        : query(`${fieldName}.*`);

    checks.push(
      validator
        .optional({ checkFalsy: true })
        .isArray()
        .withMessage(`${fieldName} must be an array`)
    );

    if (type === "int") {
      checks.push(
        elementValidator
          .optional({ checkFalsy: true })
          .isInt({ min: 1 })
          .withMessage("Each ID must be a positive integer")
          .toInt()
      );
    } else if (type === "uuid") {
      checks.push(
        elementValidator
          .optional({ checkFalsy: true })
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
        validator.isUUID(4).withMessage("ID must be a valid UUIDv4").trim()
      );
    }
  }

  // Middleware to handle errors
  checks.push((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Array Id sanitization:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  });

  return checks;
};

export const validateNote = [
  body("title")
    .exists()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be 1–200 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .customSanitizer((value) => value.replace(/\r\n/g, "\n")) // normalize line breaks
    .isLength({ min: 1, max: 100000 })
    .withMessage("Content must be 1–100000 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("validateNote", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// 🚀 Safe sanitizer with DOMPurify (allows all CSS & HTML, strips unsafe)
export const sanitizeNote = (req, res, next) => {
  const purifyOptions = {
    ALLOW_ARBITRARY_ATTRIBUTES: true,
    SAFE_FOR_TEMPLATES: true,
    RETURN_TRUSTED_TYPE: false,
  };

  if (req.body.title) {
    req.body.title = DOMPurify.sanitize(req.body.title, purifyOptions);
  }

  if (req.body.content) {
    req.body.content = DOMPurify.sanitize(req.body.content, purifyOptions);
  }

  next();
};

