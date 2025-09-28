"use strict";

const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("security-guardrails");

/**
 * Security Guardrails Service
 * Handles prompt injection detection and content filtering
 * Follows Single Responsibility Principle - only handles security validation
 */
class SecurityGuardrailsService {
    constructor() {
        this.injectionPatterns = [
            // Direct prompt injection attempts
            /ignore\s+(?:previous|all)\s+(?:instructions?|prompts?)/i,
            /ignore\s+all\s+previous\s+instructions/i,
            /forget\s+(?:everything|all)\s+(?:previous|prior)/i,
            /forget\s+everything/i,
            /you\s+are\s+now\s+(?:a\s+)?(?:different|new)/i,
            /pretend\s+to\s+be/i,
            /act\s+as\s+if/i,
            /roleplay\s+as/i,
            /system\s*:\s*/i,
            /assistant\s*:\s*/i,
            /user\s*:\s*/i,

            // Instruction override attempts
            /new\s+(?:instructions?|rules?|prompts?)/i,
            /override\s+(?:previous|current)/i,
            /disregard\s+(?:previous|all)/i,
            /ignore\s+(?:the\s+)?(?:above|previous)/i,

            // System information requests
            /what\s+(?:are\s+)?(?:your\s+)?(?:instructions?|prompts?)/i,
            /show\s+(?:me\s+)?(?:your\s+)?(?:instructions?|prompts?)/i,
            /reveal\s+(?:your\s+)?(?:instructions?|prompts?)/i,
            /tell\s+me\s+(?:your\s+)?(?:instructions?|prompts?)/i,

            // Jailbreak attempts
            /jailbreak/i,
            /developer\s+mode/i,
            /admin\s+mode/i,
            /debug\s+mode/i,
            /bypass\s+(?:security|filters?)/i,
        ];

        this.suspiciousPatterns = [
            // Attempts to extract system information
            /what\s+(?:is\s+)?(?:the\s+)?(?:backend|server|database|api)/i,
            /how\s+(?:does\s+)?(?:the\s+)?(?:system|backend|server)/i,
            /explain\s+(?:the\s+)?(?:system|backend|server)/i,

            // Code injection attempts
            /<script/i,
            /javascript:/i,
            /eval\s*\(/i,
            /function\s*\(/i,
            /\.exec\s*\(/i,

            // SQL injection patterns
            /union\s+select/i,
            /drop\s+table/i,
            /delete\s+from/i,
            /insert\s+into/i,
            /update\s+set/i,
            /select\s+\*\s+from/i,
        ];

        this.businessContextKeywords = [
            "service",
            "services",
            "product",
            "products",
            "company",
            "business",
            "customer",
            "customers",
            "client",
            "clients",
            "price",
            "prices",
            "cost",
            "costs",
            "fee",
            "fees",
            "payment",
            "payments",
            "order",
            "orders",
            "purchase",
            "purchases",
            "buy",
            "buying",
            "support",
            "help",
            "assistance",
            "contact",
            "phone",
            "email",
            "hours",
            "time",
            "schedule",
            "appointment",
            "appointments",
            "booking",
            "bookings",
            "reservation",
            "reservations",
            "location",
            "address",
            "directions",
            "map",
            "store",
            "office",
            "about",
            "team",
            "staff",
            "employee",
            "employees",
            "founder",
            "owner",
            "policy",
            "policies",
            "terms",
            "conditions",
            "refund",
            "refunds",
            "return",
            "returns",
            "warranty",
            "warranties",
        ];
    }

    /**
     * Validate user input for security threats
     * @param {string} input - User input to validate
     * @param {Object} context - Additional context for validation
     * @returns {Object} Validation result with flags and warnings
     */
    validateInput(input, context = {}) {
        if (!input || typeof input !== "string") {
            return {
                isSafe: true,
                flags: [],
                warnings: [],
                sanitizedInput: input,
            };
        }

        const flags = [];
        const warnings = [];
        let sanitizedInput = input;

        // Check for prompt injection patterns
        const injectionDetected = this.detectPromptInjection(input);
        if (injectionDetected.detected) {
            flags.push({
                type: "prompt_injection",
                severity: "high",
                pattern: injectionDetected.pattern,
                message: "Potential prompt injection attempt detected",
            });
        }

        // Check for suspicious patterns
        const suspiciousDetected = this.detectSuspiciousPatterns(input);
        if (suspiciousDetected.detected) {
            flags.push({
                type: "suspicious_pattern",
                severity: "medium",
                pattern: suspiciousDetected.pattern,
                message: "Suspicious pattern detected",
            });
        }

        // Check business context relevance - only warn for very low relevance
        const contextRelevance = this.checkBusinessContextRelevance(input);
        if (contextRelevance.score < 0.1) {
            warnings.push({
                type: "low_relevance",
                severity: "low",
                score: contextRelevance.score,
                message: "Input may not be relevant to business context",
            });
        }

        // Sanitize input if needed
        if (flags.length > 0) {
            sanitizedInput = this.sanitizeInput(input);
        }

        const isSafe = flags.length === 0;

        logger.info("Input validation completed", {
            inputLength: input.length,
            isSafe,
            flagsCount: flags.length,
            warningsCount: warnings.length,
            hasInjection: injectionDetected.detected,
            hasSuspicious: suspiciousDetected.detected,
            contextRelevance: contextRelevance.score,
        });

        return {
            isSafe,
            flags,
            warnings,
            sanitizedInput,
            metadata: {
                originalLength: input.length,
                sanitizedLength: sanitizedInput.length,
                contextRelevance: contextRelevance.score,
            },
        };
    }

    /**
     * Detect prompt injection patterns
     * @param {string} input - Input to check
     * @returns {Object} Detection result
     */
    detectPromptInjection(input) {
        for (const pattern of this.injectionPatterns) {
            if (pattern.test(input)) {
                return {
                    detected: true,
                    pattern: pattern.source,
                    match: input.match(pattern)?.[0],
                };
            }
        }
        return { detected: false };
    }

    /**
     * Detect suspicious patterns
     * @param {string} input - Input to check
     * @returns {Object} Detection result
     */
    detectSuspiciousPatterns(input) {
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(input)) {
                return {
                    detected: true,
                    pattern: pattern.source,
                    match: input.match(pattern)?.[0],
                };
            }
        }
        return { detected: false };
    }

    /**
     * Check if input is relevant to business context
     * @param {string} input - Input to check
     * @returns {Object} Relevance analysis
     */
    checkBusinessContextRelevance(input) {
        if (!input || input.trim() === "") {
            return {
                score: 0,
                relevantWords: [],
                totalWords: 0,
            };
        }

        const inputWords = input.toLowerCase().split(/\s+/);
        const relevantWords = inputWords
            .filter((word) => {
                // Remove punctuation for matching
                const cleanWord = word.replace(/[^\w]/g, "");
                return this.businessContextKeywords.some(
                    (keyword) =>
                        cleanWord === keyword ||
                        (cleanWord.length >= 3 &&
                            keyword.length >= 3 &&
                            (cleanWord.includes(keyword) ||
                                keyword.includes(cleanWord)))
                );
            })
            .map((word) => word.replace(/[^\w]/g, "")); // Return clean words

        // Calculate base relevance score
        let relevanceScore = relevantWords.length / inputWords.length;

        // Only boost score if we have multiple business keywords
        if (relevantWords.length >= 2) {
            relevanceScore = Math.min(1, relevanceScore + 0.2);
        }

        return {
            score: relevanceScore,
            relevantWords,
            totalWords: inputWords.length,
        };
    }

    /**
     * Sanitize input by removing or replacing dangerous content
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        let sanitized = input;

        // Remove or replace injection patterns
        for (const pattern of this.injectionPatterns) {
            sanitized = sanitized.replace(pattern, "[FILTERED]");
        }

        // Remove suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            sanitized = sanitized.replace(pattern, "[FILTERED]");
        }

        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, " ").trim();

        return sanitized;
    }

    /**
     * Validate AI response for security issues
     * @param {string} response - AI response to validate
     * @returns {Object} Validation result
     */
    validateResponse(response) {
        if (!response || typeof response !== "string") {
            return {
                isSafe: true,
                flags: [],
                warnings: [],
                sanitizedResponse: response,
            };
        }

        const flags = [];
        const warnings = [];

        // Check for system information leakage
        if (this.detectSystemInfoLeakage(response)) {
            flags.push({
                type: "system_info_leak",
                severity: "high",
                message: "Response may contain system information",
            });
        }

        // Check for inappropriate content
        if (this.detectInappropriateContent(response)) {
            flags.push({
                type: "inappropriate_content",
                severity: "medium",
                message: "Response may contain inappropriate content",
            });
        }

        // Check for off-topic responses
        if (this.detectOffTopicResponse(response)) {
            warnings.push({
                type: "off_topic",
                severity: "low",
                message: "Response may be off-topic",
            });
        }

        const isSafe = flags.length === 0;
        const sanitizedResponse = isSafe
            ? response
            : this.sanitizeResponse(response);

        return {
            isSafe,
            flags,
            warnings,
            sanitizedResponse,
        };
    }

    /**
     * Detect system information leakage in response
     * @param {string} response - Response to check
     * @returns {boolean} True if system info detected
     */
    detectSystemInfoLeakage(response) {
        const systemInfoPatterns = [
            /my\s+(?:instructions?|prompts?)/i,
            /i\s+(?:am\s+)?(?:an\s+)?ai/i,
            /i\s+(?:am\s+)?(?:a\s+)?(?:chatbot|bot)/i,
            /backend|server|database|api/i,
            /system\s+(?:prompt|instruction)/i,
        ];

        return systemInfoPatterns.some((pattern) => pattern.test(response));
    }

    /**
     * Detect inappropriate content
     * @param {string} response - Response to check
     * @returns {boolean} True if inappropriate content detected
     */
    detectInappropriateContent(response) {
        // Basic inappropriate content detection
        // In production, use more sophisticated content filtering
        const inappropriatePatterns = [
            /hate|racist|discriminat/i,
            /violence|harm|hurt/i,
            /illegal|crime|criminal/i,
            /inappropriate|offensive/i,
        ];

        return inappropriatePatterns.some((pattern) => pattern.test(response));
    }

    /**
     * Detect off-topic responses
     * @param {string} response - Response to check
     * @returns {boolean} True if response is off-topic
     */
    detectOffTopicResponse(response) {
        const businessRelevance = this.checkBusinessContextRelevance(response);
        return businessRelevance.score < 0.1;
    }

    /**
     * Sanitize AI response
     * @param {string} response - Response to sanitize
     * @returns {string} Sanitized response
     */
    sanitizeResponse(response) {
        let sanitized = response;

        // Replace system information with generic responses
        sanitized = sanitized.replace(
            /my\s+(?:instructions?|prompts?)/gi,
            "my purpose"
        );
        sanitized = sanitized.replace(
            /i\s+(?:am\s+)?(?:an\s+)?ai/gi,
            "I'm here to help"
        );
        sanitized = sanitized.replace(
            /backend|server|database|api/gi,
            "system"
        );

        return sanitized;
    }

    /**
     * Log security event
     * @param {Object} event - Security event details
     */
    logSecurityEvent(event) {
        logger.warn("Security event detected", {
            type: event.type,
            severity: event.severity,
            input: event.input?.substring(0, 100),
            response: event.response?.substring(0, 100),
            flags: event.flags,
            warnings: event.warnings,
            userId: event.userId,
            sessionId: event.sessionId,
            timestamp: new Date().toISOString(),
        });
    }
}

module.exports = SecurityGuardrailsService;
