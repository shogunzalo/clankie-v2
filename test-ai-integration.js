#!/usr/bin/env node

/**
 * Simple test script to verify AI integration
 * Run with: node test-ai-integration.js
 */

require("dotenv").config();
const AIMessageProcessor = require("./src/services/AIMessageProcessor");

async function testAIIntegration() {
    console.log("🧪 Testing AI Integration...\n");

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️  OPENAI_API_KEY not found in environment variables");
        console.log("   The AI processor will use fallback analysis\n");
    } else {
        console.log("✅ OpenAI API key found\n");
    }

    // Initialize AI processor
    const aiProcessor = new AIMessageProcessor();

    // Test message data
    const testMessageData = {
        conversationId: null,
        userId: "test_user_123",
        message:
            "Hello! I'm interested in your services. Can you tell me more about pricing?",
        clientId: null,
        businessId: 1,
        platformSourceId: 1,
        attachments: null,
    };

    console.log("📝 Test Message:", testMessageData.message);
    console.log("🔄 Processing with AI...\n");

    try {
        const result = await aiProcessor.processMessage(testMessageData);

        if (result.success) {
            console.log("✅ AI Processing Successful!");
            console.log("📊 Analysis Results:");
            console.log(`   Intent: ${result.analysis.intent}`);
            console.log(`   Sentiment: ${result.analysis.sentiment}`);
            console.log(`   Lead Score: ${result.analysis.lead_score}`);
            console.log(`   Confidence: ${result.analysis.confidence}`);
            console.log(`   New State: ${result.newState}`);
            console.log(`   Response Time: ${result.responseTime}ms`);
            console.log(`\n💬 Generated Response: "${result.response}"`);
        } else {
            console.log("❌ AI Processing Failed:", result.error);
        }
    } catch (error) {
        console.error("❌ Test failed with error:", error.message);
    }

    console.log("\n🏁 Test completed!");
}

// Run the test
testAIIntegration().catch(console.error);
