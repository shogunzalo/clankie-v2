"use strict";

const {
    BusinessTemplateResponse,
    BusinessContextSection,
    FaqItem,
} = require("../models");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("context-search");

/**
 * Context Search Service
 * Handles dual-context search across template responses and custom context sections
 * Follows Single Responsibility Principle - only handles context searching
 */
class ContextSearchService {
    constructor() {
        this.defaultSimilarityThreshold = 0.01;
        this.maxResults = 10;
    }

    /**
     * Search both template responses and context sections for relevant content
     * @param {Object} params - Search parameters
     * @param {string} params.query - Search query
     * @param {number} params.businessId - Business ID
     * @param {string} params.language - Language code
     * @param {number} params.threshold - Similarity threshold
     * @param {number} params.limit - Maximum results
     * @returns {Promise<Object>} Combined search results
     */
    async searchContexts(params) {
        const {
            query,
            businessId,
            language = "en",
            threshold = this.defaultSimilarityThreshold,
            limit = this.maxResults,
        } = params;

        logger.info("Starting context search", {
            businessId,
            queryLength: query?.length,
            language,
            threshold,
            limit,
        });

        try {
            // Get ALL template responses, context sections, and FAQs (no filtering)
            const [templateResults, contextResults, faqResults] =
                await Promise.all([
                    this.getAllTemplateResponses({
                        businessId,
                        language,
                    }),
                    this.getAllContextSections({
                        businessId,
                        language,
                    }),
                    this.getAllFaqItems({
                        businessId,
                        language,
                    }),
                ]);

            // Combine all results without filtering
            const combinedResults = [
                ...templateResults,
                ...contextResults,
                ...faqResults,
            ];

            logger.info("Context search completed", {
                businessId,
                templateResults: templateResults.length,
                contextResults: contextResults.length,
                faqResults: faqResults.length,
                combinedResults: combinedResults.length,
                templateResultsDetails: templateResults.map((r) => ({
                    id: r.id,
                    type: r.type,
                    section_name: r.section_name,
                    similarity: r.similarity_score,
                })),
                contextResultsDetails: contextResults.map((r) => ({
                    id: r.id,
                    type: r.type,
                    section_name: r.section_name,
                    similarity: r.similarity_score,
                })),
                faqResultsDetails: faqResults.map((r) => ({
                    id: r.id,
                    type: r.type,
                    section_name: r.section_name,
                    similarity: r.similarity_score,
                })),
            });

            return {
                results: combinedResults,
                metadata: {
                    totalResults: combinedResults.length,
                    templateResults: templateResults.length,
                    contextResults: contextResults.length,
                    faqResults: faqResults.length,
                    searchQuery: query,
                    threshold,
                    language,
                },
            };
        } catch (error) {
            logger.error("Context search failed", {
                error: error.message,
                stack: error.stack,
                businessId,
                query: query?.substring(0, 100),
            });
            throw error;
        }
    }

