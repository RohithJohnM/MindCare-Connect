
require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("./models/User");
const CounselorProfile = require("./models/CounselorProfile");
const MoodEntry = require("./models/MoodEntry");
const Appointment = require("./models/Appointment");

// ======================================
// DATABASE CONNECTION
// ======================================

async function connectDatabase() {
    const {
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_USER,
        DB_PASSWORD
    } = process.env;

    if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASSWORD) {
        throw new Error("Missing MongoDB environment variables.");
    }

    await mongoose.connect(
        `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`,
        {
            user: DB_USER,
            pass: DB_PASSWORD,
            authSource: DB_NAME,
            serverSelectionTimeoutMS: 15000
        }
    );

    console.log("MongoDB connected successfully!");
}

// ======================================
// DATE AND TIME HELPERS
// ======================================

function dateAtOffset(days) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

function dateKey(date) {
    return date.toISOString().slice(0, 10);
}

function weekdayName(date) {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC"
    });
}

function timeToMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(value) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0")
    );
}

function calculateEndTime(startTime, duration) {
    const end = timeToMinutes(startTime) + duration;

    if (end >= 1440) return null;

    return minutesToTime(end);
}

// ======================================
// MOOD JOURNAL DEMO DATA
// ======================================

async function seedMoodEntries(user) {
    const moods = [
        {
            mood: "good",
            intensity: 4,
            note: "A productive day with time for study and rest."
        },
        {
            mood: "stressed",
            intensity: 4,
            note: "DEMO DATA: Felt pressure from academic deadlines."
        },
        {
            mood: "great",
            intensity: 5,
            note: "DEMO DATA: Enjoyed a positive and refreshing day."
        },
        {
            mood: "okay",
            intensity: 3,
            note: "DEMO DATA: An ordinary day with a balanced routine."
        },
        {
            mood: "anxious",
            intensity: 3,
            note: "DEMO DATA: Felt nervous about an upcoming presentation."
        },
        {
            mood: "good",
            intensity: 4,
            note: "DEMO DATA: Completed planned activities."
        },
        {
            mood: "low",
            intensity: 3,
            note: "DEMO DATA: Needed some additional time to relax."
        },
        {
            mood: "great",
            intensity: 5,
            note: "DEMO DATA: Had a happy day with friends."
        },
        {
            mood: "good",
            intensity: 4,
            note: "DEMO DATA: Maintained a comfortable daily routine."
        },
        {
            mood: "stressed",
            intensity: 3,
            note: "DEMO DATA: Managing several tasks at once."
        },
        {
            mood: "okay",
            intensity: 3,
            note: "DEMO DATA: Felt steady and continued daily activities."
        },
        {
            mood: "anxious",
            intensity: 4,
            note: "DEMO DATA: Felt worried about an upcoming examination."
        },
        {
            mood: "good",
            intensity: 4,
            note: "DEMO DATA: Made progress on personal goals."
        },
        {
            mood: "great",
            intensity: 5,
            note: "DEMO DATA: Enjoyed a relaxing weekend."
        },
        {
            mood: "low",
            intensity: 2,
            note: "DEMO DATA: Felt tired and took some rest."
        },
        {
            mood: "okay",
            intensity: 3,
            note: "DEMO DATA: Had a normal day."
        },
        {
            mood: "good",
            intensity: 4,
            note: "DEMO DATA: Connected with family and friends."
        },
        {
            mood: "stressed",
            intensity: 4,
            note: "DEMO DATA: Needed a break from academic work."
        },
        {
            mood: "great",
            intensity: 5,
            note: "DEMO DATA: Felt confident about recent progress."
        },
        {
            mood: "good",
            intensity: 4,
            note: "DEMO DATA: Followed a healthy daily routine."
        },
        {
            mood: "okay",
            intensity: 3,
            note: "DEMO DATA: Took time for personal activities."
        }
    ];

    let inserted = 0;

    for (let i = 0; i < moods.length; i++) {
        const marker = `DEMO DATA: mood-${String(i + 1).padStart(2, "0")}`;

        const exists = await MoodEntry.exists({
            user: user._id,
            note: { $regex: `^${marker}` }
        });

        if (exists) continue;

        const entryDate = dateAtOffset(-(moods.length - i));

        await MoodEntry.create({
            user: user._id,
            mood: moods[i].mood,
            intensity: moods[i].intensity,
            note: `${marker} — ${moods[i].note}`,
            entryDate
        });

        inserted++;
    }

    console.log(`Mood entries inserted: ${inserted}`);
}

// ======================================
// PENDING DEMONSTRATION COUNSELORS
// ======================================

