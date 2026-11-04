
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    BookOpen,
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    ArrowLeft,
    Save,
    Eye
} from "lucide-react";
import "./ResourceLibrary.css";

const API_BASE = "/absproxy/5173/api";

const CATEGORIES = [
    "Stress Management",
    "Anxiety",
    "Mindfulness",
    "Sleep",
    "Self Care",
    "Emotional Wellness"
];

const EMPTY_FORM = {
    title: "",
    category: "Mindfulness",
    summary: "",
    content: "",
    tags: "",
    isPublished: true
};

async function apiRequest(path, token, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Resource request failed.");
    }

    return data;
}

export default function ResourceLibrary() {
    const { user, token } = useAuth();
    const isAdmin = user?.role === "admin";

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [category, setCategory] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const [selectedResource, setSelectedResource] = useState(null);

    const loadResources = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (category) params.set("category", category);
            if (search.trim()) params.set("search", search.trim());

            const query = params.toString();
            const path = `/resources${query ? `?${query}` : ""}`;

            const data = await apiRequest(path, token);
            setResources(data.resources || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, category, search]);

    useEffect(() => {
        loadResources();
    }, [loadResources]);

    function updateForm(event) {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function openEditForm(resource) {
        setEditingId(resource._id);

        setForm({
            title: resource.title || "",
            category: resource.category || "Mindfulness",
            summary: resource.summary || "",
            content: resource.content || "",
            tags: (resource.tags || []).join(", "),
            isPublished: resource.isPublished !== false
        });

        setError("");
        setNotice("");
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    async function submitResource(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setNotice("");

        const payload = {
            title: form.title.trim(),
            category: form.category,
            summary: form.summary.trim(),
            content: form.content.trim(),
            tags: form.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            isPublished: form.isPublished
        };

        try {
            const path = editingId
                ? `/resources/${editingId}`
                : "/resources";

            const data = await apiRequest(path, token, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });

            setNotice(
                data.message ||
                (editingId
                    ? "Resource updated successfully."
                    : "Resource created successfully.")
            );

            closeForm();
            await loadResources();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteResource(resource) {
        const confirmed = window.confirm(
            `Delete "${resource.title}" permanently?`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            const data = await apiRequest(
                `/resources/${resource._id}`,
                token,
                { method: "DELETE" }
            );

            setNotice(data.message || "Resource deleted successfully.");

            if (selectedResource?._id === resource._id) {
                setSelectedResource(null);
            }

            await loadResources();
        } catch (err) {
            setError(err.message);
        }
    }

    function applySearch(event) {
        event.preventDefault();
        setSearch(searchInput);
    }

    function clearFilters() {
        setCategory("");
        setSearchInput("");
        setSearch("");
    }

    return (
        <div className="rl-page">

            <header className="rl-header">
                <div>
                    <Link to="/" className="rl-back">
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <div className="rl-heading">
                        <div className="rl-heading-icon">
                            <BookOpen size={26} />
                        </div>

                        <div>
                            <p className="rl-eyebrow">MINDCARE CONNECT</p>
                            <h1>Wellness Resource Library</h1>
                            <p>
                                Explore helpful information and practical
                                activities for your wellbeing.
                            </p>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        className="rl-button primary"
                        type="button"
                        onClick={openCreateForm}
                    >
                        <Plus size={18} />
                        Add Resource
                    </button>
                )}
            </header>

            {error && (
                <div className="rl-message error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <div className="rl-message success" role="status">
                    {notice}
                </div>
            )}

            {/* ADMIN RESOURCE FORM */}
            {isAdmin && showForm && (
                <section className="rl-form-card">
                    <div className="rl-form-heading">
                        <h2>{editingId ? "Edit Resource" : "Add New Resource"}</h2>

                        <button
                            type="button"
                            className="rl-icon-button"
                            onClick={closeForm}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={submitResource}>
                        <div className="rl-form-grid">

                            <div className="rl-field full">
                                <label htmlFor="resource-title">
                                    Resource title
                                </label>
                                <input
                                    id="resource-title"
                                    name="title"
                                    value={form.title}
                                    onChange={updateForm}
                                    minLength={3}
                                    maxLength={150}
                                    required
                                    placeholder="Enter resource title"
                                />
                            </div>

                            <div className="rl-field">
                                <label htmlFor="resource-category">
                                    Category
                                </label>
                                <select
                                    id="resource-category"
                                    name="category"
                                    value={form.category}
                                    onChange={updateForm}
                                    required
                                >
                                    {CATEGORIES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rl-field">
                                <label htmlFor="resource-tags">
                                    Tags
                                </label>
                                <input
                                    id="resource-tags"
                                    name="tags"
                                    value={form.tags}
                                    onChange={updateForm}
                                    placeholder="breathing, calm, wellness"
                                />
                                <small>Separate tags with commas.</small>
                            </div>

                            <div className="rl-field full">
                                <label htmlFor="resource-summary">
                                    Summary
                                </label>
                                <textarea
                                    id="resource-summary"
                                    name="summary"
                                    value={form.summary}
                                    onChange={updateForm}
                                    maxLength={300}
                                    required
                                    placeholder="Write a short resource summary"
                                    rows={3}
                                />
                            </div>

                            <div className="rl-field full">
                                <label htmlFor="resource-content">
                                    Full content
                                </label>
                                <textarea
                                    id="resource-content"
                                    name="content"
                                    value={form.content}
                                    onChange={updateForm}
                                    minLength={20}
                                    required
                                    rows={7}
                                    placeholder="Enter the full wellness resource content"
                                />
                            </div>

                            <div className="rl-field full">
                                <label className="rl-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isPublished"
                                        checked={form.isPublished}
                                        onChange={updateForm}
                                    />
                                    Publish this resource for users
                                </label>
                            </div>
                        </div>

                        <div className="rl-form-actions">
                            <button
                                type="button"
                                className="rl-button secondary"
                                onClick={closeForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="rl-button primary"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Create Resource"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* SEARCH AND FILTERS */}
            <section className="rl-filter-card">
                <form onSubmit={applySearch} className="rl-search-form">
                    <div className="rl-search-input">
                        <Search size={19} />

                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search wellness resources..."
                        />
                    </div>

                    <button className="rl-button primary" type="submit">
                        Search
                    </button>
                </form>

                <div className="rl-category-filter">
                    <label htmlFor="category-filter">Category</label>

                    <select
                        id="category-filter"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                    >
                        <option value="">All Categories</option>

                        {CATEGORIES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="rl-clear-button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </div>
            </section>

            {/* RESOURCE LIST */}
            <section className="rl-results">
                <div className="rl-results-heading">
                    <div>
                        <p className="rl-eyebrow">EXPLORE AND LEARN</p>
                        <h2>Available Resources</h2>
                    </div>

                    <span>{resources.length} resources</span>
                </div>

                {loading ? (
                    <div className="rl-empty">
                        Loading resources...
                    </div>
                ) : resources.length === 0 ? (
                    <div className="rl-empty">
                        <BookOpen size={38} />
                        <h3>No resources found</h3>
                        <p>
                            Try another search term or select a different category.
                        </p>
                    </div>
                ) : (
                    <div className="rl-grid">
                        {resources.map((resource) => (
                            <article className="rl-card" key={resource._id}>
                                <div className="rl-card-top">
                                    <span className="rl-category-badge">
                                        {resource.category}
                                    </span>

                                    {isAdmin && (
                                        <span
                                            className={`rl-publish-status ${
                                                resource.isPublished
                                                    ? "published"
                                                    : "unpublished"
                                            }`}
                                        >
                                            {resource.isPublished
                                                ? "Published"
                                                : "Draft"}
                                        </span>
                                    )}
                                </div>

                                <h3>{resource.title}</h3>
                                <p className="rl-summary">
                                    {resource.summary}
                                </p>

                                {resource.tags?.length > 0 && (
                                    <div className="rl-tags">
                                        {resource.tags.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="rl-card-footer">
                                    <button
                                        type="button"
                                        className="rl-read-button"
                                        onClick={() =>
                                            setSelectedResource(resource)
                                        }
                                    >
                                        <Eye size={16} />
                                        Read Resource
                                    </button>

                                    {isAdmin && (
                                        <div className="rl-admin-actions">
                                            <button
                                                type="button"
                                                className="rl-icon-button"
                                                title="Edit resource"
                                                aria-label="Edit resource"
                                                onClick={() =>
                                                    openEditForm(resource)
                                                }
                                            >
                                                <Edit size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                className="rl-icon-button danger"
                                                title="Delete resource"
                                                aria-label="Delete resource"
                                                onClick={() =>
                                                    deleteResource(resource)
                                                }
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* RESOURCE READING MODAL */}
            {selectedResource && (
                <div
                    className="rl-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedResource(null);
                        }
                    }}
                >
                    <article
                        className="rl-reader"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resource-reader-title"
                    >
                        <div className="rl-reader-header">
                            <span className="rl-category-badge">
                                {selectedResource.category}
                            </span>

                            <button
                                type="button"
                                className="rl-icon-button"
                                aria-label="Close resource"
                                onClick={() => setSelectedResource(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 id="resource-reader-title">
                            {selectedResource.title}
                        </h2>

                        <p className="rl-reader-summary">
                            {selectedResource.summary}
                        </p>

                        <div className="rl-reader-content">
                            {selectedResource.content}
                        </div>

                        <p className="rl-disclaimer">
                            These resources provide general wellness
                            information. They do not replace professional
                            mental healthcare or emergency support.
                        </p>

                        <button
                            type="button"
                            className="rl-button primary"
                            onClick={() => setSelectedResource(null)}
                        >
                            Close
                        </button>
                    </article>
                </div>
            )}

            <footer className="rl-footer">
                MindCare Connect — Your wellbeing matters.
            </footer>
        </div>
    );
}
