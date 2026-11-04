
const express = require("express");
const Resource = require("../models/Resource");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const router = express.Router();

const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const RESOURCE_CATEGORIES = [
    "Stress Management",
    "Anxiety",
    "Mindfulness",
    "Sleep",
    "Self Care",
    "Emotional Wellness"
];

// ======================================
// AI SYSTEM PROMPT
// ======================================

const SYSTEM_PROMPT = `
You are MindCare Connect's AI wellness support assistant.

Your responsibilities:
1. Respond with empathy, kindness and respect.
2. Provide general emotional wellness support.
3. Suggest simple, low-risk self-care activities.
4. Analyse the emotional sentiment expressed by the user.
5. Recommend relevant wellness resource categories.

SENTIMENT CLASSIFICATION:

- positive: Explicit happiness, excitement, gratitude,
  pride, hope, relief or satisfaction.
- negative: Explicit sadness, anxiety, stress,
  worry, anger, loneliness or disappointment.
- mixed: Both positive and negative feelings.
- neutral: Factual or routine messages without clear emotion.

Rules:
- Routine activities are neutral.
- Completing tasks is not automatically positive.
- Do not infer emotions from topics alone.
- Classify the user's message, not your own reply.
- When unclear, choose neutral.

RECOMMENDATION RULES:

Choose only the most relevant resource categories.
Do not select every available category.
Usually select one category, or at most two
when both genuinely address the user's concern.

Examples:
- Academic workload and stress: Stress Management.
- Anxiety about public speaking: Anxiety.
- Breathing and meditation: Mindfulness.
- Sleep difficulties: Sleep.
- Self-care difficulties: Self Care.

SAFETY RULES:
- Never diagnose mental health conditions.
- Never prescribe medicines or treatments.
- Never claim to be a doctor or counsellor.
- Never provide self-harm or suicide instructions.
- Never discourage professional mental healthcare.
- Never claim the chatbot is monitored during emergencies.
- Encourage professional support when appropriate.

Return only valid JSON:

{
  "sentiment": "positive, neutral, negative or mixed",
  "reply": "Your supportive response",
  "resourceCategories": ["Approved resource categories"]
}

Approved categories:
Stress Management, Anxiety, Mindfulness,
Sleep, Self Care, Emotional Wellness.

Keep replies clear, supportive and reasonably brief.
`;

// ======================================
// CRISIS PHRASE DETECTION
// ======================================