    /**
     * Gets all template responses for a business (no similarity filtering).
     * @param {object} options - Search options.
     * @param {number} options.businessId - The ID of the business.
     * @param {string} options.language - The language code.
     * @returns {Promise<Array<object>>} - Array of all template responses.
     */
    async getAllTemplateResponses({ businessId, language }) {
        try {
            const templateResponses = await BusinessTemplateResponse.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    completion_status: "completed",
                },
                include: [
                    {
                        model: require("../models").SectionTemplate,
                        as: "template",
                        attributes: ["section_key"],
                    },
                ],
            });

            const results = templateResponses.map((response) => {
                return {
                    id: response.id,
                    type: "template",
                    section_key: response.template?.section_key,
                    section_name: response.template?.section_key,
                    content: response.content,
                    similarity_score: 1.0, // Always include, so set high score
                    source: "template_response",
                    metadata: {
                        template_id: response.template_id,
                        character_count: response.character_count,
                        word_count: response.word_count,
                        search_hits: response.search_hits,
                    },
                };
            });

            logger.info("Retrieved all template responses", {
                businessId,
                language,
                totalResponses: templateResponses.length,
                results: results.map((r) => ({
                    id: r.id,
                    section_name: r.section_name,
                })),
            });

            return results;
        } catch (error) {
            logger.error("Failed to get template responses", {
                error: error.message,
                stack: error.stack,
                businessId,
                language,
            });
            return [];
        }
    }

    /**
     * Search template responses using semantic similarity
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Template search results
     */
    async searchTemplateResponses(params) {
        const { query, businessId, language, threshold, limit } = params;

        try {
            // For now, we'll use text-based search until embeddings are implemented
            // In production, this would use vector similarity search
            const templateResponses = await BusinessTemplateResponse.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    completion_status: "completed",
                },
                include: [
                    {
                        model: require("../models").SectionTemplate,
                        as: "template",
                        attributes: ["section_key"],
                    },
                ],
                // Remove limit to get all templates for debugging
            });

            // Calculate similarity scores (simplified for now)
            const results = templateResponses
                .map((response) => {
                    const similarity = this.calculateTextSimilarity(
                        query,
                        response.content
                    );
                    return {
                        id: response.id,
                        type: "template",
                        section_key: response.template?.section_key,
                        section_name: response.template?.section_key,
                        content: response.content,
                        similarity_score: similarity,
                        source: "template_response",
                        metadata: {
                            template_id: response.template_id,
                            character_count: response.character_count,
                            word_count: response.word_count,
                            search_hits: response.search_hits,
                        },
                    };
                })
                .filter((result) => result.similarity_score >= threshold)
                .sort((a, b) => b.similarity_score - a.similarity_score);

            console.log("Template search debug:", {
                businessId,
                query,
                threshold,
                totalResponses: templateResponses.length,
                filteredResults: results.length,
                allSimilarities: templateResponses.map((r) => ({
                    id: r.id,
                    section_key: r.template?.section_key,
                    content_preview: r.content?.substring(0, 100),
                    similarity: this.calculateTextSimilarity(query, r.content),
                })),
                results: results.map((r) => ({
                    id: r.id,
                    section_name: r.section_name,
                    similarity: r.similarity_score,
                })),
            });

            logger.info("Template search results", {
                businessId,
                query,
                threshold,
                totalResponses: templateResponses.length,
                filteredResults: results.length,
                results: results.map((r) => ({
                    id: r.id,
                    section_name: r.section_name,
                    similarity: r.similarity_score,
                })),
            });

            return results;
        } catch (error) {
            logger.error("Template search failed", {
                error: error.message,
                errorType: error.constructor.name,
                errorCode: error.code,
                stack: error.stack,
                businessId,
                language,
                query,
                threshold,
                limit,
            });
            logger.error(error.message);
            return [];
        }
    }

    /**
     * Gets all context sections for a business (no similarity filtering).
     * @param {object} options - Search options.
     * @param {number} options.businessId - The ID of the business.
     * @param {string} options.language - The language code.
     * @returns {Promise<Array<object>>} - Array of all context sections.
     */
    async getAllContextSections({ businessId, language }) {
        try {
            const contextSections = await BusinessContextSection.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    is_active: true,
                },
            });

            const results = contextSections.map((section) => {
                return {
                    id: section.id,
                    type: "context",
                    section_key: section.section_key,
                    section_name: section.section_name,
                    content: section.content,
                    similarity_score: 1.0, // Always include, so set high score
                    source: "context_section",
                    metadata: {
                        section_type: section.section_type,
                        character_count: section.character_count,
                        word_count: section.word_count,
                        search_hits: section.search_hits,
                    },
                };
            });

            logger.info("Retrieved all context sections", {
                businessId,
                language,
                totalSections: contextSections.length,
                results: results.map((r) => ({
                    id: r.id,
                    section_name: r.section_name,
                })),
            });

            return results;
        } catch (error) {
            logger.error("Failed to get context sections", {
                error: error.message,
                stack: error.stack,
                businessId,
                language,
            });
            return [];
        }
    }

    /**
     * Search context sections using semantic similarity
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Context search results
     */
    async searchContextSections(params) {
        const { query, businessId, language, threshold, limit } = params;

        try {
            const contextSections = await BusinessContextSection.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    is_active: true,
                },
                limit,
            });

            // Calculate similarity scores (simplified for now)
            const results = contextSections
                .map((section) => {
                    const similarity = this.calculateTextSimilarity(
                        query,
                        section.content
                    );
                    return {
                        id: section.id,
                        type: "context",
                        section_key: section.section_key,
                        section_name: section.section_name,
                        content: section.content,
                        similarity_score: similarity,
                        source: "context_section",
                        metadata: {
                            section_type: section.section_type,
                            character_count: section.character_count,
                            word_count: section.word_count,
                            search_hits: section.search_hits,
                        },
                    };
                })
                .filter((result) => result.similarity_score >= threshold)
                .sort((a, b) => b.similarity_score - a.similarity_score);

            return results;
        } catch (error) {
            logger.error("Context section search failed", {
                error: error.message,
                businessId,
                language,
            });
            return [];
        }
    }

    /**
     * Gets all FAQ items for a business (no similarity filtering).
     * @param {object} options - Search options.
     * @param {number} options.businessId - The ID of the business.
     * @param {string} options.language - The language code.
     * @returns {Promise<Array<object>>} - Array of all FAQ items.
     */
    async getAllFaqItems({ businessId, language }) {
        try {
            const faqItems = await FaqItem.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    is_active: true,
                },
            });

            const results = faqItems.map((faq) => {
                return {
                    id: faq.id,
                    type: "faq",
                    section_key: `faq_${faq.id}`,
                    section_name: `FAQ: ${faq.question.substring(0, 50)}...`,
                    content: `Question: ${faq.question}\n\nAnswer: ${faq.answer}`,
                    similarity_score: 1.0, // Always include, so set high score
                    source: "faq_item",
                    metadata: {
                        category: faq.category,
                        usage_count: faq.usage_count,
                        success_rate: faq.success_rate,
                    },
                };
            });

            logger.info("Retrieved all FAQ items", {
                businessId,
                language,
                totalFaqs: faqItems.length,
                results: results.map((r) => ({
                    id: r.id,
                    section_name: r.section_name,
                })),
            });

            return results;
        } catch (error) {
            logger.error("Failed to get FAQ items", {
                error: error.message,
                stack: error.stack,
                businessId,
                language,
            });
            return [];
        }
    }

    /**
     * Searches FAQ items using semantic similarity.
     * @param {object} options - Search options.
     * @param {string} options.query - The user's query.
     * @param {number} options.businessId - The ID of the business.
     * @param {string} options.language - The language code.
     * @param {number} options.threshold - Minimum similarity score.
     * @param {number} options.limit - Maximum number of results.
     * @returns {Promise<Array<object>>} - Array of matching FAQ items.
     */
    async searchFaqItems({ query, businessId, language, threshold, limit }) {
        try {
            const faqItems = await FaqItem.findAll({
                where: {
                    business_id: businessId,
                    language_code: language,
                    is_active: true,
                },
                limit: limit * 2, // Fetch more to filter by similarity
            });

            const results = faqItems
                .map((faq) => {
                    // Calculate similarity for both question and answer
                    const questionSimilarity = this.calculateTextSimilarity(
                        query,
                        faq.question
                    );
                    const answerSimilarity = this.calculateTextSimilarity(
                        query,
                        faq.answer
                    );
                    const combinedSimilarity = Math.max(
                        questionSimilarity,
                        answerSimilarity
                    );

                    return {
                        id: faq.id,
                        type: "faq",
                        section_key: `faq_${faq.id}`,
                        section_name: `FAQ: ${faq.question.substring(
                            0,
                            50
                        )}...`,
                        content: `Question: ${faq.question}\n\nAnswer: ${faq.answer}`,
                        similarity_score: combinedSimilarity,
                        source: "faq_item",
                        metadata: {
                            category: faq.category,
                            usage_count: faq.usage_count,
                            success_rate: faq.success_rate,
                            question_similarity: questionSimilarity,
                            answer_similarity: answerSimilarity,
                        },
                    };
                })
                .filter((result) => result.similarity_score >= threshold)
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .slice(0, limit);

            return results;
        } catch (error) {
            logger.error("FAQ search failed", {
                error: error.message,
                stack: error.stack,
                businessId,
                language,
                query,
                threshold,
                limit,
            });
            return [];
        }
    }

    /**
     * Combine and rank results from all sources
     * @param {Array} templateResults - Template search results
     * @param {Array} contextResults - Context search results
     * @param {Array} faqResults - FAQ search results
     * @param {number} limit - Maximum results to return
     * @returns {Array} Combined and ranked results
     */
    combineAndRankResults(templateResults, contextResults, faqResults, limit) {
        // Combine all results
        const allResults = [
            ...templateResults,
            ...contextResults,
            ...faqResults,
        ];

        // Sort by similarity score (descending)
        allResults.sort((a, b) => b.similarity_score - a.similarity_score);

        // Apply diversity bonus to avoid too many results from same source
        const diversifiedResults = this.applyDiversityBonus(allResults);

        // Return top results
        return diversifiedResults.slice(0, limit);
    }

    /**
     * Apply diversity bonus to ensure variety in results
     * @param {Array} results - Search results
     * @returns {Array} Diversified results
     */
    applyDiversityBonus(results) {
        const diversified = [];
        const sourceCounts = { template: 0, context: 0 };

        for (const result of results) {
            // Apply small bonus for diversity
            const diversityBonus = sourceCounts[result.type] * 0.05;
            result.adjusted_score = result.similarity_score + diversityBonus;
            sourceCounts[result.type]++;

            diversified.push(result);
        }

        // Re-sort by adjusted score
        return diversified.sort((a, b) => b.adjusted_score - a.adjusted_score);
    }

    /**
     * Calculate text similarity (simplified implementation)
     * In production, this would use proper semantic similarity with embeddings
     * @param {string} query - Search query
     * @param {string} content - Content to compare
     * @returns {number} Similarity score (0-1)
     */
    calculateTextSimilarity(query, content) {
        if (!query || !content) return 0;

        const queryWords = query.toLowerCase().split(/\s+/);
        const contentWords = content.toLowerCase().split(/\s+/);

        // Simple word overlap calculation
        const commonWords = queryWords.filter((word) =>
            contentWords.includes(word)
        );

        // Calculate Jaccard similarity
        const union = new Set([...queryWords, ...contentWords]).size;
        const intersection = commonWords.length;

        return union > 0 ? intersection / union : 0;
    }

    /**
     * Update search hit counts for used contexts
     * @param {Array} usedContexts - Array of context IDs that were used
     * @param {string} type - Type of context ('template', 'context', or 'faq')
     */
    async updateSearchHits(usedContexts, type) {
        try {
            if (type === "template") {
                await BusinessTemplateResponse.increment("search_hits", {
                    where: { id: usedContexts },
                });
            } else if (type === "context") {
                await BusinessContextSection.increment("search_hits", {
                    where: { id: usedContexts },
                });
            } else if (type === "faq") {
                await FaqItem.increment("usage_count", {
                    where: { id: usedContexts },
                });
            }

            logger.info("Updated search hits", {
                type,
                count: usedContexts.length,
                contextIds: usedContexts,
            });
        } catch (error) {
            logger.error("Failed to update search hits", {
                error: error.message,
                type,
                contextIds: usedContexts,
            });
        }
    }
}

module.exports = ContextSearchService;
