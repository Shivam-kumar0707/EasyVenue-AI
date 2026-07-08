/**
 * @file useLiveCrowdData.js
 * @description React hook managing the background simulator engine and live Firestore crowd level updates.
 */
import { useEffect, useState, useRef } from 'react';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { detectAnomaly } from '../ai/detectAnomaly.js';
import { checkAnomaly } from '../utils/checkAnomaly.js';
import { parseFirestoreDate } from '../utils/parseFirestoreDate.js';

/**
 * Custom hook to manage live crowd levels and simulation.
 * Subscribes to Firestore zones and runs a simulation loop on mount.
 * Tracks zone history to detect >30% surges and trigger Groq anomaly recommendations.
 *
 * @returns {{ zones: Array, loading: boolean, activeAlert: Object|null, dismissAlert: Function }}
 */
export function useLiveCrowdData() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);

  // Keep track of crowd level history in-memory for the last 10 minutes
  // Format: { [zoneId]: Array<{ value: number, timestamp: number }> }
  const historyRef = useRef({});
  // Track last alerted timestamp per zone to prevent multiple notifications for the same surge
  const lastAlertedRef = useRef({});


  // 1. Subscribe to Firestore zones collection
  useEffect(() => {
    const zonesCol = collection(db, 'zones');
    const unsubscribe = onSnapshot(
      zonesCol,
      (snapshot) => {
        const parsedZones = [];
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;

        snapshot.forEach((docSnap) => {
          const zoneFields = docSnap.data();
          const zoneId = docSnap.id;

          const lastUpdatedDate = parseFirestoreDate(zoneFields.lastUpdated);

          const zone = {
            id: zoneId,
            ...zoneFields,
            lastUpdated: lastUpdatedDate,
          };
          parsedZones.push(zone);

          // Anomaly detection history updates
          if (!historyRef.current[zoneId]) {
            historyRef.current[zoneId] = [];
          }

          // Append current level
          historyRef.current[zoneId].push({
            value: zone.crowdLevel,
            timestamp: now,
          });

          // Clean history older than 10 minutes
          historyRef.current[zoneId] = historyRef.current[zoneId].filter(
            (historyRecord) => historyRecord.timestamp >= tenMinutesAgo
          );

          // Analyze for sudden surges (>30% jump from minimum level in window)
          const history = historyRef.current[zoneId];
          const historyValues = history.map((h) => h.value);
          const currentVal = zone.crowdLevel;

          const { isAnomaly, beforeValue, spikeDiff } = checkAnomaly(historyValues, currentVal);

          if (isAnomaly) {
            const lastAlertTime = lastAlertedRef.current[zoneId] || 0;
            const cooldown = 5 * 60 * 1000; // 5 minutes cooldown per zone

            if (now - lastAlertTime > cooldown) {
              lastAlertedRef.current[zoneId] = now;
              console.log(
                `[ANOMALY] Spike detected in ${zone.name}: jumped by ${spikeDiff}% (from ${beforeValue}% to ${currentVal}%)`
              );

              // Request recommendation from Groq (only triggered on genuine spike)
              detectAnomaly(zone.name, beforeValue, currentVal)
                .then((recommendation) => {
                  setActiveAlert({
                    id: `${zoneId}_${now}`,
                    zoneId,
                    zoneName: zone.name,
                    beforeValue,
                    afterValue: currentVal,
                    recommendation,
                    timestamp: new Date(),
                  });
                })
                .catch((error) => {
                  console.error('Error generating anomaly recommendation:', error);
                });
            }
          }
        });

        // Ensure zones are sorted alphabetically by name
        parsedZones.sort((a, b) => a.name.localeCompare(b.name));
        setZones(parsedZones);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore zones subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, []);



  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return { zones, loading, activeAlert, dismissAlert };
}
