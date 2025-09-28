"use strict";

const ContextSearchService = require("./contextSearchService");
const ConfidenceScoringService = require("./confidenceScoringService");
const SecurityGuardrailsService = require("./securityGuardrailsService");
const AIResponseService = require("./aiResponseService");
const {
    TestSession,
    TestMessage,
    UnansweredQuestion,
    Business,
} = require("../models");
const { createChildLogger } = require("../config/logger");
const crypto = require("crypto");

const logger = createChildLogger("chatbot-testing");

/**
 * Chatbot Testing Service
 * Main orchestrator service that coordinates all testing functionality
 * Follows Single Responsibility Principle - orchestrates testing workflow
 */
class ChatbotTestingService {
    constructor() {
        this.contextSearchService = new ContextSearchService();
        this.confidenceScoringService = new ConfidenceScoringService();
        this.securityGuardrailsService = new SecurityGuardrailsService();
        this.aiResponseService = new AIResponseService();
    }

    /**
     * Process a chat message in a test session
     * @param {Object} params - Message processing parameters
     * @param {string} params.message - User message
     * @param {number} params.sessionId - Test session ID
     * @param {number} params.businessId - Business ID
     * @param {string} params.language - Language code
     * @param {Object} params.userContext - User context information
     * @returns {Promise<Object>} Processing result with response and metadata
     */
    async processMessage(params) {
        const {
            message,
            sessionId,
            businessId,
            language = "en",
            userContext = {},
        } = params;

        const startTime = Date.now();
        logger.info("Processing test message", {
            sessionId,
            businessId,
            messageLength: message?.length,
            language,
        });

        try {
            // 1. Validate input security
            const securityValidation =
                this.securityGuardrailsService.validateInput(message, {
                    businessId,
                    sessionId,
                    userContext,
                });

            if (!securityValidation.isSafe) {
                await this.logSecurityEvent({
                    type: "unsafe_input",
                    severity: "high",
                    input: message,
                    flags: securityValidation.flags,
                    sessionId,
                    businessId,
                });

                return {
                    success: false,
                    error: "Input contains potentially harmful content",
                    security_flags: securityValidation.flags,
                    response_time: Date.now() - startTime,
                };
            }

            // 2. Save user message to session
            const userMessage = await this.saveUserMessage({
                sessionId,
                businessId,
                content: securityValidation.sanitizedInput,
                sequenceNumber: await this.getNextSequenceNumber(sessionId),
                securityFlags: securityValidation.flags,
            });

            // 3. Search for relevant context
            const contextSearchResult =
                await this.contextSearchService.searchContexts({
                    query: securityValidation.sanitizedInput,
                    businessId,
                    language,
                    threshold: 0.6,
                    limit: 5,
                });

            // 4. Calculate confidence score
            const confidenceResult =
                await this.confidenceScoringService.calculateConfidence({
                    question: securityValidation.sanitizedInput,
                    response: "", // Will be generated
                    contextSources: contextSearchResult.results,
                    semanticScore:
                        contextSearchResult.results[0]?.similarity_score || 0,
                    businessConfig: await this.getBusinessConfig(businessId),
                });

            // 5. Generate AI response
            const aiResponse = await this.aiResponseService.generateResponse({
                question: securityValidation.sanitizedInput,
                contextSources: contextSearchResult.results,
                confidenceScore: confidenceResult.confidence_score,
                isConfident: confidenceResult.is_confident,
                businessInfo: await this.getBusinessInfo(businessId),
                language,
            });

            // 6. Validate AI response security
            const responseValidation =
                this.securityGuardrailsService.validateResponse(
                    aiResponse.response
                );

            if (!responseValidation.isSafe) {
                await this.logSecurityEvent({
                    type: "unsafe_response",
                    severity: "high",
                    response: aiResponse.response,
                    flags: responseValidation.flags,
                    sessionId,
                    businessId,
                });

                // Use sanitized response
                aiResponse.response = responseValidation.sanitizedResponse;
            }

            // 7. Save assistant response
            const assistantMessage = await this.saveAssistantMessage({
                sessionId,
                businessId,
                content: aiResponse.response,
                confidenceScore: confidenceResult.confidence_score,
                isAnswered: confidenceResult.is_confident,
                contextSources: contextSearchResult.results,
                responseTime: aiResponse.response_time,
                sequenceNumber: await this.getNextSequenceNumber(sessionId),
                securityFlags: responseValidation.flags,
            });

            // 8. Handle unanswered questions
            if (!confidenceResult.is_confident) {
                await this.handleUnansweredQuestion({
                    question: securityValidation.sanitizedInput,
                    businessId,
                    sessionId,
                    contextSources: contextSearchResult.results,
                    confidenceScore: confidenceResult.confidence_score,
                    conversationContext: await this.getConversationContext(
                        sessionId
                    ),
                });
            }

            // 9. Update search hit counts
            await this.updateSearchHits(contextSearchResult.results);

            // 10. Update session statistics
            await this.updateSessionStats(sessionId, {
                isAnswered: confidenceResult.is_confident,
                responseTime: aiResponse.response_time,
                confidenceScore: confidenceResult.confidence_score,
            });

            const totalResponseTime = Date.now() - startTime;

            logger.info("Message processing completed", {
                sessionId,
                businessId,
                totalResponseTime,
                confidenceScore: confidenceResult.confidence_score,
                isAnswered: confidenceResult.is_confident,
                contextSourcesUsed: contextSearchResult.results.length,
            });

            return {
                success: true,
                response: aiResponse.response,
                confidence_score: confidenceResult.confidence_score,
                is_answered: confidenceResult.is_confident,
                response_time: totalResponseTime,
                context_sources: contextSearchResult.results,
                security_validation: {
                    input_safe: securityValidation.isSafe,
                    response_safe: responseValidation.isSafe,
                    input_flags: securityValidation.flags,
                    response_flags: responseValidation.flags,
                },
                metadata: {
                    session_id: sessionId,
                    business_id: businessId,
                    language,
                    message_id: assistantMessage.id,
                    context_search_time: contextSearchResult.metadata,
                },
            };
        } catch (error) {
            logger.error("Message processing failed", {
                error: error.message,
                stack: error.stack,
                sessionId,
                businessId,
                message: message?.substring(0, 100),
            });

            // Save error message
            await this.saveErrorMessage({
                sessionId,
                businessId,
                error: error.message,
                sequenceNumber: await this.getNextSequenceNumber(sessionId),
            });

            return {
                success: false,
                error: "Failed to process message",
                error_details: error.message,
                error_type: error.constructor.name,
                response_time: Date.now() - startTime,
            };
        }
    }