async function seedPendingCounselors() {
    const demoCounselors = [
        {
            name: "Demo Counselor Applicant 01",
            email: "demo.counselor01@example.invalid",
            specialization: ["Stress Management", "Self Care"],
            qualification: "DEMO PROFILE — NOT A VERIFIED PROFESSIONAL",
            experienceYears: 2,
            fee: 500,
            languages: ["English", "Tamil"],
            bio: "Demonstration counselor application for testing the administrator approval workflow. This is fictional demonstration data, not a real professional profile.",
            availability: [
                {
                    day: "Tuesday",
                    startTime: "10:00",
                    endTime: "13:00",
                    isAvailable: true
                },
                {
                    day: "Thursday",
                    startTime: "14:00",
                    endTime: "17:00",
                    isAvailable: true
                }
            ]
        },
        {
            name: "Demo Counselor Applicant 02",
            email: "demo.counselor02@example.invalid",
            specialization: ["Anxiety", "Mindfulness"],
            qualification: "DEMO PROFILE — NOT A VERIFIED PROFESSIONAL",
            experienceYears: 3,
            fee: 600,
            languages: ["English", "Hindi"],
            bio: "Demonstration counselor application for testing the administrator approval workflow. This is fictional demonstration data, not a real professional profile.",
            availability: [
                {
                    day: "Wednesday",
                    startTime: "09:00",
                    endTime: "12:00",
                    isAvailable: true
                },
                {
                    day: "Friday",
                    startTime: "13:00",
                    endTime: "16:00",
                    isAvailable: true
                }
            ]
        }
    ];

    let profilesCreated = 0;

    for (const item of demoCounselors) {
        let counselor = await User.findOne({
            email: item.email
        });

        if (!counselor) {
            counselor = await User.create({
                name: item.name,
                email: item.email,
                password: crypto.randomBytes(48).toString("hex"),
                role: "counselor",
                isActive: true
            });
        }

        if (counselor.role !== "counselor") {
            console.log(`Skipped unexpected account role: ${item.email}`);
            continue;
        }

        const existingProfile = await CounselorProfile.findOne({
            user: counselor._id
        });

        if (existingProfile) continue;

        await CounselorProfile.create({
            user: counselor._id,
            specialization: item.specialization,
            qualification: item.qualification,
            experienceYears: item.experienceYears,
            bio: item.bio,
            languages: item.languages,
            consultationFee: item.fee,
            sessionDuration: 30,
            consultationMode: "online",
            availability: item.availability,
            isApproved: false,
            isActive: true
        });

        profilesCreated++;
    }

    console.log(
        `Pending demonstration counselor profiles created: ${profilesCreated}`
    );

    console.log(
        "Demonstration counselor accounts received random, undisclosed passwords."
    );
}

// ======================================
// FIND A VALID COUNSELOR SLOT
// ======================================

function findAppointmentSlot({
    profile,
    dayOffset,
    direction,
    duration,
    reservations,
    reservedSlots
}) {
    const startOffset = dayOffset;
    const endOffset = direction === "future"
        ? 180
        : -180;

    for (
        let offset = startOffset;
        direction === "future" ? offset <= endOffset : offset >= endOffset;
        offset += direction === "future" ? 1 : -1
    ) {
        if (direction === "past" && offset >= 0) continue;
        if (direction === "future" && offset <= 0) continue;

        const date = dateAtOffset(offset);
        const day = weekdayName(date);

        const availability = (profile.availability || []).find(
            (slot) => slot.day === day && slot.isAvailable
        );

        if (!availability) continue;

        const firstMinute = timeToMinutes(availability.startTime);
        const lastMinute = timeToMinutes(availability.endTime);

        for (
            let minute = firstMinute;
            minute + duration <= lastMinute;
            minute += 30
        ) {
            const startTime = minutesToTime(minute);
            const endTime = calculateEndTime(startTime, duration);

            if (!endTime) continue;

            const dateString = dateKey(date);

            const conflict = [...reservations, ...reservedSlots].some(
                (appointment) => {
                    const existingDate = dateKey(
                        new Date(appointment.appointmentDate)
                    );

                    if (existingDate !== dateString) return false;

                    const existingStart = timeToMinutes(appointment.startTime);
                    const existingEnd = timeToMinutes(appointment.endTime);

                    return (
                        minute < existingEnd &&
                        minute + duration > existingStart
                    );
                }
            );

            if (!conflict) {
                return {
                    appointmentDate: date,
                    startTime,
                    endTime,
                    durationMinutes: duration
                };
            }
        }
    }

    return null;
}

// ======================================
// APPOINTMENT DEMO DATA
// ======================================

