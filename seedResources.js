
require("dotenv").config();

const mongoose = require("mongoose");

const User = require("./models/User");
const Resource = require("./models/Resource");

// ======================================
// DATABASE CONFIGURATION
// ======================================

async function connectDatabase() {

    const {
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_USER,
        DB_PASSWORD
    } = process.env;

    if (
        !DB_HOST ||
        !DB_PORT ||
        !DB_NAME ||
        !DB_USER ||
        !DB_PASSWORD
    ) {
        throw new Error("Missing MongoDB environment variables.");
    }

    const mongoURI =
        `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

    await mongoose.connect(mongoURI, {
        user: DB_USER,
        pass: DB_PASSWORD,
        authSource: DB_NAME,
        serverSelectionTimeoutMS: 15000
    });

    console.log("MongoDB connected successfully!");
}

// ======================================
// NINE NEW WELLNESS RESOURCES
// ======================================

const resources = [

    // ==================================
    // STRESS MANAGEMENT
    // ==================================

    {
        title: "Breaking Tasks into Manageable Steps",
        category: "Stress Management",

        summary:
            "Learn how dividing large responsibilities into smaller tasks can make daily work feel more manageable.",

        content:
            "Large academic or personal responsibilities can sometimes feel overwhelming. Start by writing down everything you need to complete. Divide larger tasks into smaller steps that can be completed individually. Choose one manageable task and work on it before moving to the next. Include short breaks in your schedule and allow flexibility when plans change. Recognise your progress instead of expecting everything to be completed perfectly. If stress continues to affect your daily life, consider speaking with a qualified professional.",

        tags: [
            "stress",
            "productivity",
            "time-management",
            "planning"
        ]
    },

    {
        title: "A Short Study Break Plan",
        category: "Stress Management",

        summary:
            "Explore a simple study-break routine to balance focused work with rest.",

        content:
            "Taking planned breaks can help make study sessions more manageable. Choose a small task to complete and decide when you will take your next break. After a focused period of work, step away from your desk, stretch gently, drink water or take a short walk. Avoid filling every break with additional work. Adjust the length of your study and rest periods according to your comfort and concentration. Remember that a balanced routine is more important than studying continuously without rest.",

        tags: [
            "study",
            "academic-stress",
            "breaks",
            "time-management"
        ]
    },

    // ==================================
    // ANXIETY
    // ==================================

    {
        title: "Preparing for Public Speaking",
        category: "Anxiety",

        summary:
            "Learn practical preparation techniques for approaching presentations with greater confidence.",

        content:
            "Speaking in front of others can feel uncomfortable for many people. Begin by organising your main points into a simple outline. Practise speaking aloud in a comfortable environment and become familiar with the opening and closing sentences of your presentation. You can rehearse in front of a trusted friend or record yourself to review your delivery. Before speaking, take a few gentle breaths and pause when needed. Remember that making small mistakes during a presentation is normal. If speaking-related anxiety significantly affects daily activities, professional support may be helpful.",

        tags: [
            "anxiety",
            "public-speaking",
            "confidence",
            "presentations"
        ]
    },

    {
        title: "Managing Worry with a Thought Journal",
        category: "Anxiety",

        summary:
            "Use a simple writing activity to notice worries and organise your thoughts.",

        content:
            "Writing down worries can help you understand what is occupying your attention. Choose a quiet moment and write down one concern in your own words. Identify what you know about the situation and what remains uncertain. Consider whether there is one small practical action you can take. Some concerns may not have an immediate solution, and that is acceptable. You can return to the journal later rather than trying to resolve everything at once. This activity supports reflection and does not replace professional mental health care.",

        tags: [
            "anxiety",
            "journaling",
            "self-reflection",
            "worry"
        ]
    },

    // ==================================
    // MINDFULNESS
    // ==================================

    {
        title: "Five Senses Mindfulness Practice",
        category: "Mindfulness",

        summary:
            "Practise noticing your surroundings through your five senses in a calm and comfortable way.",

        content:
            "Choose a comfortable place and gently bring your attention to the present moment. Notice five things you can see, four things you can physically feel, three sounds you can hear, two smells you can notice and one taste you can identify. Move through the exercise without rushing. There is no need to get every observation right. You can pause or stop whenever you wish. This simple activity offers an opportunity to pay attention to your immediate surroundings rather than focusing only on ongoing thoughts.",

        tags: [
            "mindfulness",
            "five-senses",
            "grounding",
            "awareness"
        ]
    },

    {
        title: "Mindful Pauses During a Busy Day",
        category: "Mindfulness",

        summary:
            "Discover short mindfulness pauses that can be included in everyday activities.",

        content:
            "A mindful pause does not need to take a long time. Choose a moment between activities and stop briefly. Notice your posture, breathing and surroundings without judging yourself. While drinking water or having a meal, pay attention to the experience instead of rushing through it. If your attention moves to another thought, gently bring it back to what you are doing. You can practise this during ordinary activities such as walking, reading or organising your workspace. Choose a comfortable approach that suits your routine.",

        tags: [
            "mindfulness",
            "daily-routine",
            "present-moment",
            "awareness"
        ]
    },

    // ==================================
    // EMOTIONAL WELLNESS
    // ==================================

    {
        title: "Naming and Understanding Your Emotions",
        category: "Emotional Wellness",

        summary:
            "Develop emotional awareness by recognising and describing what you are feeling.",

        content:
            "Emotional awareness begins with noticing how you feel. Take a moment to identify the emotion you are experiencing, such as happiness, frustration, disappointment, excitement or sadness. Consider what happened before you noticed the feeling. You may find it helpful to write a short reflection about the situation. Remember that experiencing difficult emotions is a normal part of life. You do not need to judge yourself for having them. If emotional difficulties become persistent or overwhelming, consider seeking qualified professional support.",

        tags: [
            "emotions",
            "emotional-awareness",
            "self-reflection",
            "wellbeing"
        ]
    },

    {
        title: "Building a Supportive Social Connection",
        category: "Emotional Wellness",

        summary:
            "Explore simple ways to maintain meaningful connections with friends, family and trusted people.",

        content:
            "Positive social connections can contribute to a sense of belonging and emotional wellbeing. Make time to check in with someone you trust, share an activity or have a meaningful conversation. Practise listening as well as expressing your own thoughts. Remember that relationships require mutual respect and healthy boundaries. If someone is unavailable, consider other trusted people or suitable support services. You do not need a large social circle to experience meaningful connection. Small, genuine interactions can also matter.",

        tags: [
            "social-support",
            "relationships",
            "connection",
            "emotional-wellness"
        ]
    },

    {
        title: "Daily Emotional Check-In",
        category: "Emotional Wellness",

        summary:
            "Create a simple daily reflection habit to notice your feelings, needs and personal progress.",

        content:
            "Set aside a few minutes at the end of the day to reflect on your emotional wellbeing. Ask yourself what you felt during the day, what activities influenced your mood and what you appreciated about your experiences. Consider whether you need rest, support, time for yourself or a conversation with someone you trust. You can write one or two sentences in a journal or simply reflect quietly. There are no correct answers. Use this activity as an opportunity for self-awareness rather than judging your day as good or bad.",

        tags: [
            "emotional-wellness",
            "daily-check-in",
            "journaling",
            "self-awareness"
        ]
    }

];

// ======================================
// BULK INSERT FUNCTION
// ======================================

async function seedResources() {

    try {

        await connectDatabase();

        // Find an existing active administrator.
        const admin = await User.findOne({
            role: "admin",
            isActive: true
        }).select("_id name");

        if (!admin) {
            throw new Error(
                "No active administrator account found. Create or activate an admin account first."
            );
        }

        console.log("Administrator account verified.");

        // Check which resources already exist.
        const existingResources = await Resource.find({
            title: {
                $in: resources.map(resource => resource.title)
            }
        }).select("title category");

        const existingKeys = new Set(
            existingResources.map(
                resource =>
                    `${resource.category}|${resource.title}`
            )
        );

        // Exclude duplicate resources.
        const newResources = resources
            .filter(resource => {
                const key =
                    `${resource.category}|${resource.title}`;

                return !existingKeys.has(key);
            })
            .map(resource => ({
                ...resource,
                isPublished: true,
                createdBy: admin._id
            }));

        if (newResources.length === 0) {
            console.log(
                "All seed resources already exist. No duplicates inserted."
            );
        } else {

            const inserted = await Resource.insertMany(
                newResources,
                { ordered: true }
            );

            console.log(
                `Successfully inserted ${inserted.length} resources!`
            );
        }

        // ==================================
        // VERIFY PUBLISHED CATEGORY COUNTS
        // ==================================

        const categoryCounts = await Resource.aggregate([
            {
                $match: {
                    isPublished: true
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        console.log("\nPublished Resource Summary:");

        for (const category of [
            "Stress Management",
            "Anxiety",
            "Mindfulness",
            "Sleep",
            "Self Care",
            "Emotional Wellness"
        ]) {

            const record = categoryCounts.find(
                item => item._id === category
            );

            console.log(
                `${category}: ${record?.count || 0}`
            );
        }

        const total = categoryCounts.reduce(
            (sum, item) => sum + item.count,
            0
        );

        console.log(`\nTotal published resources: ${total}`);

    } catch (error) {

        console.error(
            "Resource seeding failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {

        await mongoose.disconnect();

        console.log("MongoDB connection closed.");
    }
}

// ======================================
// EXECUTE
// ======================================

seedResources();