const CRISIS_PATTERNS = [
    /\b(?:i want to|i plan to|i am going to|i'm going to|i might|i intend to|i am thinking about|i'm thinking about)\s+(?:kill|hurt|harm)\s+myself\b/i,

    /\b(?:i want to|i plan to|i am going to|i'm going to|i intend to)\s+(?:end|take)\s+my life\b/i,

    /\b(?:i want to die|i wish i were dead|i wish i was dead|i don't want to live|i do not want to live|i don't want to be alive|i do not want to be alive)\b/i,

    /\b(?:i am suicidal|i'm suicidal|i am considering suicide|i'm considering suicide|i am thinking about suicide|i'm thinking about suicide|i have thoughts of suicide|i have suicidal thoughts)\b/i,

    /\b(?:i can't|i cannot|i am unable to|i don't think i can)\s+keep myself safe\b/i,

    /\b(?:i have taken an overdose|i overdosed|i took too many pills)\b/i,

    /\b(?:i have hurt myself|i hurt myself|i am self-harming|i'm self-harming)\b/i
];

function detectCrisis(message) {
    return CRISIS_PATTERNS.some(
        (pattern) => pattern.test(message)
    );
}

// ======================================
// RECOMMENDATION CATEGORY SELECTION
// ======================================

function selectRecommendationCategories(message, aiCategories = []) {

    const text = message.toLowerCase();

    // Anxiety-related messages
    if (
        /\b(anxiety|anxious|nervous|panic|panicking|worried|worry|fear|afraid|scared)\b/.test(text) ||
        /\bpublic speaking\b/.test(text) ||
        /\bheart races\b/.test(text)
    ) {
        return ["Anxiety"];
    }

    // Stress-related messages
    if (
        /\b(stress|stressed|stressful|overwhelmed|pressure|workload|deadlines)\b/.test(text) ||
        /\bdifficult to relax\b/.test(text)
    ) {
        return ["Stress Management", "Mindfulness"];
    }

    // Sleep-related messages
    if (
        /\b(sleep|insomnia|can't sleep|cannot sleep|sleeping badly)\b/.test(text)
    ) {
        return ["Sleep"];
    }

    // Self-care-related messages
    if (
        /\b(self-care|self care|taking care of myself|personal care)\b/.test(text)
    ) {
        return ["Self Care"];
    }

    // Mindfulness-related messages
    if (
        /\b(breathing|meditation|grounding|mindfulness|present moment)\b/.test(text)
    ) {
        return ["Mindfulness"];
    }

    // Fallback: use Gemini's valid categories, maximum two.
    const validCategories = [
        ...new Set(
            Array.isArray(aiCategories)
                ? aiCategories.filter((category) =>
                    RESOURCE_CATEGORIES.includes(category)
                )
                : []
        )
    ];

    return validCategories.length
        ? validCategories.slice(0, 2)
        : ["Emotional Wellness"];
}

// ======================================
// GEMINI REQUEST WITH LIMITED RETRY
// ======================================

async function fetchGeminiWithRetry(endpoint, options) {

    const delays = [1500, 3000];

    for (let attempt = 0; attempt < 3; attempt++) {

        const response = await fetch(endpoint, {
            ...options,
            signal: AbortSignal.timeout(30000)
        });

        if (response.status !== 503 || attempt === 2) {
            return response;
        }

        if (response.body) {
            await response.body.cancel().catch(() => {});
        }

        await new Promise((resolve) =>
            setTimeout(resolve, delays[attempt])
        );
    }

    throw new Error("Gemini request failed.");
}

// ======================================
// RESOURCE RECOMMENDATIONS
// ======================================

async function getRecommendations(categories) {

    try {

        const validCategories = [
            ...new Set(
                categories.filter((category) =>
                    RESOURCE_CATEGORIES.includes(category)
                )
            )
        ].slice(0, 2);

        if (validCategories.length === 0) {
            return [];
        }

        return await Resource.find({
            isPublished: true,
            category: {
                $in: validCategories
            }
        })
            .select("title category summary tags")
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

    } catch (error) {

        console.error(
            "Resource recommendation lookup failed."
        );

        return [];
    }
}

// ======================================
// CRISIS RESPONSE
// INDIA-SPECIFIC EMERGENCY INFORMATION
// ======================================

async function createCrisisResponse() {

    const recommendations = await getRecommendations([
        "Emotional Wellness"
    ]);

    return {
        success: true,
        crisisDetected: true,
        sentiment: "negative",

        reply:
            "I'm really sorry that you're going through this. " +
            "Your safety matters, and you deserve immediate support.\n\n" +

            "If you may act on thoughts of suicide or self-harm, " +
            "have already harmed yourself, or are in immediate danger, " +
            "please call 112 in India or go to the nearest emergency department.\n\n" +

            "For free, 24-hour mental health support in India, " +
            "you can contact Tele-MANAS at 14416.\n\n" +

            "If possible, move near someone you trust and tell them " +
            "directly what is happening. Please consider speaking " +
            "with a qualified mental health professional.\n\n" +

            "This AI chat is not monitored during emergencies " +
            "and cannot provide emergency care.",

        recommendations
    };
}

// ======================================
// POST /api/ai/chat
// AI WELLNESS ASSISTANT
// ======================================

router.post(
    "/chat",
    authenticate,
    authorize("user"),

    async (req, res) => {

        try {

            const {
                message,
                consent
            } = req.body || {};

            // Consent validation
            if (consent !== true) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please provide consent before using the AI assistant."
                });
            }

            // Message validation
            if (
                typeof message !== "string" ||
                !message.trim() ||
                message.trim().length > 2000
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Message must contain between 1 and 2000 characters."
                });
            }

            const userMessage = message.trim();

            // ======================================
            // CRISIS DETECTION
            // ======================================

            if (detectCrisis(userMessage)) {

                const crisisResponse =
                    await createCrisisResponse();

                return res.status(200).json(crisisResponse);
            }

            // ======================================
            // CHECK API CONFIGURATION
            // ======================================

            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {

                return res.status(503).json({
                    success: false,
                    message:
                        "AI service is not configured. Please contact the administrator."
                });
            }

            // ======================================
            // GEMINI API ENDPOINT
            // ======================================

            const endpoint =
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

            // ======================================
            // SEND GEMINI REQUEST
            // ======================================

            const geminiResponse =
                await fetchGeminiWithRetry(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": apiKey
                        },

                        body: JSON.stringify({

                            systemInstruction: {
                                parts: [
                                    {
                                        text: SYSTEM_PROMPT
                                    }
                                ]
                            },

                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        {
                                            text: userMessage
                                        }
                                    ]
                                }
                            ],

                            generationConfig: {

                                temperature: 0,

                                thinkingConfig: {
                                    thinkingLevel: "low"
                                },

                                maxOutputTokens: 1024,

                                responseMimeType: "application/json",

                                responseSchema: {

                                    type: "OBJECT",

                                    properties: {

                                        sentiment: {
                                            type: "STRING",
                                            enum: [
                                                "positive",
                                                "neutral",
                                                "negative",
                                                "mixed"
                                            ]
                                        },

                                        reply: {
                                            type: "STRING"
                                        },

                                        resourceCategories: {
                                            type: "ARRAY",

                                            items: {
                                                type: "STRING",
                                                enum: RESOURCE_CATEGORIES
                                            }
                                        }
                                    },

                                    required: [
                                        "sentiment",
                                        "reply",
                                        "resourceCategories"
                                    ]
                                }
                            }
                        })
                    }
                );

            // ======================================
            // HANDLE GEMINI RESPONSE
            // ======================================

            const geminiData =
                await geminiResponse.json().catch(() => ({}));

            if (!geminiResponse.ok) {

                console.error(
                    "Gemini API failed with status:",
                    geminiResponse.status,
                    geminiData.error?.message || ""
                );

                if (geminiResponse.status === 429) {

                    return res.status(429).json({
                        success: false,
                        message:
                            "The AI service is temporarily busy. Please try again later."
                    });
                }

                if (geminiResponse.status === 503) {

                    return res.status(503).json({
                        success: false,
                        message:
                            "The AI service is temporarily unavailable. Please try again later."
                    });
                }

                return res.status(502).json({
                    success: false,
                    message:
                        "The AI service could not process your request."
                });
            }

            // ======================================
            // EXTRACT GENERATED RESPONSE
            // ======================================

            const parts =
                geminiData.candidates?.[0]?.content?.parts || [];

            const generatedText = parts
                .filter((part) => part.thought !== true)
                .map((part) => part.text || "")
                .join("")
                .trim();

            if (!generatedText) {

                return res.status(502).json({
                    success: false,
                    message:
                        "The AI service returned an empty response. Please try again."
                });
            }

            // ======================================
            // PARSE AI JSON
            // ======================================

            let aiResult;

            try {

                aiResult = JSON.parse(generatedText);

            } catch (error) {

                return res.status(502).json({
                    success: false,
                    message:
                        "Unable to interpret the AI response. Please try again."
                });
            }

            // ======================================
            // VALIDATE SENTIMENT
            // ======================================

            const validSentiments = [
                "positive",
                "neutral",
                "negative",
                "mixed"
            ];

            const sentiment =
                validSentiments.includes(aiResult.sentiment)
                    ? aiResult.sentiment
                    : "neutral";

            // ======================================
            // VALIDATE REPLY
            // ======================================

            const reply =
                typeof aiResult.reply === "string" &&
                aiResult.reply.trim()
                    ? aiResult.reply.trim()
                    : "Thank you for sharing. Consider speaking with someone you trust about how you are feeling.";

            // ======================================
            // SELECT RELEVANT CATEGORIES
            // ======================================

            const categories =
                selectRecommendationCategories(
                    userMessage,
                    aiResult.resourceCategories
                );

            // ======================================
            // FETCH RECOMMENDATIONS
            // ======================================

            const recommendations =
                await getRecommendations(categories);

            // ======================================
            // FINAL RESPONSE
            // ======================================

            return res.status(200).json({
                success: true,
                crisisDetected: false,
                sentiment,
                reply,
                recommendations
            });

        } catch (error) {

            console.error(
                "AI wellness assistant error:",
                error.message
            );

            const isTimeout =
                error.name === "TimeoutError" ||
                error.name === "AbortError";

            return res.status(isTimeout ? 504 : 500).json({
                success: false,
                message: isTimeout
                    ? "The AI service timed out. Please try again."
                    : "Unable to process your wellness request."
            });
        }
    }
);

module.exports = router;