    /**
     * Create a new test session
     * @param {Object} params - Session creation parameters
     * @param {number} params.businessId - Business ID
     * @param {string} params.sessionName - Session name
     * @param {string} params.scenarioType - Scenario type
     * @param {Object} params.metadata - Additional metadata
     * @returns {Promise<Object>} Created session
     */
    async createTestSession(params) {
        const {
            businessId,
            sessionName,
            scenarioType = "manual",
            metadata = {},
        } = params;

        logger.info("Creating test session", {
            businessId,
            sessionName,
            scenarioType,
        });

        try {
            const session = await TestSession.create({
                business_id: businessId,
                session_name: sessionName,
                scenario_type: scenarioType,
                status: "active",
                started_at: new Date(),
                metadata,
            });

            logger.info("Test session created", {
                sessionId: session.id,
                businessId,
            });

            return {
                success: true,
                session: {
                    id: session.id,
                    business_id: session.business_id,
                    session_name: session.session_name,
                    scenario_type: session.scenario_type,
                    status: session.status,
                    started_at: session.started_at,
                    metadata: session.metadata,
                },
            };
        } catch (error) {
            logger.error("Failed to create test session", {
                error: error.message,
                businessId,
            });
            throw error;
        }
    }

    /**
     * Get session statistics
     * @param {number} sessionId - Session ID
     * @returns {Promise<Object>} Session statistics
     */
    async getSessionStats(sessionId) {
        try {
            const session = await TestSession.findByPk(sessionId);
            if (!session) {
                throw new Error("Session not found");
            }

            const messages = await TestMessage.findAll({
                where: { session_id: sessionId },
                order: [["sequence_number", "ASC"]],
            });

            return {
                session: {
                    id: session.id,
                    business_id: session.business_id,
                    session_name: session.session_name,
                    scenario_type: session.scenario_type,
                    status: session.status,
                    started_at: session.started_at,
                    completed_at: session.completed_at,
                },
                statistics: {
                    message_count: session.message_count,
                    answered_count: session.answered_count,
                    unanswered_count: session.unanswered_count,
                    average_confidence: session.average_confidence,
                    average_response_time: session.average_response_time,
                },
                messages: messages.map((msg) => ({
                    id: msg.id,
                    type: msg.message_type,
                    content: msg.content,
                    confidence_score: msg.confidence_score,
                    is_answered: msg.is_answered,
                    response_time: msg.response_time,
                    sequence_number: msg.sequence_number,
                    created_at: msg.created_at,
                })),
            };
        } catch (error) {
            logger.error("Failed to get session stats", {
                error: error.message,
                sessionId,
            });
            throw error;
        }
    }

