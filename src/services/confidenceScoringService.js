"use strict";

const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("confidence-scoring");

/**
 * Confidence Scoring Service
 * Handles confidence calculation for AI responses
 * Follows Single Responsibility Principle - only handles confidence scoring
 */
class ConfidenceScoringService {
    constructor() {
        this.defaultThreshold = 0.7;
        this.weights = {
            relevance: 0.4, // How relevant the context is to the question
            completeness: 0.3, // How complete the answer is
            sourceQuality: 0.2, // Quality of the source context
            semanticMatch: 0.1, // Semantic similarity score
        };
    }

    /**
     * Calculate confidence score for a response
     * @param {Object} params - Scoring parameters
     * @param {string} params.question - Original question
     * @param {string} params.response - Generated response
     * @param {Array} params.contextSources - Context sources used
     * @param {number} params.semanticScore - Semantic similarity score
     * @param {Object} params.businessConfig - Business-specific configuration
     * @returns {Promise<Object>} Confidence score and breakdown
     */
    async calculateConfidence(params) {
        const {
            question,
            response,
            contextSources = [],
            semanticScore = 0,
            businessConfig = {},
        } = params;

        logger.info("Calculating confidence score", {
            questionLength: question?.length,
            responseLength: response?.length,
            contextSourcesCount: contextSources.length,
            semanticScore,
        });

        try {
            // Calculate individual score components
            const relevanceScore = this.calculateRelevanceScore(
                question,
                response,
                contextSources
            );
            const completenessScore = this.calculateCompletenessScore(
                question,
                response
            );
            const sourceQualityScore =
                this.calculateSourceQualityScore(contextSources);
            const semanticMatchScore =
                this.normalizeSemanticScore(semanticScore);

            // Calculate weighted confidence score
            const confidenceScore =
                relevanceScore * this.weights.relevance +
                completenessScore * this.weights.completeness +
                sourceQualityScore * this.weights.sourceQuality +
                semanticMatchScore * this.weights.semanticMatch;

            // Determine if response meets confidence threshold
            const threshold =
                businessConfig.confidenceThreshold || this.defaultThreshold;
            const isConfident = confidenceScore >= threshold;

            const result = {
                confidence_score: Math.round(confidenceScore * 100) / 100,
                is_confident: isConfident,
                threshold: threshold,
                breakdown: {
                    relevance: Math.round(relevanceScore * 100) / 100,
                    completeness: Math.round(completenessScore * 100) / 100,
                    source_quality: Math.round(sourceQualityScore * 100) / 100,
                    semantic_match: Math.round(semanticMatchScore * 100) / 100,
                },
                weights: this.weights,
                context_sources_count: contextSources.length,
                recommendations: this.generateRecommendations({
                    confidenceScore,
                    threshold,
                    breakdown: {
                        relevance: relevanceScore,
                        completeness: completenessScore,
                        source_quality: sourceQualityScore,
                        semantic_match: semanticMatchScore,
                    },
                }),
            };

            logger.info("Confidence score calculated", {
                confidence_score: result.confidence_score,
                is_confident: result.is_confident,
                threshold: result.threshold,
            });

            return result;
        } catch (error) {
            logger.error("Confidence calculation failed", {
                error: error.message,
                stack: error.stack,
                question: question?.substring(0, 100),
            });
            throw error;
        }
    }

    /**
     * Calculate relevance score based on how well context matches the question
     * @param {string} question - Original question
     * @param {string} response - Generated response
     * @param {Array} contextSources - Context sources used
     * @returns {number} Relevance score (0-1)
     */
    calculateRelevanceScore(question, response, contextSources) {
        if (!question || !response || contextSources.length === 0) {
            return 0;
        }

        // Check if response addresses the question directly
        const questionKeywords = this.extractKeywords(question);
        const responseKeywords = this.extractKeywords(response);

        // Calculate keyword overlap
        const commonKeywords = questionKeywords.filter((keyword) =>
            responseKeywords.includes(keyword)
        );

        const keywordRelevance =
            commonKeywords.length / questionKeywords.length;

        // Check if response contains question words
        const questionWords = question.toLowerCase().split(/\s+/);
        const responseWords = response.toLowerCase().split(/\s+/);
        const wordOverlap = questionWords.filter((word) =>
            responseWords.includes(word)
        ).length;

        const wordRelevance = wordOverlap / questionWords.length;

        // Combine keyword and word relevance
        return Math.min(1, (keywordRelevance + wordRelevance) / 2);
    }

