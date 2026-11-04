
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Bot,
    Send,
    Sparkles,
    BookOpen,
    ShieldAlert,
    LoaderCircle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./AIWellnessAssistant.css";

const API_BASE = "/absproxy/5173/api";

export default function AIWellnessAssistant() {
    const { token } = useAuth();

    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            text: "Hello! I'm your MindCare wellness assistant. You can share what's on your mind, and I'll try to offer supportive suggestions and useful wellness resources."
        }
    ]);

    const [input, setInput] = useState("");
    const [consent, setConsent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const nextMessageId = useRef(2);

    const sendMessage = async (event) => {
        event.preventDefault();

        const messageText = input.trim();

        if (!messageText || sending) return;

        if (!consent) {
            setError("Please provide consent before using the AI assistant.");
            return;
        }

        if (!token) {
            setError("Your login session has expired. Please log in again.");
            return;
        }

        setError("");
        setSending(true);
        setInput("");

        const userMessage = {
            id: nextMessageId.current++,
            role: "user",
            text: messageText
        };

        setMessages((previous) => [...previous, userMessage]);

        try {
            const response = await fetch(
                `${API_BASE}/ai/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: messageText,
                        consent: true
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to get an AI response."
                );
            }

            if (!data.reply) {
                throw new Error("The AI returned an empty response.");
            }

            const assistantMessage = {
                id: nextMessageId.current++,
                role: "assistant",
                text: data.reply,
                sentiment: data.sentiment || "",
                crisisDetected: Boolean(data.crisisDetected),
                recommendations: Array.isArray(data.recommendations)
                    ? data.recommendations
                    : []
            };

            setMessages((previous) => [
                ...previous,
                assistantMessage
            ]);

        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="ai-page">

            {/* Header */}
            <header className="ai-header">
                <Link to="/dashboard" className="ai-back-link">
                    <ArrowLeft size={18} />
                    Dashboard
                </Link>

                <div className="ai-header-brand">
                    <div className="ai-logo">
                        <Bot size={25} />
                    </div>

                    <div>
                        <h1>AI Wellness Assistant</h1>
                        <p>Your supportive wellness companion</p>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="ai-main">

                <section className="ai-intro">
                    <div className="ai-intro-icon">
                        <Sparkles size={25} />
                    </div>

                    <div>
                        <h2>A safe space to share</h2>
                        <p>
                            Talk about how you're feeling and receive
                            supportive suggestions and relevant wellness
                            resources.
                        </p>
                    </div>
                </section>

                {/* Chat area */}
                <section className="ai-chat-card">

                    <div className="ai-chat-heading">
                        <div>
                            <h2>
                                <Bot size={20} />
                                MindCare Assistant
                            </h2>

                            <span className="ai-online-status">
                                AI-powered support
                            </span>
                        </div>

                        <span className="ai-status-dot"></span>
                    </div>

                    <div className="ai-messages" aria-live="polite">

                        {messages.map((message) => (

                            <div
                                key={message.id}
                                className={`ai-message-row ${message.role}`}
                            >

                                {message.role === "assistant" && (
                                    <div className="ai-message-avatar">
                                        <Bot size={19} />
                                    </div>
                                )}

                                <div className="ai-message-content">

                                    <div className="ai-message-bubble">
                                        <p>{message.text}</p>
                                    </div>

                                    {message.sentiment && (
                                        <div className="ai-sentiment">
                                            Detected sentiment:{" "}
                                            <strong>{message.sentiment}</strong>
                                        </div>
                                    )}

                                    {message.crisisDetected && (
                                        <div className="ai-crisis-notice">
                                            <ShieldAlert size={19} />

                                            <p>
                                                Please take this situation
                                                seriously. Consider reaching
                                                out to a trusted person or
                                                appropriate professional support.
                                                If you are in immediate danger,
                                                contact local emergency services.
                                            </p>
                                        </div>
                                    )}

                                    {message.recommendations?.length > 0 && (
                                        <div className="ai-recommendations">

                                            <h3>
                                                <BookOpen size={17} />
                                                Recommended Resources
                                            </h3>

                                            {message.recommendations.map(
                                                (resource) => (
                                                    <div
                                                        key={resource._id}
                                                        className="ai-resource-card"
                                                    >
                                                        <span>
                                                            {resource.category}
                                                        </span>

                                                        <h4>
                                                            {resource.title}
                                                        </h4>

                                                        <p>
                                                            {resource.summary}
                                                        </p>
                                                    </div>
                                                )
                                            )}

                                            <Link
                                                to="/resources"
                                                className="ai-resource-link"
                                            >
                                                Explore Resource Library
                                                →
                                            </Link>
                                        </div>
                                    )}

                                </div>
                            </div>

                        ))}

                        {sending && (
                            <div className="ai-typing">
                                <LoaderCircle size={18} className="ai-spinner" />
                                Gemini is preparing a response...
                            </div>
                        )}

                    </div>

                    {/* Consent */}
                    <div className="ai-consent">
                        <label>
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(event) =>
                                    setConsent(event.target.checked)
                                }
                            />

                            <span>
                                I agree that the message I type will be sent
                                to Google's Gemini AI service to generate a
                                response. My saved mood-journal history is
                                not automatically included.
                            </span>
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="ai-error">
                            {error}
                        </div>
                    )}

                    {/* Message input */}
                    <form
                        className="ai-input-area"
                        onSubmit={sendMessage}
                    >
                        <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={
                                consent
                                    ? "Share what's on your mind..."
                                    : "Please provide consent before chatting..."
                            }
                            maxLength={2000}
                            rows={2}
                            disabled={sending}
                            aria-label="Your message"
                        />

                        <button
                            type="submit"
                            disabled={
                                sending ||
                                !input.trim() ||
                                !consent
                            }
                            aria-label="Send message"
                        >
                            {sending ? (
                                <LoaderCircle size={20} className="ai-spinner" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </form>

                    <div className="ai-input-footer">
                        <span>Maximum 2000 characters</span>
                        <span>{input.length}/2000</span>
                    </div>

                </section>

                {/* Disclaimer */}
                <section className="ai-disclaimer">
                    <ShieldAlert size={20} />

                    <p>
                        <strong>Important:</strong> This assistant provides
                        general wellness support and is not a substitute
                        for professional mental healthcare, diagnosis or
                        emergency services.
                    </p>
                </section>

            </main>
        </div>
    );
}
