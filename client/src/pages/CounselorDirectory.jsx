
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    Users,
    GraduationCap,
    Languages,
    CalendarDays,
    IndianRupee,
    Search,
    LoaderCircle,
    UserRound,
    Video,
    AlertCircle
} from "lucide-react";

import "./CounselorDirectory.css";

const API_BASE = "/absproxy/5173/api";

export default function CounselorDirectory() {

    const navigate = useNavigate();

    const [counselors, setCounselors] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch approved counselors
    useEffect(() => {

        const controller = new AbortController();

        const loadCounselors = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/counselors`,
                    { signal: controller.signal }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load counselors"
                    );
                }

                setCounselors(data.counselors || []);

            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadCounselors();

        return () => controller.abort();

    }, []);

    // Search by name or specialization
    const filteredCounselors = counselors.filter((counselor) => {

        const name = counselor.user?.name || "";

        const specializations = (
            counselor.specialization || []
        ).join(" ");

        const searchText = `${name} ${specializations}`.toLowerCase();

        return searchText.includes(search.toLowerCase());
    });

    // Open appointment page with selected counselor
    function bookWithCounselor(counselor) {

        navigate(
            `/appointments?counselor=${encodeURIComponent(counselor._id)}`
        );
    }

    return (
        <div className="cd-page">

            {/* Header */}
            <header className="cd-header">

                <Link to="/dashboard" className="cd-back">
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>

                <div className="cd-title-row">

                    <div className="cd-title-icon">
                        <Users size={27} />
                    </div>

                    <div>
                        <h1>Find a Counselor</h1>
                        <p>
                            Explore available counselors and find
                            professional support.
                        </p>
                    </div>

                </div>

            </header>

            {/* Welcome */}
            <section className="cd-welcome">

                <h2>Find the support that feels right for you.</h2>

                <p>
                    Browse approved counselor profiles and learn
                    about their experience, specializations and
                    consultation options.
                </p>

            </section>

            {/* Search */}
            <section className="cd-search-section">

                <div className="cd-search-box">

                    <Search size={20} />

                    <input
                        type="text"
                        placeholder="Search by counselor name or specialization..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                </div>

                <span className="cd-count">
                    {filteredCounselors.length} counselors found
                </span>

            </section>

            {/* Loading */}
            {loading && (
                <div className="cd-state">
                    <LoaderCircle size={30} className="cd-spinner" />
                    <p>Loading counselor profiles...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="cd-state cd-error">
                    <AlertCircle size={28} />
                    <p>{error}</p>

                    <button
                        onClick={() => window.location.reload()}
                        className="cd-retry"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty directory */}
            {!loading && !error && filteredCounselors.length === 0 && (
                <div className="cd-state">

                    <Users size={40} />

                    <h3>
                        {search
                            ? "No matching counselors found"
                            : "No counselors available yet"}
                    </h3>

                    <p>
                        {search
                            ? "Try another name or specialization."
                            : "Approved counselor profiles will appear here."}
                    </p>

                </div>
            )}

            {/* Counselor cards */}
            {!loading && !error && filteredCounselors.length > 0 && (

                <div className="cd-grid">

                    {filteredCounselors.map((counselor) => {

                        const name = counselor.user?.name || "Counselor";

                        const isDemoProfile = (
                            counselor.qualification || ""
                        ).toUpperCase().includes("DEMO PROFILE");

                        return (

                            <article
                                className="cd-card"
                                key={counselor._id}
                            >

                                {/* Card header */}
                                <div className="cd-card-header">

                                    <div className="cd-avatar">

                                        {counselor.profileImage ? (
                                            <img
                                                src={counselor.profileImage}
                                                alt={name}
                                            />
                                        ) : (
                                            <UserRound size={34} />
                                        )}

                                    </div>

                                    <div className="cd-name-area">
                                        <h3>{name}</h3>

                                        <span className="cd-approved">
                                            Approved profile
                                        </span>
                                    </div>

                                </div>

                                {/* Demo profile warning */}
                                {isDemoProfile && (
                                    <div className="cd-demo-warning">
                                        <AlertCircle size={15} />
                                        Demonstration profile — not a verified professional
                                    </div>
                                )}

                                {/* Specializations */}
                                <div className="cd-specializations">

                                    {(counselor.specialization || []).map(
                                        (item, index) => (
                                            <span key={index}>
                                                {item}
                                            </span>
                                        )
                                    )}

                                </div>

                                {/* Information */}
                                <div className="cd-details">

                                    <div className="cd-detail">
                                        <GraduationCap size={18} />
                                        <span>
                                            {counselor.qualification}
                                        </span>
                                    </div>

                                    <div className="cd-detail">
                                        <Languages size={18} />
                                        <span>
                                            {(counselor.languages || []).join(", ") || "Not specified"}
                                        </span>
                                    </div>

                                    <div className="cd-detail">
                                        <CalendarDays size={18} />
                                        <span>
                                            {counselor.experienceYears} years experience
                                        </span>
                                    </div>

                                    <div className="cd-detail">
                                        <Video size={18} />
                                        <span>
                                            {counselor.consultationMode}
                                        </span>
                                    </div>

                                </div>

                                {/* Bio */}
                                <p className="cd-bio">
                                    {counselor.bio}
                                </p>

                                {/* Footer */}
                                <div className="cd-card-footer">

                                    <div className="cd-fee">
                                        <IndianRupee size={17} />

                                        <strong>
                                            {counselor.consultationFee}
                                        </strong>

                                        <span>/ session</span>
                                    </div>

                                    <span className="cd-duration">
                                        {counselor.sessionDuration} min
                                    </span>

                                </div>

                                {/* Booking button */}
                                <button
                                    className="cd-book-button"
                                    type="button"
                                    onClick={() => bookWithCounselor(counselor)}
                                    title={
                                        isDemoProfile
                                            ? "Book a demonstration appointment for testing only."
                                            : "Book an appointment with this counselor."
                                    }
                                >
                                    {isDemoProfile
                                        ? "Book Demo Appointment"
                                        : "Book Appointment"}
                                </button>

                            </article>

                        );
                    })}

                </div>

            )}

            {/* Footer */}
            <footer className="cd-footer">
                MindCare Connect — Your wellbeing matters.
            </footer>

        </div>
    );
}
