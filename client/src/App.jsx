
import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    AuthProvider,
    useAuth
} from "./context/AuthContext";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MoodJournal from "./pages/MoodJournal";
import CounselorDirectory from "./pages/CounselorDirectory";
import Appointments from "./pages/Appointments";
import ResourceLibrary from "./pages/ResourceLibrary";
import AIWellnessAssistant from "./pages/AIWellnessAssistant";

// Detect ByteXL preview path
const APP_BASE = window.location.pathname.startsWith("/absproxy/5173")
    ? "/absproxy/5173"
    : window.location.pathname.startsWith("/proxy/5173")
        ? "/proxy/5173"
        : "/";

// Redirect according to user role
function getDashboardPath(role) {
    if (role === "admin") return "/admin/dashboard";
    if (role === "counselor") return "/counselor/dashboard";
    return "/dashboard";
}

// Protected route
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "40px" }}>
                Loading MindCare Connect...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <Navigate
                to={getDashboardPath(user.role)}
                replace
            />
        );
    }

    return children;
}

// Application routes
function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "40px" }}>
                Loading MindCare Connect...
            </div>
        );
    }

    return (
        <Routes>

            <Route
                path="/"
                element={
                    <Navigate
                        to={
                            user
                                ? getDashboardPath(user.role)
                                : "/login"
                        }
                        replace
                    />
                }
            />

            <Route
                path="/login"
                element={
                    user
                        ? <Navigate to={getDashboardPath(user.role)} replace />
                        : <Auth />
                }
            />

            <Route
                path="/register"
                element={
                    user
                        ? <Navigate to={getDashboardPath(user.role)} replace />
                        : <Auth />
                }
            />

            {/* User dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["user"]}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Mood Journal */}
            <Route
                path="/mood-journal"
                element={
                    <ProtectedRoute allowedRoles={["user"]}>
                        <MoodJournal />
                    </ProtectedRoute>
                }
            />

            {/* Counselor Directory */}
            <Route
                path="/counselors"
                element={
                    <ProtectedRoute allowedRoles={["user"]}>
                        <CounselorDirectory />
                    </ProtectedRoute>
                }
            />

            {/* User Appointments */}
            <Route
                path="/appointments"
                element={
                    <ProtectedRoute allowedRoles={["user"]}>
                        <Appointments />
                    </ProtectedRoute>
                }
            />

            {/* AI Wellness Assistant */}
            <Route
                path="/ai-assistant"
                element={
                    <ProtectedRoute allowedRoles={["user"]}>
                        <AIWellnessAssistant />
                    </ProtectedRoute>
                }
            />

            {/* Counselor dashboard */}
            <Route
                path="/counselor/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["counselor"]}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Counselor Appointment Management */}
            <Route
                path="/counselor/appointments"
                element={
                    <ProtectedRoute allowedRoles={["counselor"]}>
                        <Appointments />
                    </ProtectedRoute>
                }
            />

            {/* Admin dashboard */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Resource Library */}
            <Route
                path="/resources"
                element={
                    <ProtectedRoute allowedRoles={["user", "counselor", "admin"]}>
                        <ResourceLibrary />
                    </ProtectedRoute>
                }
            />

            {/* Invalid routes */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>
    );
}

// Main application
export default function App() {
    return (
        <BrowserRouter basename={APP_BASE}>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
