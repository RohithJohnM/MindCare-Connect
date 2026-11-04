import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    Heart,
    LayoutDashboard,
    Smile,
    CalendarDays,
    Users,
    LogOut,
    ArrowUpRight,
    ChevronRight,
    Leaf,
    ShieldCheck,
    Clock,
    BookOpen,
    Bot
} from "lucide-react";

import "./Dashboard.css";

const API_BASE = "/absproxy/5173/api";

async function apiRequest(path, token, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard information.");
    }

    return data;
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const datePart = String(value).slice(0, 10);
    const date = new Date(`${datePart}T12:00:00`);

    if (Number.isNaN(date.getTime())) return datePart;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function Status({ value }) {
    const status = value || "unknown";

    return (
        <span className={`mc-status ${status}`}>
            {status}
        </span>
    );
}

function StatCard({ icon: Icon, color, label, value, description }) {
    return (
        <div className="mc-stat-card">
            <div className={`mc-stat-icon ${color}`}>
                <Icon size={22} />
            </div>
            <div>
                <span>{label}</span>
                <h2>{value}</h2>
                <small>{description}</small>
            </div>
        </div>
    );
}

function EmptyState({ message, icon: Icon = CalendarDays }) {
    return (
        <div className="mc-empty-state compact">
            <Icon size={32} />
            <p>{message}</p>
        </div>
    );
}

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const location = useLocation();

    const role = ["user", "counselor", "admin"].includes(user?.role)
        ? user.role
        : "user";

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [moods, setMoods] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [counselorProfile, setCounselorProfile] = useState(null);
    const [pendingProfiles, setPendingProfiles] = useState([]);
    const [processingId, setProcessingId] = useState("");

    const loadDashboard = useCallback(async (showLoading = true) => {
        if (!token) return;

        if (showLoading) setLoading(true);
        setError("");

        try {
            if (role === "user") {
                const [moodData, appointmentData] = await Promise.all([
                    apiRequest("/mood", token),
                    apiRequest("/appointments/my", token)
                ]);

                setMoods(moodData.entries || []);
                setAppointments(appointmentData.appointments || []);
            } else if (role === "counselor") {
                const [profileData, appointmentData] = await Promise.all([
                    apiRequest("/counselors/me", token),
                    apiRequest("/appointments/counselor", token)
                ]);

                setCounselorProfile(profileData.profile || null);
                setAppointments(appointmentData.appointments || []);
            } else if (role === "admin") {
                const data = await apiRequest(
                    "/counselors/admin/pending",
                    token
                );

                setPendingProfiles(data.profiles || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [token, role]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    async function approveCounselor(profileId) {
        setError("");
        setNotice("");
        setProcessingId(profileId);

        try {
            const data = await apiRequest(
                `/counselors/admin/${profileId}/approval`,
                token,
                {
                    method: "PATCH",
                    body: JSON.stringify({ isApproved: true })
                }
            );

            setNotice(
                data.message ||
                "Counselor approved successfully."
            );

            await loadDashboard(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingId("");
        }
    }

    // Navigation according to logged-in role
    const menuItems = {
        user: [
            {
                label: "Overview",
                icon: LayoutDashboard,
                href: "#overview"
            },
            {
                label: "Mood Journal",
                icon: Smile,
                to: "/mood-journal"
            },
            {
                label: "Appointments",
                icon: CalendarDays,
                to: "/appointments"
            },
            {
                label: "Find Counselors",
                icon: Users,
                to: "/counselors"
            },
            {
                label: "AI Wellness Assistant",
                icon: Bot,
                to: "/ai-assistant"
            },
            {
                label: "Resources",
                icon: BookOpen,
                to: "/resources"
            }
        ],

        counselor: [
            {
                label: "Overview",
                icon: LayoutDashboard,
                href: "#overview"
            },
            {
                label: "Appointments",
                icon: CalendarDays,
                to: "/counselor/appointments"
            },
            {
                label: "Resources",
                icon: BookOpen,
                to: "/resources"
            }
        ],

        admin: [
            {
                label: "Overview",
                icon: LayoutDashboard,
                href: "#overview"
            },
            {
                label: "Counselor Approvals",
                icon: ShieldCheck,
                href: "#approvals"
            },
            {
                label: "Resource Management",
                icon: BookOpen,
                to: "/resources"
            }
        ]
    };

    const pageTitle = {
        user: "Your Wellness Dashboard",
        counselor: "Counselor Dashboard",
        admin: "Administrator Dashboard"
    }[role];

    const roleLabel = {
        user: "Member",
        counselor: "Counselor",
        admin: "Administrator"
    }[role];

    const pendingAppointments = appointments.filter(
        (appointment) => appointment.status === "pending"
    );

    const confirmedAppointments = appointments.filter(
        (appointment) => appointment.status === "confirmed"
    );

    const latestMood = moods[0];

    return (
        <div className="mc-dashboard">

            {/* SIDEBAR */}
            <aside className="mc-sidebar">

                <div className="mc-brand">
                    <div className="mc-brand-icon">
                        <Heart size={23} />
                    </div>
                    <span>MindCare Connect</span>
                </div>

                <p className="mc-sidebar-label">MENU</p>

                <nav className="mc-navigation">
                    {menuItems[role].map((item) => {
                        const Icon = item.icon;

                        const active = item.to
                            ? location.pathname === item.to
                            : item.href === "#approvals"
                                ? location.hash === "#approvals"
                                : location.hash !== "#approvals";

                        if (item.to) {
                            return (
                                <Link
                                    key={item.label}
                                    to={item.to}
                                    className={`mc-nav-link ${active ? "active" : ""}`}
                                >
                                    <Icon size={19} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        }

                        return (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`mc-nav-link ${active ? "active" : ""}`}
                            >
                                <Icon size={19} />
                                <span>{item.label}</span>
                            </a>
                        );
                    })}
                </nav>

                <div className="mc-sidebar-bottom">
                    <div className="mc-support-card">
                        <Heart size={21} />
                        <h4>Your wellbeing matters</h4>
                        <p>
                            MindCare Connect supports wellbeing and access to
                            professional guidance.
                        </p>
                    </div>

                    <button
                        className="mc-logout"
                        onClick={logout}
                        type="button"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="mc-main">

                {/* TOPBAR */}
                <header className="mc-topbar">
                    <div>
                        <p className="mc-date">{today}</p>
                        <p className="mc-topbar-subtitle">{pageTitle}</p>
                    </div>

                    <div className="mc-profile">
                        <div className="mc-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="mc-profile-info">
                            <strong>{user?.name || "User"}</strong>
                            <span>{roleLabel}</span>
                        </div>
                    </div>
                </header>

                {/* WELCOME */}
                <section id="overview" className="mc-welcome">
                    <div>
                        <p className="mc-eyebrow">
                            {role === "admin"
                                ? "PLATFORM MANAGEMENT"
                                : role === "counselor"
                                    ? "COUNSELOR WORKSPACE"
                                    : "YOUR WELLNESS JOURNEY"}
                        </p>

                        <h1>
                            Welcome, {user?.name?.split(" ")[0] || "there"}!
                        </h1>

                        <p>
                            {role === "admin"
                                ? "Review counselor applications and manage platform approvals."
                                : role === "counselor"
                                    ? "Manage your appointment requests and counseling sessions."
                                    : "Take a moment to care for your wellbeing. Every small step matters."}
                        </p>
                    </div>

                    <div className="mc-welcome-art">
                        {role === "admin" ? (
                            <ShieldCheck size={60} />
                        ) : role === "counselor" ? (
                            <Users size={60} />
                        ) : (
                            <Leaf size={60} />
                        )}
                    </div>
                </section>

                {/* MESSAGES */}
                {error && (
                    <div className="mc-dashboard-message error" role="alert">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="mc-dashboard-message success" role="status">
                        {notice}
                    </div>
                )}

                {loading ? (
                    <div className="mc-panel">
                        Loading dashboard information...
                    </div>
                ) : (
                    <>

                        {/* USER DASHBOARD */}
                        {role === "user" && (
                            <>
                                <section className="mc-stats">

                                    <StatCard
                                        icon={Smile}
                                        color="green"
                                        label="Mood Entries"
                                        value={moods.length}
                                        description="Recorded check-ins"
                                    />

                                    <StatCard
                                        icon={CalendarDays}
                                        color="blue"
                                        label="Appointments"
                                        value={appointments.length}
                                        description="Total bookings"
                                    />

                                    <StatCard
                                        icon={Clock}
                                        color="purple"
                                        label="Open Appointments"
                                        value={
                                            pendingAppointments.length +
                                            confirmedAppointments.length
                                        }
                                        description="Pending or confirmed"
                                    />

                                </section>

                                <div className="mc-content-grid">

                                    {/* LATEST MOOD */}
                                    <section className="mc-panel">
                                        <div className="mc-panel-heading">
                                            <div>
                                                <p className="mc-eyebrow">
                                                    MOOD TRACKING
                                                </p>
                                                <h2>Your latest check-in</h2>
                                            </div>
                                            <Smile size={24} />
                                        </div>

                                        {latestMood ? (
                                            <div className="mc-data-content">
                                                <h3 className="mc-highlight">
                                                    {String(latestMood.mood).toUpperCase()}
                                                </h3>

                                                <p>
                                                    Intensity: {latestMood.intensity}/5
                                                </p>

                                                <p>
                                                    Date: {formatDate(
                                                        latestMood.entryDate ||
                                                        latestMood.createdAt
                                                    )}
                                                </p>

                                                {latestMood.note && (
                                                    <p>{latestMood.note}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                icon={Smile}
                                                message="No mood entries recorded yet."
                                            />
                                        )}

                                        <Link
                                            to="/mood-journal"
                                            className="mc-text-link"
                                        >
                                            Open Mood Journal
                                            <ChevronRight size={17} />
                                        </Link>
                                    </section>

                                    {/* APPOINTMENTS */}
                                    <section className="mc-panel">
                                        <div className="mc-panel-heading">
                                            <div>
                                                <p className="mc-eyebrow">
                                                    YOUR SESSIONS
                                                </p>
                                                <h2>Appointments</h2>
                                            </div>
                                            <CalendarDays size={24} />
                                        </div>

                                        <div className="mc-data-content">
                                            <p>
                                                Pending:{" "}
                                                <strong>
                                                    {pendingAppointments.length}
                                                </strong>
                                            </p>

                                            <p>
                                                Confirmed:{" "}
                                                <strong>
                                                    {confirmedAppointments.length}
                                                </strong>
                                            </p>
                                        </div>

                                        <Link
                                            to="/appointments"
                                            className="mc-text-link"
                                        >
                                            Manage appointments
                                            <ChevronRight size={17} />
                                        </Link>
                                    </section>

                                </div>

                                {/* RECENT APPOINTMENTS */}
                                <section className="mc-discover-section">
                                    <div className="mc-section-heading">
                                        <h2>Recent appointments</h2>
                                        <CalendarDays size={23} />
                                    </div>

                                    {appointments.length === 0 ? (
                                        <EmptyState message="You have not booked any appointments yet." />
                                    ) : (
                                        <div className="mc-record-list">
                                            {appointments.slice(0, 4).map((appointment) => (
                                                <div
                                                    className="mc-record"
                                                    key={appointment._id}
                                                >
                                                    <div>
                                                        <strong>
                                                            {appointment.counselor?.name || "Counselor"}
                                                        </strong>
                                                        <p>
                                                            {formatDate(appointment.appointmentDate)}
                                                            {" · "}
                                                            {appointment.startTime}
                                                        </p>
                                                    </div>

                                                    <Status value={appointment.status} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* COUNSELOR ACCESS */}
                                <section className="mc-discover-section">
                                    <div className="mc-section-heading">
                                        <h2>Professional support</h2>
                                        <Users size={24} />
                                    </div>

                                    <div className="mc-discover-card">
                                        <div className="mc-discover-icon">
                                            <Users size={27} />
                                        </div>

                                        <div>
                                            <h3>Find a counselor</h3>
                                            <p>
                                                Explore available counselor profiles
                                                and request an appointment.
                                            </p>
                                        </div>

                                        <Link
                                            to="/counselors"
                                            className="mc-text-link"
                                        >
                                            Explore
                                            <ChevronRight size={17} />
                                        </Link>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* COUNSELOR DASHBOARD */}
                        {role === "counselor" && (
                            <>
                                <section className="mc-stats">

                                    <StatCard
                                        icon={CalendarDays}
                                        color="blue"
                                        label="Total Appointments"
                                        value={appointments.length}
                                        description="All appointment requests"
                                    />

                                    <StatCard
                                        icon={Clock}
                                        color="purple"
                                        label="Pending Requests"
                                        value={pendingAppointments.length}
                                        description="Awaiting your response"
                                    />

                                    <StatCard
                                        icon={Users}
                                        color="green"
                                        label="Confirmed Sessions"
                                        value={confirmedAppointments.length}
                                        description="Accepted appointments"
                                    />

                                </section>

                                {/* COUNSELOR PROFILE */}
                                <section className="mc-panel mc-role-panel">
                                    <div className="mc-panel-heading">
                                        <div>
                                            <p className="mc-eyebrow">
                                                PROFESSIONAL PROFILE
                                            </p>
                                            <h2>Profile approval</h2>
                                        </div>
                                        <ShieldCheck size={25} />
                                    </div>

                                    {counselorProfile ? (
                                        <div className="mc-data-content">
                                            <p>
                                                <strong>Qualification:</strong>{" "}
                                                {counselorProfile.qualification || "Not provided"}
                                            </p>

                                            <p>
                                                <strong>Specialization:</strong>{" "}
                                                {(counselorProfile.specialization || []).join(", ") || "Not provided"}
                                            </p>

                                            <p>
                                                <strong>Approval status:</strong>{" "}
                                                <Status
                                                    value={
                                                        counselorProfile.isApproved
                                                            ? "approved"
                                                            : "pending"
                                                    }
                                                />
                                            </p>

                                            <p className="mc-muted">
                                                Profile changes require administrator approval.
                                            </p>
                                        </div>
                                    ) : (
                                        <EmptyState message="No counselor profile has been created yet." />
                                    )}
                                </section>

                                {/* COUNSELOR APPOINTMENTS */}
                                <section className="mc-discover-section">
                                    <div className="mc-section-heading">
                                        <h2>Appointment requests</h2>
                                        <CalendarDays size={23} />
                                    </div>

                                    {appointments.length === 0 ? (
                                        <EmptyState message="No appointment requests received yet." />
                                    ) : (
                                        <div className="mc-record-list">
                                            {appointments.slice(0, 5).map((appointment) => (
                                                <div
                                                    className="mc-record"
                                                    key={appointment._id}
                                                >
                                                    <div>
                                                        <strong>
                                                            {appointment.user?.name || "User"}
                                                        </strong>
                                                        <p>
                                                            {formatDate(appointment.appointmentDate)}
                                                            {" · "}
                                                            {appointment.startTime}
                                                        </p>
                                                    </div>

                                                    <Status value={appointment.status} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Link
                                        to="/counselor/appointments"
                                        className="mc-primary-button"
                                    >
                                        Manage appointments
                                        <ArrowUpRight size={17} />
                                    </Link>
                                </section>
                            </>
                        )}

                        {/* ADMIN DASHBOARD */}
                        {role === "admin" && (
                            <>
                                <section className="mc-stats mc-stats-single">
                                    <StatCard
                                        icon={ShieldCheck}
                                        color="green"
                                        label="Pending Approvals"
                                        value={pendingProfiles.length}
                                        description="Counselor profiles awaiting review"
                                    />
                                </section>

                                {/* COUNSELOR APPROVALS */}
                                <section
                                    id="approvals"
                                    className="mc-discover-section"
                                >
                                    <div className="mc-section-heading">
                                        <div>
                                            <p className="mc-eyebrow">
                                                COUNSELOR MANAGEMENT
                                            </p>
                                            <h2>Pending counselor approvals</h2>
                                        </div>
                                        <ShieldCheck size={24} />
                                    </div>

                                    {pendingProfiles.length === 0 ? (
                                        <EmptyState message="There are no counselor profiles waiting for approval." />
                                    ) : (
                                        <div className="mc-record-list">
                                            {pendingProfiles.map((profile) => (
                                                <div
                                                    className="mc-approval-card"
                                                    key={profile._id}
                                                >
                                                    <div className="mc-approval-details">
                                                        <h3>
                                                            {profile.user?.name || "Counselor applicant"}
                                                        </h3>

                                                        <p>
                                                            {profile.user?.email || ""}
                                                        </p>

                                                        <p>
                                                            <strong>Qualification:</strong>{" "}
                                                            {profile.qualification || "Not provided"}
                                                        </p>

                                                        <p>
                                                            <strong>Specialization:</strong>{" "}
                                                            {(profile.specialization || []).join(", ") || "Not provided"}
                                                        </p>

                                                        <p>
                                                            <strong>Experience:</strong>{" "}
                                                            {profile.experienceYears ?? 0} years
                                                        </p>

                                                        {profile.bio && <p>{profile.bio}</p>}

                                                        <Status value="pending" />
                                                    </div>

                                                    <div className="mc-approval-actions">
                                                        <button
                                                            type="button"
                                                            className="mc-primary-button"
                                                            disabled={processingId === profile._id}
                                                            onClick={() => approveCounselor(profile._id)}
                                                        >
                                                            {processingId === profile._id
                                                                ? "Approving..."
                                                                : "Approve counselor"}
                                                            <ShieldCheck size={17} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                    </>
                )}

                <footer className="mc-footer">
                    <Heart size={15} />
                    MindCare Connect — Your wellbeing matters.
                    <span>© 2026</span>
                </footer>

            </main>
        </div>
    );
}