
import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";

const APP_BASE = window.location.pathname.startsWith("/proxy/5173")
    ? "/proxy/5173"
    : "";

const API_BASE = "/absproxy/5173/api";

const AuthContext = createContext();

// Safe browser storage functions
const getSavedToken = () => {
    try {
        return localStorage.getItem("token");
    } catch (error) {
        console.warn("Browser storage is unavailable.");
        return null;
    }
};

const saveToken = (token) => {
    try {
        localStorage.setItem("token", token);
    } catch (error) {
        console.warn("Could not save login session.");
    }
};

const removeToken = () => {
    try {
        localStorage.removeItem("token");
    } catch (error) {
        console.warn("Could not clear saved session.");
    }
};

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(getSavedToken);
    const [loading, setLoading] = useState(true);

    const saveSession = (data) => {
        saveToken(data.token);
        setToken(data.token);
        setUser(data.user);
    };

    // Registration
    const register = async (formData) => {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        saveSession(data);
        return data;
    };

    // Login
    const login = async (email, password) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        saveSession(data);
        return data;
    };

    // Logout
    const logout = () => {
        removeToken();
        setToken(null);
        setUser(null);
    };

    // Verify existing session
    useEffect(() => {
        let active = true;

        const verifySession = async () => {
            if (!token) {
                if (active) {
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!active) return;

                if (response.ok && data.success) {
                    setUser(data.user);
                } else {
                    removeToken();
                    setToken(null);
                    setUser(null);
                }

            } catch (error) {
                console.error("Session verification failed:", error);

                if (active) {
                    removeToken();
                    setToken(null);
                    setUser(null);
                }

            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        verifySession();

        return () => {
            active = false;
        };

    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                register,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
