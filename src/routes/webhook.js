const express = require("express");
const router = express.Router();
const WebhookController = require("../controllers/WebhookController");
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * /webhooks/instagram/verify:
 *   get:
 *     summary: Verify Instagram webhook
 *     description: Verify Instagram webhook subscription with challenge-response
 *     tags: [Webhook]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [subscribe]
 *         description: Webhook verification mode
 *         example: "subscribe"
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook verification token
 *         example: "your_verify_token"
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge string from Instagram
 *         example: "challenge_string"
 *     responses:
 *       200:
 *         description: Webhook verified successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "challenge_string"
 *       403:
 *         description: Verification failed
 */
router.get("/instagram/verify", WebhookController.verifyWebhook);

/**
 * @swagger
 * /webhooks/instagram/webhook:
 *   post:
 *     summary: Handle Instagram webhook events
 *     description: Process incoming Instagram webhook events including messages, postbacks, and delivery confirmations
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object:
 *                 type: string
 *                 description: Object type
 *                 example: "instagram"
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Page ID
 *                       example: "page_123"
 *                     time:
 *                       type: integer
 *                       description: Event timestamp
 *                       example: 1234567890
 *                     messaging:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sender:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: User ID
 *                                 example: "user_123"
 *                           recipient:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: Page ID
 *                                 example: "page_123"
 *                           timestamp:
 *                             type: integer
 *                             description: Message timestamp
 *                             example: 1234567890
 *                           message:
 *                             type: object
 *                             properties:
 *                               mid:
 *                                 type: string
 *                                 description: Message ID
 *                                 example: "msg_123"
 *                               text:
 *                                 type: string
 *                                 description: Message text
 *                                 example: "Hello, I'm interested in your services"
 *                               attachments:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     type:
 *                                       type: string
 *                                       example: "image"
 *                                     payload:
 *                                       type: object
 *                                       properties:
 *                                         url:
 *                                           type: string
 *                                           format: uri
 *                                           example: "https://example.com/image.jpg"
 *     responses:
 *       200:
 *         description: Webhook event processed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "EVENT_RECEIVED"
 *       400:
 *         description: Invalid webhook payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/instagram/webhook", WebhookController.handleWebhook);

/**
 * @swagger
 * /webhooks/instagram/fixed-token:
 *   post:
 *     summary: Create fixed token connection
 *     description: Create a fixed token connection for development and testing purposes
 *     tags: [Webhook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *               - page_id
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Instagram access token
 *                 example: "your_access_token"
 *               page_id:
 *                 type: string
 *                 description: Instagram page ID
 *                 example: "page_123"
 *               verify_token:
 *                 type: string
 *                 description: Webhook verification token
 *                 example: "your_verify_token"
 *     responses:
 *       200:
 *         description: Fixed token connection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Fixed token connection created successfully"
 *                 connection:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "conn_123"
 *                     page_id:
 *                       type: string
 *                       example: "page_123"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/instagram/fixed-token",
    authenticateToken,
    WebhookController.createFixedTokenConnection
);

module.exports = router;
