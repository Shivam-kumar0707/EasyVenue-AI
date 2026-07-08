/**
 * @file useCrowdSimulator.js
 * @description React hook managing the background simulator engine to write fake crowd level updates to Firestore.
 */
import { useEffect, useRef } from 'react';
import {
  collection,
  doc,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Custom hook to run the stadium crowd level simulation.
 * Writes updates to zones and appends to zone history in Firestore.
 *
 * @param {Array} zones - The current list of zones.
 */
export function useCrowdSimulator(zones) {
  const zonesRef = useRef([]);
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
}