    /**
     * Save user message to session
     * @param {Object} params - Message parameters
     * @returns {Promise<Object>} Saved message
     */
    async saveUserMessage(params) {
        const {
            sessionId,
            businessId,
            content,
            sequenceNumber,
            securityFlags,
        } = params;

        return await TestMessage.create({
            session_id: sessionId,
            business_id: businessId,
            message_type: "user",
            content,
            sequence_number: sequenceNumber,
            security_flags: securityFlags,
        });
    }

    /**
     * Save assistant message to session
     * @param {Object} params - Message parameters
     * @returns {Promise<Object>} Saved message
     */
    async saveAssistantMessage(params) {
        const {
            sessionId,
            businessId,
            content,
            confidenceScore,
            isAnswered,
            contextSources,
            responseTime,
            sequenceNumber,
            securityFlags,
        } = params;

        return await TestMessage.create({
            session_id: sessionId,
            business_id: businessId,
            message_type: "assistant",
            content,
            confidence_score: confidenceScore,
            is_answered: isAnswered,
            context_sources: contextSources,
            response_time: responseTime,
            sequence_number: sequenceNumber,
            security_flags: securityFlags,
        });
    }

    /**
     * Save error message to session
     * @param {Object} params - Error parameters
     * @returns {Promise<Object>} Saved message
     */
    async saveErrorMessage(params) {
        const { sessionId, businessId, error, sequenceNumber } = params;

        return await TestMessage.create({
            session_id: sessionId,
            business_id: businessId,
            message_type: "system",
            content: `Error: ${error}`,
            sequence_number: sequenceNumber,
            security_flags: { error: true },
        });
    }

    /**
     * Handle unanswered question tracking
     * @param {Object} params - Unanswered question parameters
     */
    async handleUnansweredQuestion(params) {
        const {
            question,
            businessId,
            sessionId,
            contextSources,
            confidenceScore,
            conversationContext,
        } = params;

        let questionHash;
        try {
            const normalizedQuestion = this.normalizeQuestion(question);
            questionHash = crypto
                .createHash("sha256")
                .update(normalizedQuestion)
                .digest("hex");

            // Check if question already exists
            let unansweredQuestion = await UnansweredQuestion.findOne({
                where: {
                    business_id: businessId,
                    question_hash: questionHash,
                },
                attributes: [
                    "id",
                    "business_id",
                    "question_text",
                    "normalized_question",
                    "question_hash",
                    "frequency",
                    "first_asked_at",
                    "last_asked_at",
                    "status",
                    "resolution_notes",
                    "resolved_at",
                    "resolved_by",
                    "context_sources_searched",
                    "template_sources_searched",
                    "conversation_context",
                    "confidence_scores",
                    "average_confidence",
                    "language_code",
                    "source_sessions",
                    "priority",
                    "tags",
                    "metadata",
                    "created_at",
                    "updated_at",
                ],
            });

            if (unansweredQuestion) {
                // Update existing question
                await unansweredQuestion.update({
                    frequency: unansweredQuestion.frequency + 1,
                    last_asked_at: new Date(),
                    confidence_scores: [
                        ...unansweredQuestion.confidence_scores,
                        confidenceScore,
                    ],
                    average_confidence: this.calculateAverageConfidence([
                        ...unansweredQuestion.confidence_scores,
                        confidenceScore,
                    ]),
                    source_sessions: [
                        ...new Set([
                            ...unansweredQuestion.source_sessions,
                            sessionId,
                        ]),
                    ],
                });
            } else {
                // Create new unanswered question
                await UnansweredQuestion.create(
                    {
                        business_id: businessId,
                        question_text: question,
                        normalized_question: normalizedQuestion,
                        question_hash: questionHash,
                        frequency: 1,
                        first_asked_at: new Date(),
                        last_asked_at: new Date(),
                        status: "unanswered",
                        context_sources_searched: contextSources.map((s) => ({
                            id: s.id,
                            type: s.type,
                            similarity_score: s.similarity_score,
                        })),
                        confidence_scores: [confidenceScore],
                        average_confidence: confidenceScore,
                        source_sessions: [sessionId],
                        conversation_context: conversationContext,
                        language_code: "en",
                    },
                    {
                        returning: false, // Don't return the created record
                    }
                );
            }

            logger.info("Unanswered question tracked", {
                businessId,
                sessionId,
                questionHash,
                confidenceScore,
            });
        } catch (error) {
            logger.error("Failed to track unanswered question", {
                error: error.message,
                errorType: error.constructor.name,
                errorCode: error.code,
                stack: error.stack,
                businessId,
                sessionId,
                questionHash: questionHash || "undefined",
                confidenceScore,
            });
            logger.error(error.message);
        }
    }

