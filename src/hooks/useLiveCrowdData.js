import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { detectAnomaly } from '../ai/detectAnomaly.js';
import { checkAnomaly } from '../utils/checkAnomaly.js';

/**
 * Custom hook to manage live crowd levels and simulation.
 * Subscribes to Firestore zones and runs a simulation loop on mount.
 * Tracks zone history to detect >30% surges and trigger Groq anomaly recommendations.
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

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // 1. Subscribe to Firestore zones collection
  useEffect(() => {
    const zonesCol = collection(db, 'zones');
    const unsubscribe = onSnapshot(
      zonesCol,
      (snapshot) => {
        const zonesData = [];
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const zoneId = docSnap.id;

          let lastUpdatedDate = new Date();
          if (data.lastUpdated) {
            lastUpdatedDate = data.lastUpdated.toDate
              ? data.lastUpdated.toDate()
              : new Date(data.lastUpdated);
          }

          const zone = {
            id: zoneId,
            ...data,
            lastUpdated: lastUpdatedDate,
          };
          zonesData.push(zone);

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
            (item) => item.timestamp >= tenMinutesAgo
          );

          // Analyze for sudden surges (>30% jump from minimum level in window)
          const history = historyRef.current[zoneId];
          const historyValues = history.map((h) => h.value);
          const currentVal = zone.crowdLevel;

          const { isAnomaly, beforeValue, spikeDiff } = checkAnomaly(historyValues, currentVal);

          if (isAnomaly) {
            const lastAlertTime = lastAlertedRef.current[zoneId] || 0;
            const cooldown = 45 * 1000; // 45 seconds cooldown per zone

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
                .catch((err) => {
                  console.error('Error generating anomaly recommendation:', err);
                });
            }
          }
        });

        // Ensure zones are sorted alphabetically by name
        zonesData.sort((a, b) => a.name.localeCompare(b.name));
        setZones(zonesData);
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
    let timeoutId;

    const tick = async () => {
      const currentZones = zonesRef.current;
      if (currentZones.length === 0) {
        // If zones aren't loaded yet, check again in 2 seconds
        timeoutId = setTimeout(tick, 2000);
        return;
      }

      // 10% chance of a surge (+25 to +35) on a random zone
      const isSurge = Math.random() < 0.1;
      const surgeZoneIndex = isSurge ? Math.floor(Math.random() * currentZones.length) : -1;

      for (let i = 0; i < currentZones.length; i++) {
        const zone = currentZones[i];
        let nudge = 0;

        if (i === surgeZoneIndex) {
          nudge = Math.floor(Math.random() * 11) + 25; // +25 to +35 jump
        } else {
          // Dynamic simulator behavior based on crowd levels to maintain a realistic mix of zones
          if (zone.crowdLevel > 70) {
            // Mean-reversion above 70%: bias negative (-15 to +5)
            nudge = Math.floor(Math.random() * 21) - 15;
          } else if (zone.crowdLevel < 30) {
            // Upward bias below 30%: bias positive (-8 to +12)
            nudge = Math.floor(Math.random() * 21) - 8;
          } else {
            // Normal fluctuation: allow natural dispersing/dispersal (-10 to +10)
            nudge = Math.floor(Math.random() * 21) - 10;
          }
        }

        const newLevel = Math.max(0, Math.min(100, zone.crowdLevel + nudge));

        if (newLevel !== zone.crowdLevel) {
          const zoneRef = doc(db, 'zones', zone.id);
          try {
            await updateDoc(zoneRef, {
              crowdLevel: newLevel,
              lastUpdated: Timestamp.now(),
            });
          } catch (error) {
            console.error(`Failed to simulate update for ${zone.name}:`, error);
          }
        }
      }

      // Schedule next tick with dynamic 6-8s interval
      const nextInterval = Math.floor(Math.random() * 2000) + 6000;
      timeoutId = setTimeout(tick, nextInterval);
    };

    const firstInterval = Math.floor(Math.random() * 2000) + 6000;
    timeoutId = setTimeout(tick, firstInterval);

    return () => clearTimeout(timeoutId);
  }, []);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return { zones, loading, activeAlert, dismissAlert };
}
