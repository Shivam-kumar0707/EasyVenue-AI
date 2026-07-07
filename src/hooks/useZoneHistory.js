/**
 * @file useZoneHistory.js
 * @description React hook subscribing to Firestore zones history subcollections for chart sparklines.
 */
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { parseFirestoreDate } from '../utils/parseFirestoreDate.js';

/**
 * Custom hook to listen to the history subcollection of a specific zone in Firestore.
 * Returns sorted historical readings (oldest first).
 *
 * @param {string} zoneId - ID of the zone.
 * @returns {{history: Array<{crowdLevel: number, timestamp: Date}>, loading: boolean}}
 */
export function useZoneHistory(zoneId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zoneId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const historyCol = collection(db, 'zones', zoneId, 'history');
    // Order by timestamp ascending so that readings are chronological (oldest to newest)
    const q = query(historyCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const readings = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const date = parseFirestoreDate(data.timestamp);

          readings.push({
            crowdLevel: data.crowdLevel,
            timestamp: date,
          });
        });

        setHistory(readings);
        setLoading(false);
      },
      (error) => {
        console.error(`Error loading history for zone ${zoneId}:`, error);
      }
    );

    return () => unsubscribe();
  }, [zoneId]);

  return { history, loading };
}

export default useZoneHistory;
