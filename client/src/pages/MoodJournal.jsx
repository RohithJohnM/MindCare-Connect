
import React, {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext";

import {
    Heart,
    Smile,
    Meh,
    Frown,
    Trash2,
    Save,
    ArrowLeft,
    LoaderCircle
} from "lucide-react";

import "./MoodJournal.css";


// Available moods
const moodOptions = [

    {
        value: "great",
        label: "Great",
        emoji: "😁",
        icon: Smile
    },

    {
        value: "good",
        label: "Good",
        emoji: "😊",
        icon: Smile
    },

    {
        value: "okay",
        label: "Okay",
        emoji: "😐",
        icon: Meh
    },

    {
        value: "low",
        label: "Low",
        emoji: "😔",
        icon: Frown
    },

    {
        value: "anxious",
        label: "Anxious",
        emoji: "😟",
        icon: Meh
    },

    {
        value: "stressed",
        label: "Stressed",
        emoji: "😣",
        icon: Frown
    }

];


// Detect ByteXL API prefix
const API_BASE = "/absproxy/5173/api";


export default function MoodJournal() {

    const { user, token } = useAuth();


    // Form state
    const [mood, setMood] = useState("");

    const [intensity, setIntensity] = useState(3);

    const [note, setNote] = useState("");


    // Journal state
    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // LOAD MOOD HISTORY
    useEffect(() => {

        let active = true;

        const loadEntries = async () => {

            if (!token) {

                if (active) {

                    setError(
                        "Please log in to access your mood journal."
                    );

                    setLoading(false);

                }

                return;
            }

            try {

                setLoading(true);

                const response = await fetch(
                    `${API_BASE}/mood`,
                    {
                        method: "GET",

                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message || "Unable to load mood history"
                    );

                }

                if (active) {
                    setEntries(data.entries || []);
                    setError("");
                }

            } catch (err) {

                if (active) {
                    setError(err.message);
                }

            } finally {

                if (active) {
                    setLoading(false);
                }

            }

        };

        loadEntries();

        return () => {
            active = false;
        };

    }, [token]);


    // SAVE MOOD ENTRY
    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (!mood) {

            setError("Please select your mood first.");

            return;

        }


        setSaving(true);


        try {

            const response = await fetch(
                `${API_BASE}/mood`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        mood,
                        intensity,
                        note
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Unable to save mood"
                );

            }


            // Add the newly saved entry to history
            setEntries((previous) => [
                data.entry,
                ...previous
            ]);


            // Reset the form
            setMood("");

            setIntensity(3);

            setNote("");


            setSuccess(
                "Your mood entry was saved successfully!"
            );

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);

        }

    };


    // DELETE MOOD ENTRY
    const handleDelete = async (entryId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this mood entry?"
        );

        if (!confirmed) return;


        setError("");

        setSuccess("");


        try {

            const response = await fetch(
                `${API_BASE}/mood/${entryId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Unable to delete mood entry"
                );

            }


            // Remove deleted entry from the UI
            setEntries((previous) =>
                previous.filter(
                    (entry) => entry._id !== entryId
                )
            );


            setSuccess(
                "Mood entry deleted successfully."
            );

        } catch (err) {

            setError(err.message);

        }

    };


    // FORMAT ENTRY DATE
    const formatDate = (date) => {

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });

    };


    return (

        <div className="mj-page">


            {/* PAGE HEADER */}
            <header className="mj-header">


                <Link
                    to="/dashboard"
                    className="mj-back"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>


                <div className="mj-heading">

                    <div className="mj-heading-icon">
                        <Heart size={25} />
                    </div>


                    <div>

                        <h1>
                            My Mood Journal
                        </h1>

                        <p>
                            Your feelings matter. Take a moment for yourself.
                        </p>

                    </div>

                </div>

            </header>


            {/* WELCOME SECTION */}
            <section className="mj-welcome">

                <h2>
                    Hello, {user?.name?.split(" ")[0] || "there"}!
                </h2>

                <p>
                    Every feeling is valid. Record how you feel today
                    and reflect on your emotional wellbeing.
                </p>

            </section>


            {/* MOOD ENTRY FORM */}
            <section className="mj-form-card">


                <div className="mj-section-title">

                    <div>

                        <span>
                            DAILY CHECK-IN
                        </span>

                        <h2>
                            How are you feeling today?
                        </h2>

                    </div>


                    <Smile size={28} />

                </div>


                <form onSubmit={handleSubmit}>


                    {/* MOOD SELECTION */}
                    <label className="mj-label">
                        Select your current mood
                    </label>


                    <div className="mj-mood-options">

                        {moodOptions.map((option) => (

                            <button
                                key={option.value}
                                type="button"
                                className={`mj-mood-option ${
                                    mood === option.value
                                        ? "selected"
                                        : ""
                                }`}
                                aria-pressed={mood === option.value}
                                onClick={() => setMood(option.value)}
                            >

                                <span>
                                    {option.emoji}
                                </span>

                                <small>
                                    {option.label}
                                </small>

                            </button>

                        ))}

                    </div>


                    {/* INTENSITY */}
                    <label className="mj-label">
                        How intense is this feeling?
                    </label>


                    <div className="mj-intensity">

                        <div className="mj-intensity-value">
                            {intensity} / 5
                        </div>


                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={intensity}
                            aria-label="Mood intensity"
                            onChange={(event) =>
                                setIntensity(
                                    Number(event.target.value)
                                )
                            }
                        />


                        <div className="mj-range-labels">

                            <span>
                                Very mild
                            </span>

                            <span>
                                Very strong
                            </span>

                        </div>

                    </div>


                    {/* PERSONAL NOTE */}
                    <label
                        className="mj-label"
                        htmlFor="mood-note"
                    >
                        Personal reflection (optional)
                    </label>


                    <textarea
                        id="mood-note"
                        placeholder="What made you feel this way today?"
                        value={note}
                        onChange={(event) =>
                            setNote(event.target.value)
                        }
                        maxLength={1000}
                        rows={4}
                    />


                    <div className="mj-character-count">
                        {note.length}/1000 characters
                    </div>


                    {/* ERROR MESSAGE */}
                    {error && (

                        <div
                            className="mj-message error"
                            role="alert"
                        >
                            {error}
                        </div>

                    )}


                    {/* SUCCESS MESSAGE */}
                    {success && (

                        <div
                            className="mj-message success"
                            role="status"
                        >
                            {success}
                        </div>

                    )}


                    {/* SAVE BUTTON */}
                    <button
                        type="submit"
                        className="mj-save-button"
                        disabled={saving || !token}
                    >

                        {saving ? (

                            <>
                                <LoaderCircle size={18} />
                                Saving...
                            </>

                        ) : (

                            <>
                                <Save size={18} />
                                Save Mood Entry
                            </>

                        )}

                    </button>

                </form>

            </section>


            {/* MOOD HISTORY */}
            <section className="mj-history">


                <div className="mj-history-heading">

                    <div>

                        <span>
                            YOUR JOURNEY
                        </span>

                        <h2>
                            Mood History
                        </h2>

                    </div>


                    <div className="mj-entry-count">
                        {entries.length} Entries
                    </div>

                </div>


                {/* LOADING */}
                {loading ? (

                    <div className="mj-empty">

                        <LoaderCircle size={28} />

                        <p>
                            Loading your mood history...
                        </p>

                    </div>

                ) : entries.length === 0 ? (

                    /* EMPTY HISTORY */
                    <div className="mj-empty">

                        <Heart size={35} />

                        <h3>
                            No entries yet
                        </h3>

                        <p>
                            Your saved mood entries will appear here.
                        </p>

                    </div>

                ) : (

                    /* SAVED ENTRIES */
                    <div className="mj-entry-list">

                        {entries.map((entry) => {

                            const selectedMood = moodOptions.find(
                                (item) => item.value === entry.mood
                            );


                            return (

                                <article
                                    className="mj-entry"
                                    key={entry._id}
                                >


                                    <div className="mj-entry-emoji">
                                        {selectedMood?.emoji || "😊"}
                                    </div>


                                    <div className="mj-entry-content">


                                        <div className="mj-entry-top">

                                            <h3>
                                                {selectedMood?.label || entry.mood}
                                            </h3>

                                            <span>
                                                {formatDate(entry.entryDate)}
                                            </span>

                                        </div>


                                        <p>
                                            Intensity: {entry.intensity}/5
                                        </p>


                                        {entry.note && (

                                            <div className="mj-entry-note">
                                                {entry.note}
                                            </div>

                                        )}

                                    </div>


                                    {/* DELETE BUTTON */}
                                    <button
                                        type="button"
                                        className="mj-delete"
                                        title="Delete entry"
                                        aria-label="Delete mood entry"
                                        onClick={() =>
                                            handleDelete(entry._id)
                                        }
                                    >
                                        <Trash2 size={18} />
                                    </button>


                                </article>

                            );

                        })}

                    </div>

                )}

            </section>


            {/* FOOTER */}
            <footer className="mj-footer">

                <Heart size={15} />

                MindCare Connect — Every feeling matters.

            </footer>

        </div>

    );

}
