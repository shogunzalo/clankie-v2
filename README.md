# Clankie API

AI-powered business communication platform API built with Express.js and PostgreSQL.

## Features

-   **Multi-language Support**: Handle conversations in multiple languages
-   **Platform Integration**: Connect with WhatsApp, Telegram, Facebook, Instagram, and more
-   **Lead Management**: Track and qualify leads through conversation analysis
-   **FAQ System**: Intelligent FAQ management with keyword matching
-   **Service Catalog**: Manage business services and pricing
-   **Analytics**: Track conversation metrics, lead conversion, and engagement
-   **Vector Embeddings**: Support for AI-powered content matching and search

## Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: PostgreSQL with Sequelize ORM
-   **Authentication**: JWT tokens
-   **Validation**: Express-validator
-   **Security**: Helmet, CORS, Rate limiting

## Database Schema

The API supports a comprehensive business communication system with the following main entities:

-   **Businesses**: Core business information and settings
-   **Clients**: Customer profiles across different platforms
-   **Conversations**: Message threads between clients and business
-   **Messages**: Individual messages with AI analysis
-   **Leads**: Lead qualification and tracking system
-   **FAQ Items**: Knowledge base with keyword matching
-   **Services**: Business service catalog
-   **Platform Sources**: Connected communication platforms

## Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd clankie-v2
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    ```bash
    cp env.example .env
    ```

    Edit `.env` with your configuration:

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=clankie_db
    DB_USER=your_username
    DB_PASSWORD=your_password
    PORT=3000
    NODE_ENV=development
    JWT_SECRET=your_jwt_secret_key_here
    FRONTEND_URL=http://localhost:3000
    INSTAGRAM_TEST_TOKEN=your_instagram_test_token
    VERIFY_TOKEN=your_webhook_verify_token
    CREATE_FIXED_CONNECTION=true
    OPENAI_API_KEY=your_openai_api_key_here
    ```

4. **Set up PostgreSQL database**

    ```bash
    createdb clankie_db
    ```

5. **Run database migrations**

    ```bash
    npm run migrate
    ```

6. **Start the development server**
    ```bash
    npm run dev
    ```

## Webhook Setup

### Instagram Webhook Configuration

1. **Set up Instagram App**:

    - Create a Facebook App with Instagram Basic Display API
    - Get your Instagram Test Token from the App Dashboard
    - Set up webhook URL: `https://yourdomain.com/webhooks/instagram/webhook`

2. **Environment Variables**:

    - `INSTAGRAM_TEST_TOKEN`: Your Instagram test token
    - `VERIFY_TOKEN`: Custom verification token for webhook security
    - `OPENAI_API_KEY`: Your OpenAI API key for AI message processing

3. **Webhook Verification**:

    - Instagram will send a GET request to `/webhooks/instagram/verify`
    - The endpoint verifies the webhook using your `VERIFY_TOKEN`

4. **Development Testing**:
    - Use the `/webhooks/instagram/fixed-token` endpoint to create a test connection
    - This allows you to test webhook functionality without a live Instagram connection

## AI Features

### OpenAI Integration

The API includes advanced AI message processing capabilities:

1. **Message Analysis**:

    - Intent detection (greeting, question, buying signals, objections)
    - Sentiment analysis (-1 to 1 scale)
    - Lead scoring (0-100 scale)
    - Urgency detection
    - Conversation state management

2. **Image Processing**:

    - Analyzes images shared in Instagram messages
    - Extracts business-relevant information from images
    - Integrates image context with text analysis

3. **Conversation Management**:

    - Maintains conversation history and context
    - Tracks conversation states (initial_contact, engaged, interested, qualified, etc.)
    - Generates contextual responses based on conversation flow

4. **Lead Qualification**:
    - Automatically scores leads based on conversation analysis
    - Tracks buying signals and objections
    - Updates client engagement scores

### AI Configuration