    /**
     * Normalize question for deduplication
     * @param {string} question - Original question
     * @returns {string} Normalized question
     */
    normalizeQuestion(question) {
        return question
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Calculate average confidence from scores
     * @param {Array} scores - Confidence scores
     * @returns {number} Average confidence
     */
    calculateAverageConfidence(scores) {
        if (scores.length === 0) return 0;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    /**
     * Get next sequence number for session
     * @param {number} sessionId - Session ID
     * @returns {Promise<number>} Next sequence number
     */
    async getNextSequenceNumber(sessionId) {
        const lastMessage = await TestMessage.findOne({
            where: { session_id: sessionId },
            order: [["sequence_number", "DESC"]],
        });

        return lastMessage ? lastMessage.sequence_number + 1 : 1;
    }

    /**
     * Get business configuration
     * @param {number} businessId - Business ID
     * @returns {Promise<Object>} Business configuration
     */
    async getBusinessConfig(businessId) {
        // In production, this would fetch from business settings
        return {
            confidenceThreshold: 0.7,
            maxResponseTime: 5000,
            enableSecurityValidation: true,
        };
    }

    /**
     * Get business information
     * @param {number} businessId - Business ID
     * @returns {Promise<Object>} Business information
     */
    async getBusinessInfo(businessId) {
        const business = await Business.findByPk(businessId);
        return business
            ? {
                  id: business.id,
                  company_name: business.company_name,
                  business_type: business.business_type,
              }
            : {};
    }

    /**
     * Get conversation context for session
     * @param {number} sessionId - Session ID
     * @returns {Promise<Object>} Conversation context
     */
    async getConversationContext(sessionId) {
        const messages = await TestMessage.findAll({
            where: { session_id: sessionId },
            order: [["sequence_number", "DESC"]],
            limit: 5,
        });

        return {
            recent_messages: messages.map((msg) => ({
                type: msg.message_type,
                content: msg.content.substring(0, 100),
                sequence_number: msg.sequence_number,
            })),
            message_count: messages.length,
        };
    }

    /**
     * Update search hit counts
     * @param {Array} contextSources - Context sources used
     */
    async updateSearchHits(contextSources) {
        const templateIds = contextSources
            .filter((s) => s.type === "template")
            .map((s) => s.id);
        const contextIds = contextSources
            .filter((s) => s.type === "context")
            .map((s) => s.id);
        const faqIds = contextSources
            .filter((s) => s.type === "faq")
            .map((s) => s.id);

        await Promise.all([
            this.contextSearchService.updateSearchHits(templateIds, "template"),
            this.contextSearchService.updateSearchHits(contextIds, "context"),
            this.contextSearchService.updateSearchHits(faqIds, "faq"),
        ]);
    }

    /**
     * Update session statistics
     * @param {number} sessionId - Session ID
     * @param {Object} stats - Statistics to update
     */
    async updateSessionStats(sessionId, stats) {
        const session = await TestSession.findByPk(sessionId);
        if (!session) return;

        const updates = {
            message_count: session.message_count + 1,
        };

        if (stats.isAnswered) {
            updates.answered_count = session.answered_count + 1;
        } else {
            updates.unanswered_count = session.unanswered_count + 1;
        }

        updates.total_response_time =
            session.total_response_time + stats.responseTime;
        updates.average_response_time = Math.round(
            updates.total_response_time / updates.message_count
        );

        if (stats.confidenceScore !== undefined) {
            const currentAvg = session.average_confidence || 0;
            const totalAnswered = updates.answered_count;
            updates.average_confidence =
                Math.round(
                    ((currentAvg * (totalAnswered - 1) +
                        stats.confidenceScore) /
                        totalAnswered) *
                        100
                ) / 100;
        }

        await session.update(updates);
    }

    /**
     * Log security event
     * @param {Object} event - Security event
     */
    async logSecurityEvent(event) {
        this.securityGuardrailsService.logSecurityEvent(event);
    }
}

module.exports = ChatbotTestingService;
