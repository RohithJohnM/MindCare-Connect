import "./Auth.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart,
    Mail,
    Lock,
    User,
    Phone,
    Eye,
    EyeOff,
    ArrowRight
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Auth() {

    const [isLogin, setIsLogin] = useState(true);

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    const navigate = useNavigate();


    // Handle input changes
    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    // Handle login and registration
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        if (!isLogin && !formData.name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!isLogin && formData.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        try {

            setLoading(true);

            let result;

            if (isLogin) {

                result = await login(
                    formData.email,
                    formData.password
                );

            } else {

                result = await register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone
                });

            }

            // Redirect according to account role
            const role = result.user.role;

            if (role === "admin") {
                navigate("/admin/dashboard");
            } else if (role === "counselor") {
                navigate("/counselor/dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }

    };


    // Switch between login and registration
    const switchMode = () => {

        setIsLogin(!isLogin);
        setError("");

        setFormData({
            name: "",
            email: "",
            password: "",
            phone: ""
        });

    };


    return (

        <div className="auth-page">

            {/* Left Section */}

            <div className="auth-left">

                <div className="brand">
                    <div className="brand-icon">
                        <Heart size={24} />
                    </div>

                    <span>MindCare Connect</span>
                </div>


                <div className="auth-hero">

                    <p className="hero-label">
                        YOUR WELLNESS MATTERS
                    </p>

                    <h1>
                        A healthier mind
                        <br />
                        begins with
                        <br />
                        <span>one small step.</span>
                    </h1>

                    <p className="hero-description">
                        Find support, explore wellness resources
                        and connect with professionals on your
                        journey towards better mental wellbeing.
                    </p>

                    <div className="hero-note">
                        <Heart size={19} />
                        <span>
                            You deserve care, support and understanding.
                        </span>
                    </div>

                </div>

                <p className="left-footer">
                    MindCare Connect © 2026
                </p>

            </div>


            {/* Right Section */}

            <div className="auth-right">

                <div className="auth-card">

                    <div className="mobile-brand">
                        <Heart size={23} />
                        MindCare Connect
                    </div>

                    <div className="welcome-text">

                        <span className="welcome-label">
                            {isLogin ? "WELCOME BACK" : "GET STARTED"}
                        </span>

                        <h2>
                            {isLogin
                                ? "Sign in to your account"
                                : "Create your account"
                            }
                        </h2>

                        <p>
                            {isLogin
                                ? "Continue your wellness journey with us."
                                : "Take your first step towards better wellbeing."
                            }
                        </p>

                    </div>


                    {/* Authentication Form */}

                    <form onSubmit={handleSubmit}>

                        {!isLogin && (

                            <>

                                <label>Full Name</label>

                                <div className="input-group">
                                    <User size={19} />

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>


                                <label>Phone Number (Optional)</label>

                                <div className="input-group">
                                    <Phone size={19} />

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                            </>

                        )}


                        <label>Email Address</label>

                        <div className="input-group">
                            <Mail size={19} />

                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>


                        <label>Password</label>

                        <div className="input-group">
                            <Lock size={19} />

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword
                                    ? <EyeOff size={19} />
                                    : <Eye size={19} />
                                }
                            </button>

                        </div>


                        {error && (

                            <div className="auth-error" role="alert">
                                {error}
                            </div>

                        )}


                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Please wait..."
                                : isLogin
                                    ? "Sign In"
                                    : "Create Account"
                            }

                            {!loading && <ArrowRight size={19} />}

                        </button>

                    </form>


                    <div className="auth-switch">

                        {isLogin
                            ? "Don't have an account?"
                            : "Already have an account?"
                        }

                        <button
                            type="button"
                            onClick={switchMode}
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>

                    </div>


                    <div className="auth-disclaimer">

                        <Heart size={17} />

                        <p>
                            MindCare Connect offers wellness support
                            and resources. It is not a replacement
                            for professional mental-health care.
                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Auth;