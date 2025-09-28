"use strict";

const ContextSearchService = require("../../services/contextSearchService");
const {
    BusinessTemplateResponse,
    BusinessContextSection,
} = require("../../models");

// Mock the models
jest.mock("../../models", () => ({
    BusinessTemplateResponse: {
        findAll: jest.fn(),
        increment: jest.fn(),
    },
    BusinessContextSection: {
        findAll: jest.fn(),
        increment: jest.fn(),
    },
}));

// Mock the logger
jest.mock("../../config/logger", () => ({
    createChildLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }),
}));

describe("ContextSearchService", () => {
    let contextSearchService;

    beforeEach(() => {
        contextSearchService = new ContextSearchService();
        jest.clearAllMocks();
    });

    describe("searchContexts", () => {
        it("should search both template responses and context sections", async () => {
            const mockTemplateResults = [
                {
                    id: 1,
                    content: "We provide web development services",
                    template: {
                        section_key: "services",
                        section_name: "Services",
                    },
                    character_count: 35,
                    word_count: 6,
                    search_hits: 5,
                },
            ];

            const mockContextResults = [
                {
                    id: 1,
                    content: "Our team specializes in modern web technologies",
                    section_key: "custom_team",
                    section_name: "Our Team",
                    section_type: "custom",
                    character_count: 50,
                    word_count: 8,
                    search_hits: 3,
                },
            ];

            BusinessTemplateResponse.findAll.mockResolvedValue(
                mockTemplateResults
            );
            BusinessContextSection.findAll.mockResolvedValue(
                mockContextResults
            );

            const result = await contextSearchService.searchContexts({
                query: "web development services",
                businessId: 1,
                language: "en",
                threshold: 0.6,
                limit: 5,
            });

            expect(result.success).toBeUndefined(); // Should return data directly
            expect(result.results).toHaveLength(1); // Only template result passes threshold
            expect(result.metadata.totalResults).toBe(1);
            expect(result.metadata.templateResults).toBe(1);
            expect(result.metadata.contextResults).toBe(0); // Context result filtered out by threshold

            // Check that both services were called
            expect(BusinessTemplateResponse.findAll).toHaveBeenCalledWith({
                where: {
                    business_id: 1,
                    language_code: "en",
                    completion_status: "complete",
                },
                include: expect.any(Array),
                limit: 3, // Math.ceil(5/2)
            });

            expect(BusinessContextSection.findAll).toHaveBeenCalledWith({
                where: {
                    business_id: 1,
                    language_code: "en",
                    is_active: true,
                },
                limit: 3, // Math.ceil(5/2)
            });
        });

        it("should handle empty results gracefully", async () => {
            BusinessTemplateResponse.findAll.mockResolvedValue([]);
            BusinessContextSection.findAll.mockResolvedValue([]);

            const result = await contextSearchService.searchContexts({
                query: "nonexistent query",
                businessId: 1,
                language: "en",
                threshold: 0.8,
                limit: 5,
            });

            expect(result.results).toHaveLength(0);
            expect(result.metadata.totalResults).toBe(0);
        });

        it("should handle errors gracefully", async () => {
            BusinessTemplateResponse.findAll.mockRejectedValue(
                new Error("Database error")
            );

            const result = await contextSearchService.searchContexts({
                query: "test query",
                businessId: 1,
            });

            // Should return empty results when template search fails
            expect(result.results).toHaveLength(0);
            expect(result.metadata.templateResults).toBe(0);
        });
    });

    describe("searchTemplateResponses", () => {
        it("should filter results by similarity threshold", async () => {
            const mockResults = [
                {
                    id: 1,
                    content: "We provide excellent web development services",
                    template: {
                        section_key: "services",
                        section_name: "Services",
                    },
                    character_count: 45,
                    word_count: 7,
                    search_hits: 5,
                },
                {
                    id: 2,
                    content: "Our company was founded in 2020",
                    template: { section_key: "about", section_name: "About" },
                    character_count: 30,
                    word_count: 6,
                    search_hits: 2,
                },
            ];

            BusinessTemplateResponse.findAll.mockResolvedValue(mockResults);

            const result = await contextSearchService.searchTemplateResponses({
                query: "web development",
                businessId: 1,
                language: "en",
                threshold: 0.3,
                limit: 5,
            });

            expect(result).toHaveLength(1); // Only first result passes threshold
            expect(result[0].similarity_score).toBeGreaterThanOrEqual(0.3);
            expect(result[0].type).toBe("template");
            expect(result[0].source).toBe("template_response");
        });

        it("should calculate similarity scores correctly", async () => {
            const mockResults = [
                {
                    id: 1,
                    content: "web development services",
                    template: {
                        section_key: "services",
                        section_name: "Services",
                    },
                },
            ];

            BusinessTemplateResponse.findAll.mockResolvedValue(mockResults);

            const result = await contextSearchService.searchTemplateResponses({
                query: "web development",
                businessId: 1,
                language: "en",
                threshold: 0.1,
                limit: 5,
            });

            expect(result[0].similarity_score).toBeGreaterThan(0);
            expect(result[0].similarity_score).toBeLessThanOrEqual(1);
        });
    });

    describe("searchContextSections", () => {
        it("should search context sections with proper filtering", async () => {
            const mockResults = [
                {
                    id: 1,
                    content: "Our team has 10 years of experience",
                    section_key: "custom_team",
                    section_name: "Our Team",
                    section_type: "custom",
                    character_count: 40,
                    word_count: 8,
                    search_hits: 3,
                },
            ];

            BusinessContextSection.findAll.mockResolvedValue(mockResults);

            const result = await contextSearchService.searchContextSections({
                query: "team experience",
                businessId: 1,
                language: "en",
                threshold: 0.2,
                limit: 5,
            });

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe("context");
            expect(result[0].source).toBe("context_section");
            expect(result[0].metadata.section_type).toBe("custom");
        });
    });

    describe("combineAndRankResults", () => {
        it("should combine and rank results by similarity score", () => {
            const templateResults = [
                { id: 1, similarity_score: 0.8, type: "template" },
                { id: 2, similarity_score: 0.6, type: "template" },
            ];

            const contextResults = [
                { id: 3, similarity_score: 0.9, type: "context" },
                { id: 4, similarity_score: 0.5, type: "context" },
            ];

            const result = contextSearchService.combineAndRankResults(
                templateResults,
                contextResults,
                3
            );

            expect(result).toHaveLength(3);
            expect(result[0].similarity_score).toBe(0.9); // Highest score first
            expect(result[1].similarity_score).toBe(0.8);
            expect(result[2].similarity_score).toBe(0.6);
        });

        it("should apply diversity bonus", () => {
            const templateResults = [
                { id: 1, similarity_score: 0.8, type: "template" },
                { id: 2, similarity_score: 0.7, type: "template" },
            ];

            const contextResults = [
                { id: 3, similarity_score: 0.75, type: "context" },
            ];

            const result = contextSearchService.combineAndRankResults(
                templateResults,
                contextResults,
                3
            );

            expect(result[0].adjusted_score).toBeDefined();
            expect(result[0].adjusted_score).toBeGreaterThanOrEqual(
                result[0].similarity_score
            );
        });
    });

    describe("calculateTextSimilarity", () => {
        it("should calculate Jaccard similarity correctly", () => {
            const similarity = contextSearchService.calculateTextSimilarity(
                "web development services",
                "we provide web development and design services"
            );

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThanOrEqual(1);
        });

        it("should return 0 for completely different texts", () => {
            const similarity = contextSearchService.calculateTextSimilarity(
                "web development",
                "restaurant food"
            );

            expect(similarity).toBe(0);
        });

        it("should return 1 for identical texts", () => {
            const text = "web development services";
            const similarity = contextSearchService.calculateTextSimilarity(
                text,
                text
            );

            expect(similarity).toBe(1);
        });

        it("should handle empty or null inputs", () => {
            expect(
                contextSearchService.calculateTextSimilarity("", "test")
            ).toBe(0);
            expect(
                contextSearchService.calculateTextSimilarity("test", "")
            ).toBe(0);
            expect(
                contextSearchService.calculateTextSimilarity(null, "test")
            ).toBe(0);
            expect(
                contextSearchService.calculateTextSimilarity("test", null)
            ).toBe(0);
        });
    });

    describe("updateSearchHits", () => {
        it("should update search hits for template responses", async () => {
            const usedContexts = [1, 2, 3];

            await contextSearchService.updateSearchHits(
                usedContexts,
                "template"
            );

            expect(BusinessTemplateResponse.increment).toHaveBeenCalledWith(
                "search_hits",
                {
                    where: { id: usedContexts },
                }
            );
        });

        it("should update search hits for context sections", async () => {
            const usedContexts = [1, 2, 3];

            await contextSearchService.updateSearchHits(
                usedContexts,
                "context"
            );

            expect(BusinessContextSection.increment).toHaveBeenCalledWith(
                "search_hits",
                {
                    where: { id: usedContexts },
                }
            );
        });

        it("should handle errors gracefully", async () => {
            BusinessTemplateResponse.increment.mockRejectedValue(
                new Error("Database error")
            );

            await contextSearchService.updateSearchHits([1, 2], "template");

            // Should not throw, but log error
            expect(BusinessTemplateResponse.increment).toHaveBeenCalled();
        });
    });
});
