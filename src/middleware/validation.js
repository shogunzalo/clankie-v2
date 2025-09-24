const { body, param, query, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
                value: error.value,
            })),
        });
    }
    next();
};

// Business validation rules
const validateBusiness = [
    body("company_name")
        .notEmpty()
        .withMessage("Company name is required")
        .isLength({ min: 1, max: 255 })
        .withMessage("Company name must be between 1 and 255 characters"),

    body("owner_email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

    body("business_type")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Business type must be less than 100 characters"),

    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Valid phone number required"),

    body("website").optional().isURL().withMessage("Valid URL required"),

    body("primary_language")
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage("Language code must be between 2 and 10 characters"),

    body("timezone")
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage("Timezone must be between 3 and 50 characters"),

    body("subscription_plan")
        .optional()
        .isIn(["free", "basic", "premium", "enterprise"])
        .withMessage("Invalid subscription plan"),

    handleValidationErrors,
];

// Client validation rules
const validateClient = [
    body("platform_user_id")
        .notEmpty()
        .withMessage("Platform user ID is required")
        .isLength({ min: 1, max: 255 })
        .withMessage("Platform user ID must be between 1 and 255 characters"),

    body("platform_type")
        .notEmpty()
        .withMessage("Platform type is required")
        .isIn([
            "whatsapp",
            "telegram",
            "facebook",
            "instagram",
            "website",
            "email",
            "other",
        ])
        .withMessage("Invalid platform type"),

    body("display_name")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Display name must be less than 255 characters"),

    body("email").optional().isEmail().withMessage("Valid email required"),

    body("preferred_language")
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage("Language code must be between 2 and 10 characters"),

    handleValidationErrors,
];

// Conversation validation rules
const validateConversation = [
    body("client_id")
        .notEmpty()
        .withMessage("Client ID is required")
        .isInt({ min: 1 })
        .withMessage("Valid client ID required"),

    body("source_id")
        .notEmpty()
        .withMessage("Source ID is required")
        .isInt({ min: 1 })
        .withMessage("Valid source ID required"),

    body("conversation_language")
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage("Language code must be between 2 and 10 characters"),

    body("current_state")
        .optional()
        .isIn(["active", "paused", "closed", "escalated"])
        .withMessage("Invalid conversation state"),

    handleValidationErrors,
];

// Message validation rules
const validateMessage = [
    body("sender_type")
        .notEmpty()
        .withMessage("Sender type is required")
        .isIn(["customer", "bot", "agent", "system"])
        .withMessage("Invalid sender type"),

    body("message_text")
        .notEmpty()
        .withMessage("Message text is required")
        .isLength({ min: 1, max: 10000 })
        .withMessage("Message text must be between 1 and 10000 characters"),

    body("conversation_id")
        .notEmpty()
        .withMessage("Conversation ID is required")
        .isInt({ min: 1 })
        .withMessage("Valid conversation ID required"),

    handleValidationErrors,
];

// FAQ validation rules
const validateFaqItem = [
    body("language_code")
        .notEmpty()
        .withMessage("Language code is required")
        .isLength({ min: 2, max: 10 })
        .withMessage("Language code must be between 2 and 10 characters"),

    body("question")
        .notEmpty()
        .withMessage("Question is required")
        .isLength({ min: 1, max: 1000 })
        .withMessage("Question must be between 1 and 1000 characters"),

    body("answer")
        .notEmpty()
        .withMessage("Answer is required")
        .isLength({ min: 1, max: 5000 })
        .withMessage("Answer must be between 1 and 5000 characters"),

    body("category")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Category must be less than 100 characters"),

    handleValidationErrors,
];

// Service validation rules
const validateService = [
    body("language_code")
        .notEmpty()
        .withMessage("Language code is required")
        .isLength({ min: 2, max: 10 })
        .withMessage("Language code must be between 2 and 10 characters"),

    body("service_name")
        .notEmpty()
        .withMessage("Service name is required")
        .isLength({ min: 1, max: 255 })
        .withMessage("Service name must be between 1 and 255 characters"),

    body("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Description must be less than 2000 characters"),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),

    body("currency")
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage("Currency must be a 3-character code"),

    body("duration_minutes")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Duration must be a non-negative integer"),

    handleValidationErrors,
];

// ID parameter validation
const validateId = [
    param("id").isInt({ min: 1 }).withMessage("Valid ID required"),

    handleValidationErrors,
];

// Pagination validation
const validatePagination = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),

    handleValidationErrors,
];

module.exports = {
    handleValidationErrors,
    validateBusiness,
    validateClient,
    validateConversation,
    validateMessage,
    validateFaqItem,
    validateService,
    validateId,
    validatePagination,
};
