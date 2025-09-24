# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Clankie API project.

## Test Structure

```
tests/
├── setup.js                    # Jest setup and global mocks
├── utils/
│   └── testHelpers.js          # Test utility functions and mocks
├── services/
│   └── AIMessageProcessor.test.js  # Unit tests for AI service
├── controllers/
│   └── WebhookController.test.js   # Unit tests for webhook controller
├── integration/
│   ├── webhook.integration.test.js # Integration tests for webhook endpoints
│   └── ai.integration.test.js      # Integration tests for AI processing
└── README.md                   # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test Files

```bash
# Unit tests only
npm test -- --testPathPattern="services|controllers"

# Integration tests only
npm test -- --testPathPattern="integration"

# Specific test file
npm test -- AIMessageProcessor.test.js
```

## Test Categories

### 1. Unit Tests

#### AIMessageProcessor Tests (`tests/services/AIMessageProcessor.test.js`)

-   **Constructor**: Tests OpenAI initialization with/without API key
-   **processMessage**: Tests complete message processing flow
-   **getConversationContext**: Tests conversation context retrieval
-   **analyzeMessageWithAI**: Tests AI analysis with OpenAI and fallback
-   **determineStateTransition**: Tests conversation state management
-   **generateResponse**: Tests AI response generation
-   **fallbackAnalysis**: Tests keyword-based fallback analysis
-   **ruleBasedStateTransition**: Tests rule-based state transitions
-   **fallbackResponse**: Tests fallback response generation

#### WebhookController Tests (`tests/controllers/WebhookController.test.js`)

-   **verifyWebhook**: Tests Instagram webhook verification
-   **handleWebhook**: Tests webhook event processing
-   **handleMessage**: Tests message handling
-   **handlePostback**: Tests postback handling
-   **callSendAPI**: Tests Instagram API calls
-   **createFixedTokenConnection**: Tests fixed token connection creation
-   **handleMessageWithAI**: Tests AI-integrated message processing

### 2. Integration Tests

#### Webhook Integration Tests (`tests/integration/webhook.integration.test.js`)

-   **Webhook Verification**: Tests GET `/webhooks/instagram/verify`
-   **Webhook Processing**: Tests POST `/webhooks/instagram/webhook`
-   **Fixed Token Connection**: Tests POST `/webhooks/instagram/fixed-token`
-   **Rate Limiting**: Tests webhook rate limiting exclusion
-   **Error Handling**: Tests malformed payloads and errors
-   **CORS Configuration**: Tests CORS headers
-   **Content Type Handling**: Tests JSON and URL-encoded payloads

#### AI Integration Tests (`tests/integration/ai.integration.test.js`)

-   **End-to-End Processing**: Tests complete AI message processing flow
-   **Conversation State Management**: Tests state progression tracking
-   **Error Handling**: Tests database and API error resilience
-   **Performance**: Tests response times and concurrent processing
-   **Lead Scoring**: Tests lead scoring accuracy
-   **Image Processing**: Tests image attachment handling

## Test Configuration

### Jest Configuration (`jest.config.js`)

-   **Test Environment**: Node.js
-   **Test Matches**: `**/__tests__/**/*.js`, `**/?(*.)+(spec|test).js`
-   **Coverage**: Excludes migrations, seeders, and config files
-   **Setup**: Uses `tests/setup.js` for global configuration
-   **Timeout**: 30 seconds for integration tests

### Test Setup (`tests/setup.js`)

-   **Environment**: Sets `NODE_ENV=test`
-   **Console Mocking**: Reduces test output noise
-   **OpenAI Mocking**: Prevents actual API calls during tests
-   **Axios Mocking**: Mocks HTTP requests

## Mocking Strategy

### Database Models

All Sequelize models are mocked to avoid database dependencies:

-   `Conversation`, `Message`, `Client`, `PlatformSource`, `Business`
-   Mock methods: `findByPk`, `findOne`, `create`, `findAll`, `update`

### External Services

-   **OpenAI**: Mocked to return predictable responses
-   **Axios**: Mocked for HTTP requests
-   **Instagram API**: Mocked for webhook calls

### Test Helpers (`tests/utils/testHelpers.js`)

Provides utility functions for creating mock objects:

-   `createMockRequest()`, `createMockResponse()`
-   `createMockMessageData()`, `createMockContext()`
-   `createMockConversation()`, `createMockClient()`
-   `createMockAnalysis()`, `createMockAIResult()`
-   `createMockWebhookPayload()`, `createMockPostbackPayload()`

## Test Coverage

The test suite aims for comprehensive coverage of:

### Core Functionality

-   ✅ AI message processing (OpenAI + fallback)
-   ✅ Webhook verification and handling
-   ✅ Conversation state management
-   ✅ Lead scoring and qualification
-   ✅ Image processing capabilities
-   ✅ Error handling and resilience

### API Endpoints

-   ✅ Webhook verification endpoint
-   ✅ Webhook event processing endpoint
-   ✅ Fixed token connection endpoint
-   ✅ Rate limiting configuration
-   ✅ CORS handling

### Edge Cases

-   ✅ Missing environment variables
-   ✅ Database connection errors
-   ✅ OpenAI API failures
-   ✅ Malformed webhook payloads
-   ✅ Concurrent message processing
-   ✅ Performance under load

## Writing New Tests

### Unit Test Template

```javascript
describe("ComponentName", () => {
    let component;

    beforeEach(() => {
        component = new ComponentName();
        jest.clearAllMocks();
    });

    describe("methodName", () => {
        it("should handle success case", async () => {
            // Arrange
            const input = createMockInput();
            const expectedOutput = createMockOutput();

            // Act
            const result = await component.methodName(input);

            // Assert
            expect(result).toEqual(expectedOutput);
        });

        it("should handle error case", async () => {
            // Arrange
            const input = createMockInput();
            mockDependency.mockRejectedValue(new Error("Test error"));

            // Act & Assert
            await expect(component.methodName(input)).rejects.toThrow(
                "Test error"
            );
        });
    });
});
```

### Integration Test Template

```javascript
describe("API Endpoint Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should handle valid request", async () => {
        const response = await request(app)
            .post("/api/endpoint")
            .send(validPayload);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(expectedResponse);
    });
});
```

## Best Practices

### Test Organization

-   Group related tests using `describe` blocks
-   Use descriptive test names that explain the scenario
-   Follow AAA pattern: Arrange, Act, Assert
-   Keep tests independent and isolated

### Mocking

-   Mock external dependencies (APIs, databases)
-   Use consistent mock data across tests
-   Reset mocks between tests with `jest.clearAllMocks()`
-   Mock at the appropriate level (unit vs integration)

### Assertions

-   Test both success and failure scenarios
-   Verify return values, side effects, and error handling
-   Use specific matchers (`toBe`, `toEqual`, `toMatchObject`)
-   Test edge cases and boundary conditions

### Performance

-   Keep tests fast and focused
-   Use `beforeEach`/`afterEach` for setup/cleanup
-   Avoid unnecessary async operations
-   Mock time-consuming operations

## Debugging Tests

### Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="should handle"

# Run tests in a specific file
npm test -- WebhookController.test.js

# Run tests with verbose output
npm test -- --verbose
```

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Continuous Integration

The test suite is designed to run in CI environments:

-   No external dependencies (all APIs mocked)
-   Fast execution (< 30 seconds)
-   Comprehensive coverage reporting
-   Clear pass/fail indicators

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in `jest.config.js`
2. **Mock not working**: Ensure mocks are defined before imports
3. **Async test failures**: Use `await` and proper error handling
4. **Coverage gaps**: Add tests for uncovered code paths

### Environment Issues

-   Ensure `NODE_ENV=test` is set
-   Check that all required environment variables are mocked
-   Verify Jest configuration is correct
