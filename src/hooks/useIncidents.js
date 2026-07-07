/**
 * @file useIncidents.js
 * @description React hook managing live Firestore subscriptions for logged incidents and mutation callbacks.
 */
import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { classifyIncident } from '../ai/classifyIncident.js';
import { parseFirestoreDate } from '../utils/parseFirestoreDate.js';

/**
 * Custom hook to manage Firestore incident subscription and mutation functions.
 * Returns incidents sorted by severity (high -> medium -> low) then by recency.
 *
 * @returns {{ incidents: Array, loading: boolean, addIncident: Function, acknowledgeIncident: Function, resolveIncident: Function }}
 */
export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Subscribe to Firestore incidents collection
  useEffect(() => {
    const incidentsCol = collection(db, 'incidents');
    const unsubscribe = onSnapshot(
      incidentsCol,
      (snapshot) => {
        const parsedIncidents = [];
        snapshot.forEach((docSnap) => {
          const incidentFields = docSnap.data();
          const incidentId = docSnap.id;

          const reportedAtDate = parseFirestoreDate(incidentFields.reportedAt);

          parsedIncidents.push({
            id: incidentId,
            ...incidentFields,
            reportedAt: reportedAtDate,
          });
        });

        // Sort by severity (high -> medium -> low -> unclassified) then recency (newest first)
        const severityRank = { high: 3, medium: 2, low: 1, unclassified: 0 };
        parsedIncidents.sort((a, b) => {
          const severityRankA = severityRank[a.severity] ?? 0;
          const severityRankB = severityRank[b.severity] ?? 0;
          if (severityRankA !== severityRankB) {
            return severityRankB - severityRankA;
          }
          return b.reportedAt.getTime() - a.reportedAt.getTime();
        });

        setIncidents(parsedIncidents);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore incidents subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Classifies raw input text with Groq and adds a new incident document.
   * @param {string} rawText - User's description of the incident.
   * @param {string} zone - The zone name where it occurred.
   */
  const addIncident = useCallback(async (rawText, zone) => {
    const incidentsCol = collection(db, 'incidents');
    const newDocRef = doc(incidentsCol); // Generates a unique document reference

    // Call Groq to classify the incident
    const classification = await classifyIncident(rawText);

    const newIncident = {
      incidentId: newDocRef.id,
      rawText,
      zone,
      status: 'open',
      reportedAt: Timestamp.now(),
      ...classification,
    };

    await setDoc(newDocRef, newIncident);
  }, []);

  /**
   * Sets the status of an incident to "acknowledged".
   * @param {string} id - The document ID of the incident.
   */
  const acknowledgeIncident = useCallback(async (id) => {
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, { status: 'acknowledged' });
  }, []);

  /**
   * Sets the status of an incident to "resolved".
   * @param {string} id - The document ID of the incident.
   */
  const resolveIncident = useCallback(async (id) => {
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, { status: 'resolved' });
  }, []);

  return {
    incidents,
    loading,
    addIncident,
    acknowledgeIncident,
    resolveIncident,
  };
}
