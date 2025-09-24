const express = require("express");
const router = express.Router();
const WebhookController = require("../controllers/WebhookController");
const { authenticateToken } = require("../middleware/auth");

// Webhook verification endpoint (no auth required)
router.get("/instagram/verify", WebhookController.verifyWebhook);

// Webhook event handling endpoint (no auth required)
router.post("/instagram/webhook", WebhookController.handleWebhook);

// Create fixed token connection for development/testing (requires auth)
router.post(
    "/instagram/fixed-token",
    authenticateToken,
    WebhookController.createFixedTokenConnection
);

module.exports = router;
