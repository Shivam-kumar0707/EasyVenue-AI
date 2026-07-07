/**
 * @file useZoneHistory.js
 * @description React hook subscribing to Firestore zones history subcollections for chart sparklines.
 */
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { parseFirestoreDate } from '../utils/parseFirestoreDate.js';
import { trimOldHistory } from '../utils/trimHistory.js';

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
    const historyQuery = query(historyCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const historicalReadings = [];
        snapshot.forEach((docSnap) => {
          const historyFields = docSnap.data();
          const parsedTimestamp = parseFirestoreDate(historyFields.timestamp);

          historicalReadings.push({
            crowdLevel: historyFields.crowdLevel,
            timestamp: parsedTimestamp,
          });
        });

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const trimmedReadings = trimOldHistory(historicalReadings, thirtyMinutesAgo);

        setHistory(trimmedReadings);
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
