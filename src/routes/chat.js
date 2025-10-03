"use strict";

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { createChildLogger } = require("../config/logger");
const ContextSearchService = require("../services/contextSearchService");
const AIResponseService = require("../services/aiResponseService");
const { Business } = require("../models");

const logger = createChildLogger("chat-routes");

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [user, bot]
 *           description: Type of message sender
 *         content:
 *           type: string
 *           description: Message content
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Message timestamp
 *
 *     BusinessContext:
 *       type: object
 *       properties:
 *         about:
 *           type: string
 *           description: Business description
 *         services:
 *           type: string
 *           description: Services offered
 *         policies:
 *           type: string
 *           description: Business policies
 *         process:
 *           type: string
 *           description: Business process
 *         uniqueValue:
 *           type: string
 *           description: Unique value proposition
 *         freeForm:
 *           type: string
 *           description: Additional business information
 *
 *     ChatRequest:
 *       type: object
 *       required:
 *         - userMessage
 *       properties:
 *         initialBotMessage:
 *           type: string
 *           description: Initial bot message for context
 *         businessContext:
 *           $ref: '#/components/schemas/BusinessContext'
 *         conversationHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *           description: Previous conversation messages
 *         userMessage:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Current user message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current message timestamp
 *
 *     ChatResponse:
 *       type: object
 *       properties:
 *         response:
 *           type: string
 *           description: Bot response message
 *         confidence:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Confidence score (0-1)
 *         sources:
 *           type: array
 *           items:
 *             type: string
 *           description: Source information used for response
 *         responseTime:
 *           type: number
 *           description: Response generation time in milliseconds
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     description: Send a message to the AI assistant and receive a response based on business context
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Validation middleware
const validateChatRequest = [
    body("userMessage")
        .isString()
        .isLength({ min: 1, max: 1000 })
        .withMessage("User message must be between 1 and 1000 characters"),
    body("businessContext")
        .optional()
        .isObject()
        .withMessage("Business context must be an object"),
    body("conversationHistory")
        .optional()
        .isArray()
        .withMessage("Conversation history must be an array"),
    body("conversationHistory.*.type")
        .optional()
        .isIn(["user", "bot"])
        .withMessage("Message type must be 'user' or 'bot'"),
    body("conversationHistory.*.content")
        .optional()
        .isString()
        .withMessage("Message content must be a string"),
];

// Simple test route
router.get("/", (req, res) => {
    res.json({
        message: "Chat endpoint is working!",
        timestamp: new Date().toISOString(),
    });
});

