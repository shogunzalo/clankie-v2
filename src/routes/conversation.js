const express = require("express");
const router = express.Router();
const ConversationController = require("../controllers/ConversationController");
const { authenticateToken } = require("../middleware/auth");
const {
    validateId,
    validatePagination,
    handleValidationErrors,
} = require("../middleware/validation");

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/conversations - Get all conversations for authenticated client
router.get(
    "/",
    validatePagination,
    handleValidationErrors,
    ConversationController.getConversations
);

// POST /api/conversations - Create a new conversation
router.post("/", ConversationController.createConversation);

// GET /api/conversations/:id - Get a specific conversation
router.get(
    "/:id",
    validateId,
    handleValidationErrors,
    ConversationController.getConversation
);

// PUT /api/conversations/:id - Update a conversation
router.put(
    "/:id",
    validateId,
    handleValidationErrors,
    ConversationController.updateConversation
);

// DELETE /api/conversations/:id - Delete a conversation
router.delete(
    "/:id",
    validateId,
    handleValidationErrors,
    ConversationController.deleteConversation
);

// PATCH /api/conversations/:id/state - Update conversation state
router.patch(
    "/:id/state",
    validateId,
    handleValidationErrors,
    ConversationController.updateState
);

// GET /api/conversations/:id/messages - Get messages for a conversation
router.get(
    "/:id/messages",
    validateId,
    validatePagination,
    handleValidationErrors,
    ConversationController.getMessages
);

// POST /api/conversations/:id/messages - Send a message in a conversation
router.post(
    "/:id/messages",
    validateId,
    handleValidationErrors,
    ConversationController.sendMessage
);

// GET /api/conversations/:id/stats - Get conversation statistics
router.get(
    "/:id/stats",
    validateId,
    handleValidationErrors,
    ConversationController.getConversationStats
);

module.exports = router;
