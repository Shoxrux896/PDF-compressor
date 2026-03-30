import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, increment, doc, setDoc, updateDoc, getDoc, Timestamp } from "firebase/firestore";

export interface AnalyticsEvent {
    id?: string; // Firestore ID
    type: 'visit' | 'action'; // Broad category
    action?: string; // Specific action name (e.g., "convert_pdf")
    timestamp: Timestamp | null; // Firestore Timestamp
    userAgent?: string;
    details?: Record<string, unknown>;
}

export interface SiteStats {
    totalVisits: number;
    totalConversions: number;
    totalUploads: number;
}

// Collection name for raw events
const EVENTS_COLLECTION = "events";
// Document ID for aggregated stats (singleton)
const STATS_DOC_ID = "general_stats";

/** Ensure the stats document exists, creating it with zeros if not. */
async function ensureStatsDoc(statsRef: ReturnType<typeof doc>): Promise<void> {
    try {
        const snap = await getDoc(statsRef);
        if (!snap.exists()) {
            await setDoc(statsRef, {
                totalVisits: 0,
                totalConversions: 0,
                totalUploads: 0
            });
        }
    } catch {
        // If we can't even check, let the caller handle it
    }
}

/**
 * Log a site visit.
 * Should be called once per session/load.
 */
export async function logVisit() {
    try {
        // 1. Log the individual event
        await addDoc(collection(db, EVENTS_COLLECTION), {
            type: 'visit',
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        // 2. Increment the global counter
        const statsRef = doc(db, "stats", STATS_DOC_ID);
        try {
            await updateDoc(statsRef, {
                totalVisits: increment(1)
            });
        } catch {
            // Stats doc doesn't exist yet — create it first, then update
            await ensureStatsDoc(statsRef);
            await updateDoc(statsRef, {
                totalVisits: increment(1)
            });
        }

    } catch (e) {
        console.warn("Analytics error (logVisit):", e);
    }
}

/**
 * Log a specific user action (e.g., "convert", "upload")
 */
export async function logAction(actionName: string, details: Record<string, unknown> = {}) {
    try {
        // 1. Log event
        await addDoc(collection(db, EVENTS_COLLECTION), {
            type: 'action',
            action: actionName,
            timestamp: serverTimestamp(),
            details
        });

        // 2. Increment specific counters
        const statsRef = doc(db, "stats", STATS_DOC_ID);
        const updates: Record<string, ReturnType<typeof increment>> = {};

        if (actionName === 'convert') updates.totalConversions = increment(1);
        if (actionName === 'upload') updates.totalUploads = increment(1);

        if (Object.keys(updates).length > 0) {
            try {
                await updateDoc(statsRef, updates);
            } catch {
                // Stats doc doesn't exist yet — create it first, then update
                await ensureStatsDoc(statsRef);
                await updateDoc(statsRef, updates);
            }
        }

    } catch (e) {
        console.warn("Analytics error (logAction):", e);
    }
}

/**
 * Get stats for the Admin Dashboard
 */
export async function getStats(): Promise<SiteStats> {
    const statsRef = doc(db, "stats", STATS_DOC_ID);
    const snap = await getDoc(statsRef);

    if (snap.exists()) {
        return snap.data() as SiteStats;
    } else {
        return {
            totalVisits: 0,
            totalConversions: 0,
            totalUploads: 0
        };
    }
}

/**
 * Get recent activity logs
 */
export async function getRecentActivity(limitCount = 20) {
    const q = query(
        collection(db, EVENTS_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}
