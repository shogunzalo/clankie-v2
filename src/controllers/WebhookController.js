const { Op } = require("sequelize");
const {
    Conversation,
    Message,
    Client,
    PlatformSource,
    Business,
} = require("../models");
const axios = require("axios");
const AIMessageProcessor = require("../services/AIMessageProcessor");

class WebhookController {
    constructor() {
        this.aiProcessor = new AIMessageProcessor();
    }

    // Verify webhook endpoint
    static async verifyWebhook(req, res) {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        // Check if a token and mode is in the query string of the request
        if (mode && token) {
            // Check the mode and token sent is correct
            if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
                // Respond with the challenge token from the request
                console.log("WEBHOOK_VERIFIED");
                res.status(200).send(challenge);
            } else {
                // Respond with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403);
            }
        }
    }

    // Handle incoming webhook events
    static async handleWebhook(req, res) {
        const body = req.body;

        // Check if this is an event from a page subscription
        if (body.object === "instagram") {
            // Iterate over each entry - there may be multiple if batched
            body.entry.forEach(async function (entry) {
                // Check if messaging array exists and has content
                if (
                    !entry.messaging ||
                    !Array.isArray(entry.messaging) ||
                    entry.messaging.length === 0
                ) {
                    console.log("No messaging events in entry");
                    return;
                }

                // Get the webhook event. entry.messaging is an array, but
                // will only ever contain one event, so we get index 0
                let webhook_event = entry.messaging[0];
                console.log(webhook_event);

                // Check if webhook_event has required properties
                if (
                    !webhook_event ||
                    !webhook_event.sender ||
                    !webhook_event.sender.id
                ) {
                    console.log("Invalid webhook event structure");
                    return;
                }

                // Get the sender PSID
                let sender_psid = webhook_event.sender.id;
                console.log("Sender PSID: " + sender_psid);

                // Check if the event is a message or postback and
                // pass the event to the appropriate handler function
                if (webhook_event.message) {
                    await WebhookController.handleMessage(
                        sender_psid,
                        webhook_event.message
                    );
                } else if (webhook_event.postback) {
                    await WebhookController.handlePostback(
                        sender_psid,
                        webhook_event.postback
                    );
                }
            });

            // Return a '200 OK' response to all events
            res.status(200).send("EVENT_RECEIVED");
        } else {
            // Return a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }
    }

    // Handles messages events
    static async handleMessage(sender_psid, received_message) {
        try {
            // Use the enhanced AI message handling
            await WebhookController.handleMessageWithAI(
                sender_psid,
                received_message,
                null // platformSourceId will be determined in the method
            );
        } catch (error) {
            console.error("Error handling message:", error);
            // Fallback to simple response
            const response = {
                text: "Thanks for your message! We'll get back to you soon.",
            };
            await WebhookController.callSendAPI(sender_psid, response);
        }
    }

    // Handles messaging_postbacks events
    static async handlePostback(sender_psid, received_postback) {
        let response;

        // Get the payload for the postback
        let payload = received_postback.payload;

        // Set the response based on the postback payload
        if (payload === "yes") {
            response = { text: "Thanks!" };
        } else if (payload === "no") {
            response = { text: "Oops, try sending another image." };
        }
        // Send the message to acknowledge the postback
        await WebhookController.callSendAPI(sender_psid, response);
    }

    // Handle message with AI processing
    static async handleMessageWithAI(
        sender_psid,
        received_message,
        platformSourceId
    ) {
        try {
            // Find or create platform source
            let platformSource;
            if (platformSourceId) {
                platformSource = await PlatformSource.findByPk(
                    platformSourceId
                );
            } else {
                // Find first active Instagram platform source
                platformSource = await PlatformSource.findOne({
                    where: {
                        platform_type: "instagram",
                        is_active: true,
                    },
                });
            }

            if (!platformSource) {
                console.log("No platform source found for Instagram");
                return;
            }

            // Find or create client
            let client = await Client.findOne({
                where: {
                    platform_user_id: sender_psid,
                    business_id: platformSource.business_id,
                },
            });

            if (!client) {
                client = await Client.create({
                    platform_user_id: sender_psid,
                    business_id: platformSource.business_id,
                    contact_name: "Instagram User",
                    contact_email: `${sender_psid}@instagram.com`,
                    company_name: "Instagram User",
                    business_type: "Individual",
                    plan_type: "basic",
                });
            }

            // Find or create conversation
            let conversation = await Conversation.findOne({
                where: {
                    client_id: client.id,
                    platform_source_id: platformSource.id,
                },
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    client_id: client.id,
                    platform_source_id: platformSource.id,
                    current_state: "initial_contact",
                    is_active: true,
                });
            }

            // Create incoming message
            const message = await Message.create({
                conversation_id: conversation.id,
                sender_type: "customer",
                message_text: received_message.text || "Image/attachment",
                timestamp: new Date(),
                platform_message_id: received_message.mid || null,
            });

            // Update conversation stats
            await conversation.update({
                last_message_at: new Date(),
                message_count: conversation.message_count + 1,
            });

            // Process with AI
            const aiProcessor = new AIMessageProcessor();
            const result = await aiProcessor.processMessage({
                conversationId: conversation.id,
                userId: sender_psid,
                message: received_message.text || "Image/attachment",
                clientId: client.id,
                connection: platformSource,
            });

            if (result.success) {
                // Update conversation state
                await conversation.update({
                    current_state: result.newState,
                    lead_score: result.analysis.lead_score,
                    sentiment_score: result.analysis.sentiment,
                });

                // Send AI response
                await WebhookController.callSendAPI(sender_psid, {
                    text: result.response,
                });
            } else {
                // Fallback response
                await WebhookController.callSendAPI(sender_psid, {
                    text: "Thanks for your message! We'll get back to you soon.",
                });
            }
        } catch (error) {
            console.error("Error in handleMessageWithAI:", error);
            // Fallback response
            await WebhookController.callSendAPI(sender_psid, {
                text: "Thanks for your message! We'll get back to you soon.",
            });
        }
    }

    // Sends response messages via the Send API
    static async callSendAPI(sender_psid, response) {
        try {
            // Construct the message body
            let request_body = {
                recipient: {
                    id: sender_psid,
                },
                message: response,
            };

            // Send the HTTP request to the Messenger Platform
            const result = await axios.post(
                `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.INSTAGRAM_TEST_TOKEN}`,
                request_body
            );

            console.log("message sent!");
            return result;
        } catch (error) {
            console.log("Unable to send message:" + error);
            throw error;
        }
    }

    // Create a fixed token connection for development/testing
    static async createFixedTokenConnection(req, res) {
        try {
            const { businessId, platformType = "instagram" } = req.body;

            if (!businessId) {
                return res
                    .status(400)
                    .json({ error: "Business ID is required" });
            }

            // Check if business exists
            const business = await Business.findByPk(businessId);
            if (!business) {
                return res.status(404).json({ error: "Business not found" });
            }

            // Create or update platform source with fixed token
            const [platformSource, created] = await PlatformSource.findOrCreate(
                {
                    where: {
                        business_id: businessId,
                        platform_type: platformType,
                        is_active: true,
                    },
                    defaults: {
                        business_id: businessId,
                        platform_type: platformType,
                        platform_name: `${platformType}_fixed_token`,
                        credentials: JSON.stringify({
                            access_token: process.env.INSTAGRAM_TEST_TOKEN,
                            page_id: "fixed_page_id",
                        }),
                        is_active: true,
                        last_sync: new Date(),
                    },
                }
            );

            if (!created) {
                // Update existing platform source
                await platformSource.update({
                    credentials: JSON.stringify({
                        access_token: process.env.INSTAGRAM_TEST_TOKEN,
                        page_id: "fixed_page_id",
                    }),
                    is_active: true,
                    last_sync: new Date(),
                });
            }

            res.json({
                message: "Fixed token connection created successfully",
                platformSource: {
                    id: platformSource.id,
                    platform_type: platformSource.platform_type,
                    platform_name: platformSource.platform_name,
                    is_active: platformSource.is_active,
                    last_sync: platformSource.last_sync,
                },
            });
        } catch (error) {
            console.error("Error creating fixed token connection:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Enhanced message handling with AI processing
    static async handleMessageWithAI(
        sender_psid,
        received_message,
        platformSourceId
    ) {
        try {
            // Find or create platform source if not provided
            if (!platformSourceId) {
                const platformSource = await PlatformSource.findOne({
                    where: {
                        platform_type: "instagram",
                        is_active: true,
                    },
                });
                platformSourceId = platformSource?.id;
            }

            if (!platformSourceId) {
                console.error("No active Instagram platform source found");
                return;
            }

            // Get platform source details
            const platformSource = await PlatformSource.findByPk(
                platformSourceId
            );
            if (!platformSource) {
                console.error("Platform source not found:", platformSourceId);
                return;
            }

            // Find or create client
            let client = await Client.findOne({
                where: {
                    platform_user_id: sender_psid,
                    business_id: platformSource.business_id,
                },
            });

            if (!client) {
                // Create new client
                client = await Client.create({
                    platform_user_id: sender_psid,
                    business_id: platformSource.business_id,
                    first_contact: new Date(),
                    last_contact: new Date(),
                    engagement_score: 0.5,
                });
            } else {
                // Update last contact
                await client.update({ last_contact: new Date() });
            }

            // Find or create conversation
            let conversation = await Conversation.findOne({
                where: {
                    client_id: client.id,
                    platform_source_id: platformSourceId,
                    status: "active",
                },
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    client_id: client.id,
                    platform_source_id: platformSourceId,
                    status: "active",
                    started_at: new Date(),
                    last_message_at: new Date(),
                    message_count: 0,
                });
            }

            // Create incoming message
            const incomingMessage = await Message.create({
                conversation_id: conversation.id,
                sender_type: "client",
                content: received_message.text || "Media message",
                message_type: received_message.attachments ? "media" : "text",
                platform_message_id:
                    received_message.mid || `msg_${Date.now()}`,
                sent_at: new Date(),
                is_read: false,
            });

            // Update conversation message count and last message time
            await conversation.update({
                message_count: conversation.message_count + 1,
                last_message_at: new Date(),
            });

            // Process message with AI
            const aiProcessor = new AIMessageProcessor();
            const aiResult = await aiProcessor.processMessage({
                conversationId: conversation.id,
                userId: sender_psid,
                message: received_message.text,
                clientId: client.id,
                businessId: platformSource.business_id,
                platformSourceId: platformSourceId,
                attachments: received_message.attachments,
            });

            if (aiResult.success && aiResult.response) {
                // Update conversation with new state and analysis
                await conversation.update({
                    status: aiResult.newState,
                    lead_score: aiResult.analysis.lead_score,
                    sentiment_score: aiResult.analysis.sentiment,
                });

                // Create outgoing message
                const outgoingMessage = await Message.create({
                    conversation_id: conversation.id,
                    sender_type: "business",
                    content: aiResult.response,
                    message_type: "text",
                    platform_message_id: `response_${Date.now()}`,
                    sent_at: new Date(),
                    is_read: true,
                });

                // Send response via Instagram API
                await WebhookController.callSendAPI(sender_psid, {
                    text: aiResult.response,
                });

                console.log("✅ AI response sent successfully", {
                    conversationId: conversation.id,
                    clientId: client.id,
                    responseTime: aiResult.responseTime,
                    newState: aiResult.newState,
                    leadScore: aiResult.analysis.lead_score,
                });
            } else {
                console.error("AI processing failed:", aiResult.error);
                // Send fallback response
                const fallbackResponse =
                    "Thank you for your message! We'll get back to you soon.";
                await WebhookController.callSendAPI(sender_psid, {
                    text: fallbackResponse,
                });
            }
        } catch (error) {
            console.error("Error handling message with AI:", error);
            // Send fallback response
            const fallbackResponse =
                "Thank you for your message! We'll get back to you soon.";
            await WebhookController.callSendAPI(sender_psid, {
                text: fallbackResponse,
            });
        }
    }
}

module.exports = WebhookController;
