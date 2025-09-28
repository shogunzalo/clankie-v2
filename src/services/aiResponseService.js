"use strict";

const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("ai-response");

/**
 * AI Response Generation Service
 * Handles AI response generation with context integration
 * Follows Single Responsibility Principle - only handles AI response generation
 */
class AIResponseService {
    constructor() {
        this.defaultSystemPrompt = `You are a helpful customer service assistant for a business. 
Your role is to provide accurate, helpful, and professional responses to customer questions based on the business context provided.

Guidelines:
- Always base your responses on the provided business context
- Be helpful, professional, and friendly
- If you don't have enough information to answer confidently, say so
- Stay focused on business-related topics
- Don't reveal any system information or internal processes
- Keep responses concise but complete

If the confidence in your response is low, politely explain that you need more information to provide a complete answer.`;
    }

    /**
     * Generate AI response with context integration
     * @param {Object} params - Response generation parameters
     * @param {string} params.question - User question
     * @param {Array} params.contextSources - Context sources found
     * @param {number} params.confidenceScore - Confidence score
     * @param {boolean} params.isConfident - Whether response is confident
     * @param {Object} params.businessInfo - Business information
     * @param {string} params.language - Language code
     * @returns {Promise<Object>} Generated response with metadata
     */
    async generateResponse(params) {
        const {
            question,
            contextSources = [],
            confidenceScore = 0,
            isConfident = false,
            businessInfo = {},
            language = "en",
        } = params;

        logger.info("Generating AI response", {
            questionLength: question?.length,
            contextSourcesCount: contextSources.length,
            confidenceScore,
            isConfident,
            language,
        });

        try {
            const startTime = Date.now();

            // Build context for the AI
            const context = this.buildContext(contextSources, businessInfo);

            // Generate response based on confidence
            const response = isConfident
                ? await this.generateConfidentResponse(
                      question,
                      context,
                      language
                  )
                : await this.generateUnconfidentResponse(
                      question,
                      context,
                      language
                  );

            const responseTime = Date.now() - startTime;

            const result = {
                response: response.text,
                confidence_score: confidenceScore,
                is_confident: isConfident,
                response_time: responseTime,
                context_sources_used: contextSources.map((source) => ({
                    id: source.id,
                    type: source.type,
                    section_name: source.section_name,
                    similarity_score: source.similarity_score,
                })),
                metadata: {
                    language,
                    business_id: businessInfo.id,
                    context_sources_count: contextSources.length,
                    response_length: response.text.length,
                    word_count: response.text.split(/\s+/).length,
                    method: response.method,
                },
            };

            logger.info("AI response generated", {
                responseLength: result.response.length,
                responseTime,
                confidenceScore,
                contextSourcesUsed: result.context_sources_used.length,
            });

            return result;
        } catch (error) {
            logger.error("AI response generation failed", {
                error: error.message,
                stack: error.stack,
                question: question?.substring(0, 100),
            });
            throw error;
        }
    }

    /**
     * Build context string from sources
     * @param {Array} contextSources - Context sources
     * @param {Object} businessInfo - Business information
     * @returns {string} Formatted context
     */
    buildContext(contextSources, businessInfo) {
        let context = `Business: ${
            businessInfo.company_name || "Unknown Business"
        }\n\n`;

        if (contextSources.length === 0) {
            context += "No specific context available for this question.\n";
            return context;
        }

        context += "Relevant Business Information:\n\n";

        contextSources.forEach((source, index) => {
            context += `${index + 1}. ${source.section_name}:\n`;
            context += `${source.content}\n\n`;
        });

        return context;
    }

    /**
     * Generate confident response when we have good context
     * @param {string} question - User question
     * @param {string} context - Business context
     * @param {string} language - Language code
     * @returns {Promise<Object>} Response object
     */
    async generateConfidentResponse(question, context, language) {
        // Call OpenAI API for confident responses
        try {
            const response = await this.callOpenAI(question, context, language);
            return {
                text: response,
                method: "openai_confident",
            };
        } catch (error) {
            logger.warn("OpenAI API failed, falling back to simulation", {
                error: error.message,
                question: question.substring(0, 100),
            });
            logger.error(error.message);

            // Fallback response when LLM fails
            const response = `I apologize, but I'm currently experiencing technical difficulties and cannot process your request at the moment. Please try again later or contact our support team for immediate assistance.

Your question: "${question}"

We're here to help, so please don't hesitate to reach out if you need assistance.`;

            return {
                text: response,
                method: "fallback_confident",
            };
        }
    }

    /**
     * Generate unconfident response when context is insufficient
     * @param {string} question - User question
     * @param {string} context - Business context
     * @param {string} language - Language code
     * @returns {Promise<Object>} Response object
     */
    async generateUnconfidentResponse(question, context, language) {
        console.log(
            `generateUnconfidentResponse called with question: "${question}"`
        );

        try {
            // Always use LLM for responses, but with a different system prompt for unconfident scenarios
            const response = await this.callOpenAI(question, context, language);
            return {
                text: response,
                method: "openai_unconfident",
            };
        } catch (error) {
            logger.error(
                "OpenAI API failed for unconfident response, using fallback",
                {
                    error: error.message,
                    errorType: error.constructor.name,
                    errorCode: error.code,
                    errorStatus: error.status,
                    errorDetails: error.details,
                    stack: error.stack,
                    question: question.substring(0, 100),
                    apiKey: process.env.OPENAI_API_KEY
                        ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...`
                        : "NOT_SET",
                }
            );
            logger.error(error.message);

            // Fallback response when LLM fails
            const response = `I understand you're asking about "${question}". I want to make sure I give you the most accurate information possible. 

Based on the information I currently have available, I don't have enough specific details to provide a complete answer to your question.

I'd recommend:
- Contacting our support team directly for personalized assistance
- Checking our website for the most up-to-date information
- Speaking with one of our team members who can provide more detailed guidance

Is there anything else I can help you with that I might have more information about?`;

            return {
                text: response,
                method: "fallback_unconfident",
            };
        }
    }

    /**
     * Call OpenAI API to generate response
     * @param {string} question - User question
     * @param {string} context - Business context
     * @param {string} language - Language code
     * @returns {Promise<string>} Generated response
     */
    async callOpenAI(question, context, language = "en") {
        console.log(
            `callOpenAI called with API key: ${
                process.env.OPENAI_API_KEY
                    ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...`
                    : "NOT_SET"
            }`
        );

        const OpenAI = require("openai");
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Always use the same system prompt for consistency
        const systemPrompt = this.defaultSystemPrompt;

        const messages = [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: `Context: ${context}\n\nQuestion: ${question}`,
            },
        ];

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: 0.7,
                max_tokens: 300,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            logger.error("OpenAI API call failed", {
                error: error.message,
                errorType: error.constructor.name,
                errorCode: error.code,
                errorStatus: error.status,
                errorDetails: error.details,
                stack: error.stack,
                model: "gpt-4o-mini",
                messagesCount: messages.length,
                apiKey: process.env.OPENAI_API_KEY
                    ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...`
                    : "NOT_SET",
            });
            logger.error(error.message);
            throw error;
        }
    }

    /**
     * Update system prompt
     * @param {string} newPrompt - New system prompt
     */
    updateSystemPrompt(newPrompt) {
        this.defaultSystemPrompt = newPrompt;
        logger.info("System prompt updated");
    }

    /**
     * Get current system prompt
     * @returns {string} Current system prompt
     */
    getSystemPrompt() {
        return this.defaultSystemPrompt;
    }
}

module.exports = AIResponseService;
