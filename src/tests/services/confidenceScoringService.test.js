"use strict";

const ConfidenceScoringService = require("../../services/confidenceScoringService");

// Mock the logger
jest.mock("../../config/logger", () => ({
    createChildLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }),
}));

describe("ConfidenceScoringService", () => {
    let confidenceScoringService;

    beforeEach(() => {
        confidenceScoringService = new ConfidenceScoringService();
    });

    describe("calculateConfidence", () => {
        it("should calculate confidence score with all components", async () => {
            const params = {
                question: "What services do you offer?",
                response:
                    "We offer web development, mobile app development, and consulting services.",
                contextSources: [
                    {
                        id: 1,
                        type: "template",
                        section_name: "Services",
                        similarity_score: 0.8,
                        metadata: { character_count: 100, word_count: 20 },
                    },
                ],
                semanticScore: 0.8,
                businessConfig: { confidenceThreshold: 0.7 },
            };

            const result = await confidenceScoringService.calculateConfidence(
                params
            );

            expect(result.confidence_score).toBeGreaterThan(0);
            expect(result.confidence_score).toBeLessThanOrEqual(1);
            expect(result.is_confident).toBeDefined();
            expect(result.threshold).toBe(0.7);
            expect(result.breakdown).toHaveProperty("relevance");
            expect(result.breakdown).toHaveProperty("completeness");
            expect(result.breakdown).toHaveProperty("source_quality");
            expect(result.breakdown).toHaveProperty("semantic_match");
            expect(result.recommendations).toBeInstanceOf(Array);
        });

        it("should return low confidence for poor matches", async () => {
            const params = {
                question: "What is your pricing?",
                response: "I don't have information about that.",
                contextSources: [],
                semanticScore: 0.1,
                businessConfig: { confidenceThreshold: 0.7 },
            };

            const result = await confidenceScoringService.calculateConfidence(
                params
            );

            expect(result.confidence_score).toBeLessThan(0.7);
            expect(result.is_confident).toBe(false);
        });

        it("should handle missing parameters gracefully", async () => {
            const params = {
                question: "Test question",
                response: "Test response",
            };

            const result = await confidenceScoringService.calculateConfidence(
                params
            );

            expect(result.confidence_score).toBeDefined();
            expect(result.is_confident).toBeDefined();
            expect(result.threshold).toBe(
                confidenceScoringService.defaultThreshold
            );
        });

        it("should use default threshold when not provided", async () => {
            const params = {
                question: "Test question",
                response: "Test response",
                contextSources: [],
                semanticScore: 0.5,
            };

            const result = await confidenceScoringService.calculateConfidence(
                params
            );

            expect(result.threshold).toBe(
                confidenceScoringService.defaultThreshold
            );
        });
    });

    describe("calculateRelevanceScore", () => {
        it("should return high relevance for matching keywords", () => {
            const question = "What web development services do you offer?";
            const response =
                "We offer comprehensive web development services including frontend and backend development.";
            const contextSources = [{ id: 1, type: "template" }];

            const score = confidenceScoringService.calculateRelevanceScore(
                question,
                response,
                contextSources
            );

            expect(score).toBeGreaterThan(0.5);
        });

        it("should return low relevance for unrelated content", () => {
            const question = "What is your pricing?";
            const response =
                "Our company was founded in 2020 and has 50 employees.";
            const contextSources = [{ id: 1, type: "template" }];

            const score = confidenceScoringService.calculateRelevanceScore(
                question,
                response,
                contextSources
            );

            expect(score).toBeLessThan(0.5);
        });

        it("should return 0 for empty inputs", () => {
            const score = confidenceScoringService.calculateRelevanceScore(
                "",
                "",
                []
            );
            expect(score).toBe(0);
        });
    });

    describe("calculateCompletenessScore", () => {
        it("should return high completeness for thorough responses", () => {
            const question = "What services do you offer?";
            const response =
                "We offer a comprehensive range of services including web development, mobile app development, UI/UX design, and digital marketing. Our team has extensive experience in modern technologies and can help you achieve your business goals.";

            const score = confidenceScoringService.calculateCompletenessScore(
                question,
                response
            );

            expect(score).toBeGreaterThan(0.5);
        });

        it("should return low completeness for short responses", () => {
            const question = "What services do you offer?";
            const response = "Services.";

            const score = confidenceScoringService.calculateCompletenessScore(
                question,
                response
            );

            expect(score).toBeLessThan(0.5);
        });

        it("should handle empty inputs", () => {
            const score = confidenceScoringService.calculateCompletenessScore(
                "",
                ""
            );
            expect(score).toBe(0);
        });
    });

    describe("calculateSourceQualityScore", () => {
        it("should return high score for multiple high-quality sources", () => {
            const contextSources = [
                {
                    id: 1,
                    type: "template",
                    similarity_score: 0.9,
                    metadata: { character_count: 300 },
                },
                {
                    id: 2,
                    type: "context",
                    similarity_score: 0.8,
                    metadata: { character_count: 250 },
                },
            ];

            const score =
                confidenceScoringService.calculateSourceQualityScore(
                    contextSources
                );

            expect(score).toBeGreaterThan(0.5);
        });

        it("should return low score for poor sources", () => {
            const contextSources = [
                {
                    id: 1,
                    type: "context",
                    similarity_score: 0.2,
                    metadata: { character_count: 30 },
                },
            ];

            const score =
                confidenceScoringService.calculateSourceQualityScore(
                    contextSources
                );

            expect(score).toBeLessThanOrEqual(0.5);
        });

        it("should return 0 for empty sources", () => {
            const score = confidenceScoringService.calculateSourceQualityScore(
                []
            );
            expect(score).toBe(0);
        });

        it("should give bonus for template sources", () => {
            const templateSource = {
                id: 1,
                type: "template",
                similarity_score: 0.7,
                metadata: { character_count: 200 },
            };

            const contextSource = {
                id: 2,
                type: "context",
                similarity_score: 0.7,
                metadata: { character_count: 200 },
            };

            const templateScore =
                confidenceScoringService.calculateSourceQualityScore([
                    templateSource,
                ]);
            const contextScore =
                confidenceScoringService.calculateSourceQualityScore([
                    contextSource,
                ]);

            expect(templateScore).toBeGreaterThan(contextScore);
        });
    });

    describe("normalizeSemanticScore", () => {
        it("should return the same value for valid scores", () => {
            expect(confidenceScoringService.normalizeSemanticScore(0.8)).toBe(
                0.8
            );
            expect(confidenceScoringService.normalizeSemanticScore(0.5)).toBe(
                0.5
            );
            expect(confidenceScoringService.normalizeSemanticScore(0.0)).toBe(
                0.0
            );
        });

        it("should clamp values to 0-1 range", () => {
            expect(confidenceScoringService.normalizeSemanticScore(1.5)).toBe(
                1
            );
            expect(confidenceScoringService.normalizeSemanticScore(-0.5)).toBe(
                0
            );
        });

        it("should handle null/undefined values", () => {
            expect(confidenceScoringService.normalizeSemanticScore(null)).toBe(
                0
            );
            expect(
                confidenceScoringService.normalizeSemanticScore(undefined)
            ).toBe(0);
        });
    });

    describe("extractKeywords", () => {
        it("should extract meaningful keywords", () => {
            const text =
                "We offer web development services and mobile app development";
            const keywords = confidenceScoringService.extractKeywords(text);

            expect(keywords).toContain("offer");
            expect(keywords).toContain("development");
            expect(keywords).toContain("services");
            expect(keywords).toContain("mobile");
            // "app" is filtered out because it's only 3 characters
            // "web" is filtered out because it's only 3 characters
        });

        it("should filter out stop words", () => {
            const text = "the and or but we offer services";
            const keywords = confidenceScoringService.extractKeywords(text);

            expect(keywords).not.toContain("the");
            expect(keywords).not.toContain("and");
            expect(keywords).not.toContain("or");
            expect(keywords).not.toContain("but");
            expect(keywords).toContain("offer");
            expect(keywords).toContain("services");
        });

        it("should filter out short words", () => {
            const text = "a an the web development services";
            const keywords = confidenceScoringService.extractKeywords(text);

            expect(keywords).not.toContain("a");
            expect(keywords).not.toContain("an");
            expect(keywords).not.toContain("web"); // "web" is only 3 characters, so filtered out
            expect(keywords).toContain("development");
            expect(keywords).toContain("services");
        });

        it("should handle empty text", () => {
            const keywords = confidenceScoringService.extractKeywords("");
            expect(keywords).toEqual([]);
        });

        it("should handle null text", () => {
            const keywords = confidenceScoringService.extractKeywords(null);
            expect(keywords).toEqual([]);
        });
    });

    describe("generateRecommendations", () => {
        it("should generate recommendations for low confidence", () => {
            const params = {
                confidenceScore: 0.4,
                threshold: 0.7,
                breakdown: {
                    relevance: 0.3,
                    completeness: 0.4,
                    source_quality: 0.5,
                    semantic_match: 0.6,
                },
            };

            const recommendations =
                confidenceScoringService.generateRecommendations(params);

            expect(recommendations).toContain(
                "Add more relevant context that directly addresses the question"
            );
            expect(recommendations).toContain(
                "Provide more detailed and comprehensive responses"
            );
        });

        it("should not generate recommendations for high confidence", () => {
            const params = {
                confidenceScore: 0.8,
                threshold: 0.7,
                breakdown: {
                    relevance: 0.8,
                    completeness: 0.8,
                    source_quality: 0.8,
                    semantic_match: 0.8,
                },
            };

            const recommendations =
                confidenceScoringService.generateRecommendations(params);

            expect(recommendations).toHaveLength(0);
        });
    });

    describe("updateConfiguration", () => {
        it("should update weights", () => {
            const newConfig = {
                weights: {
                    relevance: 0.5,
                    completeness: 0.3,
                },
            };

            confidenceScoringService.updateConfiguration(newConfig);

            expect(confidenceScoringService.weights.relevance).toBe(0.5);
            expect(confidenceScoringService.weights.completeness).toBe(0.3);
            expect(confidenceScoringService.weights.sourceQuality).toBe(0.2); // Should remain unchanged
        });

        it("should update default threshold", () => {
            const newConfig = {
                defaultThreshold: 0.8,
            };

            confidenceScoringService.updateConfiguration(newConfig);

            expect(confidenceScoringService.defaultThreshold).toBe(0.8);
        });
    });
});