-   **Model**: Uses GPT-4 with vision capabilities for image analysis
-   **Fallback**: Includes keyword-based fallback analysis when OpenAI is unavailable
-   **Context**: Maintains conversation history for better response generation
-   **State Management**: Tracks conversation progression through sales funnel

## API Endpoints

### Authentication

All endpoints (except health check) require JWT authentication via `Authorization: Bearer <token>` header.

### Business Management

-   `GET /api/v1/businesses` - List businesses
-   `GET /api/v1/businesses/:id` - Get business details
-   `POST /api/v1/businesses` - Create business
-   `PUT /api/v1/businesses/:id` - Update business
-   `DELETE /api/v1/businesses/:id` - Delete business
-   `GET /api/v1/businesses/:id/stats` - Get business statistics

### Client Management

-   `GET /api/v1/clients` - List clients
-   `GET /api/v1/clients/:id` - Get client details
-   `POST /api/v1/clients` - Create client
-   `PUT /api/v1/clients/:id` - Update client
-   `DELETE /api/v1/clients/:id` - Delete client

### Conversation Management

-   `GET /api/v1/conversations` - List conversations
-   `GET /api/v1/conversations/:id` - Get conversation details
-   `POST /api/v1/conversations` - Create conversation
-   `PUT /api/v1/conversations/:id` - Update conversation
-   `GET /api/v1/conversations/:id/messages` - Get conversation messages
-   `POST /api/v1/conversations/:id/messages` - Add message to conversation

### FAQ Management

-   `GET /api/v1/faqs` - List FAQ items
-   `GET /api/v1/faqs/:id` - Get FAQ item
-   `POST /api/v1/faqs` - Create FAQ item
-   `PUT /api/v1/faqs/:id` - Update FAQ item
-   `DELETE /api/v1/faqs/:id` - Delete FAQ item
-   `GET /api/v1/faqs/search/:query` - Search FAQ items

### Service Management

-   `GET /api/v1/services` - List services
-   `GET /api/v1/services/:id` - Get service
-   `POST /api/v1/services` - Create service
-   `PUT /api/v1/services/:id` - Update service
-   `DELETE /api/v1/services/:id` - Delete service

### Platform Management

-   `GET /api/v1/platforms` - List platform sources
-   `GET /api/v1/platforms/:id` - Get platform source
-   `POST /api/v1/platforms` - Create platform source
-   `PUT /api/v1/platforms/:id` - Update platform source
-   `POST /api/v1/platforms/:id/connect` - Connect platform
-   `POST /api/v1/platforms/:id/disconnect` - Disconnect platform

### Webhook Endpoints

-   `GET /webhooks/instagram/verify` - Instagram webhook verification
-   `POST /webhooks/instagram/webhook` - Instagram webhook event handler
-   `POST /webhooks/instagram/fixed-token` - Create fixed token connection for development

## Database Migrations

The project includes comprehensive database migrations for all tables:

```bash
# Run all migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Reset all migrations
npm run migrate:reset
```

## Models and Associations

All Sequelize models are properly configured with:

-   Validation rules
-   Database constraints
-   Proper associations
-   Indexes for performance

Key associations:

-   Business → Clients, Conversations, FAQ Items, Services, Platform Sources
-   Client → Conversations, Leads
-   Conversation → Messages, Leads
-   Lead → Lead Stage History
-   FAQ Item → FAQ Keywords

## Development

```bash
# Start development server with hot reload
npm run dev

# Run migrations
npm run migrate

# Run seeders (when available)
npm run seed
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database credentials
3. Set secure JWT secret
4. Run migrations: `npm run migrate`
5. Start server: `npm start`

## API Documentation

The API follows RESTful conventions with:

-   Consistent HTTP status codes
-   JSON request/response format
-   Comprehensive error handling
-   Input validation
-   Pagination support

## Health Check

-   `GET /health` - Server health status

## License

ISC License