router.post("/", validateChatRequest, async (req, res) => {
    const startTime = Date.now();

    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: "Validation failed",
                details: errors.array(),
            });
        }

        const {
            userMessage,
            businessContext = {},
            conversationHistory = [],
            initialBotMessage,
            timestamp,
        } = req.body;

        logger.info("Processing chat request", {
            userMessageLength: userMessage.length,
            conversationHistoryLength: conversationHistory.length,
            hasBusinessContext: !!businessContext,
        });

        // Initialize services
        const contextSearchService = new ContextSearchService();
        const aiResponseService = new AIResponseService();

        // For demo purposes, use a default business ID if none provided
        // In production, you'd get this from authentication or request
        const businessId = 1; // Default demo business

        // Search for relevant context (this will return empty for demo businesses)
        const contextSearchResult = await contextSearchService.searchContexts({
            query: userMessage,
            businessId,
            language: "en",
            threshold: 0.1,
            limit: 10,
        });

        logger.info("Context search completed", {
            contextSourcesFound: contextSearchResult.results.length,
            totalResults: contextSearchResult.metadata.totalResults,
        });

        // Build context from business context and conversation history
        const context = buildContextFromBusinessInfo(
            businessContext,
            conversationHistory,
            initialBotMessage,
            userMessage
        );

        // Generate AI response using business context
        const aiResponse = await aiResponseService.generateResponse({
            question: userMessage,
            contextSources: contextSearchResult.results,
            confidenceScore: calculateConfidenceScore(
                contextSearchResult.results,
                businessContext
            ),
            isConfident:
                contextSearchResult.results.length > 0 ||
                Object.keys(businessContext).length > 0,
            businessInfo: {
                id: businessId,
                company_name: "Digital Marketing Agency",
                business_type: "Digital Marketing",
            },
            language: "en",
        });

        // If we have business context, use it to generate a more relevant response
        let response = aiResponse.response;
        if (Object.keys(businessContext).length > 0) {
            try {
                // Generate response using business context directly
                response = await aiResponseService.callOpenAI(
                    userMessage,
                    context,
                    "en"
                );
            } catch (error) {
                logger.warn(
                    "Failed to generate response with business context, using default",
                    {
                        error: error.message,
                    }
                );
            }
        }

        const responseTime = Date.now() - startTime;

        // Extract sources for response
        const sources = contextSearchResult.results.map(
            (source) => source.section_name || `FAQ #${source.id}`
        );

        // Add business context sources
        if (Object.keys(businessContext).length > 0) {
            sources.push("Business Information");
        }

        logger.info("Chat response generated", {
            responseLength: response.length,
            confidence: aiResponse.confidence_score,
            responseTime,
            sourcesUsed: sources.length,
        });

        // Return response
        res.status(200).json({
            response: response,
            confidence: aiResponse.confidence_score,
            sources: sources,
            responseTime,
        });
    } catch (error) {
        const responseTime = Date.now() - startTime;

        logger.error("Chat request failed", {
            error: error.message,
            stack: error.stack,
            responseTime,
        });

        // Return error response
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to process chat request. Please try again.",
        });
    }
});

/**
 * Build context from business information and conversation history
 * @param {Object} businessContext - Business context information
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} initialBotMessage - Initial bot message
 * @param {string} userMessage - Current user message
 * @returns {string} Formatted context
 */
function buildContextFromBusinessInfo(
    businessContext,
    conversationHistory,
    initialBotMessage,
    userMessage
) {
    let context = "Business Information:\n\n";

    // Add business context sections
    if (businessContext.about) {
        context += `About: ${businessContext.about}\n\n`;
    }
    if (businessContext.services) {
        context += `Services: ${businessContext.services}\n\n`;
    }
    if (businessContext.policies) {
        context += `Policies: ${businessContext.policies}\n\n`;
    }
    if (businessContext.process) {
        context += `Process: ${businessContext.process}\n\n`;
    }
    if (businessContext.uniqueValue) {
        context += `Unique Value: ${businessContext.uniqueValue}\n\n`;
    }
    if (businessContext.freeForm) {
        context += `Additional Information: ${businessContext.freeForm}\n\n`;
    }

    if (initialBotMessage) {
        context += `Initial Bot Message: ${initialBotMessage}\n\n`;
    }

    if (conversationHistory.length > 0) {
        context += "Conversation History:\n";
        conversationHistory.forEach((msg, index) => {
            const sender = msg.type === "bot" ? "Assistant" : "Customer";
            context += `${index + 1}. ${sender}: ${msg.content}\n`;
        });
        context += "\n";
    }

    context += `Current Customer Message: ${userMessage}`;

    return context;
}

/**
 * Calculate confidence score based on context sources and business context
 * @param {Array} contextSources - Context sources found
 * @param {Object} businessContext - Business context information
 * @returns {number} Confidence score between 0 and 1
 */
function calculateConfidenceScore(contextSources, businessContext) {
    let confidence = 0.2; // Base confidence

    if (contextSources.length > 0) {
        // Calculate average similarity score
        const avgSimilarity =
            contextSources.reduce(
                (sum, source) => sum + (source.similarity_score || 0),
                0
            ) / contextSources.length;

        // Boost confidence if we have multiple sources
        const sourceBonus = Math.min(contextSources.length * 0.1, 0.3);
        confidence = Math.min(avgSimilarity + sourceBonus, 1.0);
    } else if (Object.keys(businessContext).length > 0) {
        // If we have business context but no FAQ matches, still provide decent confidence
        confidence = 0.7;
    }

    return confidence;
}

module.exports = router;
