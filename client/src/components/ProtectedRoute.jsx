
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {

    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                Loading MindCare Connect...
            </div>
        );
    }

    // Redirect unauthenticated users
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check user permissions
    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
