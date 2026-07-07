/**
 * @file useLiveCrowdData.js
 * @description React hook managing the background simulator engine and live Firestore crowd level updates.
 */
import { useEffect, useState, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
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
  // Ref to hold the latest zones list for the simulator loop
  const zonesRef = useRef([]);
  // Track if component is currently mounted to prevent async rescheduling after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

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

  // 2. Simulation engine running every 6-8 seconds
  useEffect(() => {
    let simulatorTimerId;

    const tick = async () => {
      const currentZones = zonesRef.current;
      if (currentZones.length === 0) {
        // If zones aren't loaded yet, check again in 2 seconds
        if (isMountedRef.current) {
          simulatorTimerId = setTimeout(tick, 2000);
        }
        return;
      }

      // 10% chance of a surge (+25 to +35) on a random zone
      const isSurge = Math.random() < 0.1;
      const surgeZoneIndex = isSurge ? Math.floor(Math.random() * currentZones.length) : -1;

      const batch = writeBatch(db);
      let hasUpdates = false;
      const currentTimestamp = Timestamp.now();
      const updatedZoneIds = [];

      for (let zoneIndex = 0; zoneIndex < currentZones.length; zoneIndex++) {
        const currentZone = currentZones[zoneIndex];
        let crowdChangeNudge;

        if (zoneIndex === surgeZoneIndex) {
          crowdChangeNudge = Math.floor(Math.random() * 11) + 25; // +25 to +35 jump
        } else {
          // Dynamic simulator behavior based on crowd levels to maintain a realistic mix of zones
          if (currentZone.crowdLevel > 70) {
            // Mean-reversion above 70%: bias negative (-15 to +5)
            crowdChangeNudge = Math.floor(Math.random() * 21) - 15;
          } else if (currentZone.crowdLevel < 30) {
            // Upward bias below 30%: bias positive (-8 to +12)
            crowdChangeNudge = Math.floor(Math.random() * 21) - 8;
          } else {
            // Normal fluctuation: allow natural dispersing/dispersal (-10 to +10)
            crowdChangeNudge = Math.floor(Math.random() * 21) - 10;
          }
        }

        const updatedCrowdLevel = Math.max(
          0,
          Math.min(100, currentZone.crowdLevel + crowdChangeNudge)
        );

        if (updatedCrowdLevel !== currentZone.crowdLevel) {
          hasUpdates = true;
          updatedZoneIds.push(currentZone.id);
          const targetZoneRef = doc(db, 'zones', currentZone.id);

          batch.update(targetZoneRef, {
            crowdLevel: updatedCrowdLevel,
            lastUpdated: currentTimestamp,
          });

          // Append to history subcollection: zones/{zoneId}/history/{timestamp}
          const historyDocumentId = String(currentTimestamp.toMillis());
          const zoneHistoryDocRef = doc(db, 'zones', currentZone.id, 'history', historyDocumentId);
          batch.set(zoneHistoryDocRef, {
            crowdLevel: updatedCrowdLevel,
            timestamp: currentTimestamp,
          });
        }
      }

      if (hasUpdates) {
        try {
          await batch.commit();

          // Trim history older than 30 minutes (Efficiency)
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          for (const zoneId of updatedZoneIds) {
            const historyCol = collection(db, 'zones', zoneId, 'history');
            const expiredHistoryQuery = query(
              historyCol,
              where('timestamp', '<', Timestamp.fromDate(thirtyMinutesAgo))
            );
            const expiredDocsSnapshot = await getDocs(expiredHistoryQuery);

            if (!expiredDocsSnapshot.empty) {
              const deleteBatch = writeBatch(db);
              expiredDocsSnapshot.forEach((expiredDoc) => {
                deleteBatch.delete(expiredDoc.ref);
              });
              await deleteBatch.commit();
            }
          }
        } catch (error) {
          console.error('Failed to commit simulation batch update:', error);
        }
      }

      // Schedule next tick with dynamic 6-8s interval if still mounted
      if (isMountedRef.current) {
        const nextInterval = Math.floor(Math.random() * 2000) + 6000;
        simulatorTimerId = setTimeout(tick, nextInterval);
      }
    };

    const firstInterval = Math.floor(Math.random() * 2000) + 6000;
    if (isMountedRef.current) {
      simulatorTimerId = setTimeout(tick, firstInterval);
    }

    return () => clearTimeout(simulatorTimerId);
  }, []);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return { zones, loading, activeAlert, dismissAlert };
}
