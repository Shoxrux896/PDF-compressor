import React, { useState, useEffect } from "react";
import { getStats, getRecentActivity, type AnalyticsEvent, type SiteStats } from "../utils/analytics";
import { Link } from "react-router-dom";

export function Admin() {
    const [authorized, setAuthorized] = useState(false);
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedAuth = localStorage.getItem("pdf_admin_auth");
        if (savedAuth === "true") {
            setAuthorized(true);
            loadData();
        }
    }, []);

    const checkAuth = (e: React.FormEvent) => {
        e.preventDefault();
        // IMPORTANT: Set VITE_ADMIN_PASSWORD in your .env file
        const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin";
        
        if (password === expectedPassword) {
            setAuthorized(true);
            if (rememberMe) {
                localStorage.setItem("pdf_admin_auth", "true");
            }
            loadData();
        } else {
            alert("Wrong password");
        }
    };

    const handleLogout = () => {
        setAuthorized(false);
        setStats(null);
        setEvents([]);
        setPassword("");
        localStorage.removeItem("pdf_admin_auth");
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const s = await getStats();
            setStats(s);
            const e = await getRecentActivity(50);
            setEvents(e as AnalyticsEvent[]);
        } catch (err: any) {
            console.error("Failed to load admin data:", err);
            setError("Failed to load data. Please check your network connection or Firestore rules.");
        } finally {
            setLoading(false);
        }
    };

    if (!authorized) {
        return (
            <div className="admin-container">
                <div className="card login-card">
                    <h1>Admin Login</h1>
                    <p className="subtitle" style={{ margin: '0 0 2rem 0', fontSize: '1rem' }}>Enter credentials to access dashboard</p>
                    <form onSubmit={checkAuth} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="filename-input">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                autoFocus
                            />
                        </div>

                        <label className="checkbox-label" style={{ justifyContent: 'center' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                            />
                            Remember me on this device
                        </label>

                        <button type="submit" className="convert-btn">Login</button>
                        <Link to="/" style={{ color: "var(--color-text-dim)", textDecoration: 'none', fontSize: '0.9rem', marginTop: '1rem' }}>← Back to Home</Link>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container" style={{ padding: '2rem 0' }}>
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 className="admin-title">Dashboard</h1>
                    {loading && <span className="loading-text">Refreshing...</span>}
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: 'wrap' }}>
                    <button onClick={loadData} className="reset-btn" disabled={loading}>
                        ⟳ Refresh
                    </button>
                    <button onClick={handleLogout} className="reset-btn" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}>
                        Logout
                    </button>
                    <Link to="/" className="reset-btn app-link">
                        Go to App
                    </Link>
                </div>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    border: '1px solid #fecaca'
                }}>
                    {error}
                </div>
            )}

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-value">{stats.totalVisits}</h3>
                        <p className="stat-label">Total Visits</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-value">{stats.totalConversions}</h3>
                        <p className="stat-label">PDFs Created</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-value">{stats.totalUploads}</h3>
                        <p className="stat-label">Users Uploaded</p>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="section-header">
                    <h3>Recent Activity</h3>
                    <small>Last 50 events</small>
                </div>

                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Action</th>
                                <th>Time</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev, i) => (
                                <tr key={i}>
                                    <td data-label="Type">
                                        <span className={`status-badge ${ev?.type === 'visit' ? 'status-visit' : 'status-action'}`}>
                                            {ev?.type ? ev.type.toUpperCase() : "UNKNOWN"}
                                        </span>
                                    </td>
                                    <td data-label="Action">{ev?.action || "-"}</td>
                                    <td data-label="Time" className="text-dim nowrap">
                                        {ev.timestamp?.seconds ? new Date(ev.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                                    </td>
                                    <td data-label="Details" className="details-cell">
                                        {ev.details ? JSON.stringify(ev.details).slice(0, 50) + (JSON.stringify(ev.details).length > 50 ? '...' : '') : "-"}
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>
                                        No activity recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