async function seedAppointments(user, counselor, profile) {
    const existingAppointments = await Appointment.find({
        $or: [
            { user: user._id },
            { counselor: counselor._id }
        ]
    }).lean();

    const demoReasons = [
        {
            key: "completed-01",
            status: "completed",
            reason: "DEMO DATA: Completed general wellness follow-up."
        },
        {
            key: "completed-02",
            status: "completed",
            reason: "DEMO DATA: Completed stress-management consultation."
        },
        {
            key: "completed-03",
            status: "completed",
            reason: "DEMO DATA: Completed mindfulness support session."
        },
        {
            key: "completed-04",
            status: "completed",
            reason: "DEMO DATA: Completed personal wellness review."
        },
        {
            key: "cancelled-01",
            status: "cancelled",
            reason: "DEMO DATA: Demonstration appointment cancelled by user."
        },
        {
            key: "cancelled-02",
            status: "cancelled",
            reason: "DEMO DATA: Demonstration appointment cancelled before confirmation."
        },
        {
            key: "rejected-01",
            status: "rejected",
            reason: "DEMO DATA: Demonstration appointment declined by counselor."
        },
        {
            key: "pending-01",
            status: "pending",
            reason: "DEMO DATA: Pending demonstration appointment request."
        },
        {
            key: "pending-02",
            status: "pending",
            reason: "DEMO DATA: Another pending demonstration appointment request."
        },
        {
            key: "confirmed-01",
            status: "confirmed",
            reason: "DEMO DATA: Confirmed demonstration wellness appointment."
        }
    ];

    const seededReasons = new Set(
        existingAppointments
            .filter((a) => (a.reason || "").startsWith("DEMO DATA:"))
            .map((a) => a.reason)
    );

    const reservations = existingAppointments.map((appointment) => ({
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime
    }));

    const plannedSlots = [];
    let inserted = 0;
    let skipped = 0;

    const duration = profile.sessionDuration || 30;
    const mode = profile.consultationMode === "in-person"
        ? "in-person"
        : "online";

    for (const item of demoReasons) {
        if (seededReasons.has(item.reason)) {
            skipped++;
            continue;
        }

        const isFuture = ["pending-01", "pending-02", "confirmed-01"]
            .includes(item.key);

        const slot = findAppointmentSlot({
            profile,
            dayOffset: isFuture ? 1 : -1,
            direction: isFuture ? "future" : "past",
            duration,
            reservations,
            reservedSlots: plannedSlots
        });

        if (!slot) {
            console.log(`No suitable counselor slot found for ${item.key}.`);
            continue;
        }

        await Appointment.create({
            user: user._id,
            counselor: counselor._id,
            counselorProfile: profile._id,
            appointmentDate: slot.appointmentDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationMinutes: duration,
            consultationMode: mode,
            reason: item.reason,
            status: item.status,
            counselorMessage: item.status === "confirmed"
                ? "DEMO DATA: Appointment confirmed for demonstration purposes."
                : item.status === "rejected"
                    ? "DEMO DATA: Demonstration request declined."
                    : ""
        });

        plannedSlots.push(slot);
        inserted++;
    }

    console.log(`Demonstration appointments inserted: ${inserted}`);
    console.log(`Existing demonstration appointments skipped: ${skipped}`);
}

// ======================================
// FINAL DATABASE COUNTS
// ======================================

async function printSummary() {

    const [
        users,
        counselorProfiles,
        moods,
        appointments,
        resources
    ] = await Promise.all([
        User.countDocuments(),
        CounselorProfile.countDocuments(),
        MoodEntry.countDocuments(),
        Appointment.countDocuments(),
        require("./models/Resource").countDocuments({
            isPublished: true
        })
    ]);

    const pendingCounselors = await CounselorProfile.countDocuments({
        isApproved: false,
        isActive: true
    });

    console.log("\n========== DATABASE SUMMARY ==========");
    console.log(`Total user accounts: ${users}`);
    console.log(`Counselor profiles: ${counselorProfiles}`);
    console.log(`Pending active counselor profiles: ${pendingCounselors}`);
    console.log(`Mood journal entries: ${moods}`);
    console.log(`Appointments: ${appointments}`);
    console.log(`Published resources: ${resources}`);
    console.log("======================================");
}

// ======================================
// MAIN SEED FUNCTION
// ======================================

async function seedDemoData() {

    try {

        await connectDatabase();

        const admin = await User.findOne({
            role: "admin",
            isActive: true
        }).select("_id");

        const user = await User.findOne({
            email: "test1@email.com",
            role: "user",
            isActive: true
        });

        const counselor = await User.findOne({
            email: "test2@email.com",
            role: "counselor",
            isActive: true
        });

        if (!admin) {
            throw new Error("Existing active administrator account not found.");
        }

        if (!user) {
            throw new Error("Existing test user account not found.");
        }

        if (!counselor) {
            throw new Error("Existing test counselor account not found.");
        }

        const counselorProfile = await CounselorProfile.findOne({
            user: counselor._id,
            isActive: true
        });

        if (!counselorProfile) {
            throw new Error("Existing active counselor profile not found.");
        }

        console.log("Existing admin, user and counselor accounts verified.");

        await seedMoodEntries(user);

        await seedPendingCounselors();

        await seedAppointments(
            user,
            counselor,
            counselorProfile
        );

        await printSummary();

        console.log("\nDemonstration data seeding completed.");

    } catch (error) {

        console.error("\nDemo seeding failed:", error.message);
        process.exitCode = 1;

    } finally {

        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
    }
}

// ======================================
// EXECUTE
// ======================================

seedDemoData();