    /**
     * Calculate completeness score based on response thoroughness
     * @param {string} question - Original question
     * @param {string} response - Generated response
     * @returns {number} Completeness score (0-1)
     */
    calculateCompletenessScore(question, response) {
        if (!question || !response) return 0;

        // Check response length relative to question complexity
        const questionLength = question.length;
        const responseLength = response.length;

        // Minimum response length based on question length
        const minResponseLength = Math.max(50, questionLength * 2);
        const lengthScore = Math.min(1, responseLength / minResponseLength);

        // Check for question words in response (indicating direct addressing)
        const questionWords = question.toLowerCase().split(/\s+/);
        const responseWords = response.toLowerCase().split(/\s+/);
        const addressedWords = questionWords.filter((word) =>
            responseWords.includes(word)
        ).length;

        const addressingScore = addressedWords / questionWords.length;

        // Check for complete sentences and structure
        const sentenceCount = (response.match(/[.!?]+/g) || []).length;
        const structureScore = Math.min(1, sentenceCount / 2); // At least 2 sentences

        return (lengthScore + addressingScore + structureScore) / 3;
    }

    /**
     * Calculate source quality score based on context source characteristics
     * @param {Array} contextSources - Context sources used
     * @returns {number} Source quality score (0-1)
     */
    calculateSourceQualityScore(contextSources) {
        if (!contextSources || contextSources.length === 0) return 0;

        let totalScore = 0;

        for (const source of contextSources) {
            let sourceScore = 0.5; // Base score

            // Bonus for multiple sources
            if (contextSources.length > 1) {
                sourceScore += 0.2;
            }

            // Bonus for high similarity scores
            if (source.similarity_score > 0.8) {
                sourceScore += 0.2;
            } else if (source.similarity_score > 0.6) {
                sourceScore += 0.1;
            }

            // Bonus for template sources (more structured)
            if (source.type === "template") {
                sourceScore += 0.1;
            }

            // Bonus for longer, more detailed content
            if (source.metadata?.character_count > 200) {
                sourceScore += 0.1;
            }

            totalScore += Math.min(1, sourceScore);
        }

        return totalScore / contextSources.length;
    }

    /**
     * Normalize semantic score to 0-1 range
     * @param {number} semanticScore - Raw semantic similarity score
     * @returns {number} Normalized score (0-1)
     */
    normalizeSemanticScore(semanticScore) {
        // Assuming semantic score is already in 0-1 range
        return Math.max(0, Math.min(1, semanticScore || 0));
    }

    /**
     * Extract keywords from text
     * @param {string} text - Text to extract keywords from
     * @returns {Array} Array of keywords
     */
    extractKeywords(text) {
        if (!text) return [];

        // Simple keyword extraction (in production, use NLP libraries)
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 3); // Filter out short words

        // Remove common stop words
        const stopWords = new Set([
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "up",
            "about",
            "into",
            "through",
            "during",
            "before",
            "after",
            "above",
            "below",
            "between",
            "among",
        ]);

        return words.filter((word) => !stopWords.has(word));
    }

    /**
     * Generate recommendations for improving confidence
     * @param {Object} params - Confidence analysis parameters
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(params) {
        const { confidenceScore, threshold, breakdown } = params;
        const recommendations = [];

        if (confidenceScore < threshold) {
            if (breakdown.relevance < 0.5) {
                recommendations.push(
                    "Add more relevant context that directly addresses the question"
                );
            }
            if (breakdown.completeness < 0.5) {
                recommendations.push(
                    "Provide more detailed and comprehensive responses"
                );
            }
            if (breakdown.source_quality < 0.5) {
                recommendations.push(
                    "Improve the quality and detail of context sources"
                );
            }
            if (breakdown.semantic_match < 0.5) {
                recommendations.push(
                    "Add context that is more semantically similar to common questions"
                );
            }
        }

        return recommendations;
    }

    /**
     * Update confidence scoring configuration
     * @param {Object} config - New configuration
     */
    updateConfiguration(config) {
        if (config.weights) {
            this.weights = { ...this.weights, ...config.weights };
        }
        if (config.defaultThreshold !== undefined) {
            this.defaultThreshold = config.defaultThreshold;
        }

        logger.info("Confidence scoring configuration updated", {
            weights: this.weights,
            defaultThreshold: this.defaultThreshold,
        });
    }
}

module.exports = ConfidenceScoringService;
