/**
 * @file seedDemoData.js
 * @description Utility to populate initial demo zones and incidents collections in Firestore.
 */
import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Checks if the zones and incidents collections are empty.
 * If empty, seeds them with 5 realistic zones and 3 pre-existing incidents.
 */
export async function seedIfEmpty() {
  try {
    // 1. Seed Zones
    const zonesCol = collection(db, 'zones');
    const zonesSnapshot = await getDocs(zonesCol);

    if (zonesSnapshot.empty) {
      console.log('Seeding default zones...');
      const batch = writeBatch(db);

      const defaultZones = [
        {
          zoneId: 'gate_1',
          name: 'Gate 1',
          crowdLevel: 15,
          capacity: 5000,
          lastUpdated: Timestamp.now(),
        },
        {
          zoneId: 'gate_2',
          name: 'Gate 2',
          crowdLevel: 48,
          capacity: 6000,
          lastUpdated: Timestamp.now(),
        },
        {
          zoneId: 'gate_3',
          name: 'Gate 3',
          crowdLevel: 82,
          capacity: 5500,
          lastUpdated: Timestamp.now(),
        },
        {
          zoneId: 'food_court',
          name: 'Food Court',
          crowdLevel: 64,
          capacity: 3000,
          lastUpdated: Timestamp.now(),
        },
        {
          zoneId: 'main_concourse',
          name: 'Main Concourse',
          crowdLevel: 35,
          capacity: 8000,
          lastUpdated: Timestamp.now(),
        },
      ];

      defaultZones.forEach((zone) => {
        const docRef = doc(db, 'zones', zone.zoneId);
        batch.set(docRef, zone);
      });

      await batch.commit();
      console.log('Zones successfully seeded!');
    }

    // 2. Seed Incidents
    const incidentsCol = collection(db, 'incidents');
    const incidentsSnapshot = await getDocs(incidentsCol);

    if (incidentsSnapshot.empty) {
      console.log('Seeding default incidents...');
      const batch = writeBatch(db);

      const defaultIncidents = [
        {
          incidentId: 'incident_1',
          rawText: 'Crowd build-up at Gate 3 due to a broken turnstile scanner.',
          zone: 'Gate 3',
          category: 'crowd_control',
          severity: 'high',
          status: 'open',
          reportedAt: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), // 15 mins ago
          summary: 'Turnstile scanner broken causing crowd build-up.',
        },
        {
          incidentId: 'incident_2',
          rawText: 'Spilled water in the main passageway leading to potential slip hazard.',
          zone: 'Main Concourse',
          category: 'facility',
          severity: 'low',
          status: 'acknowledged',
          reportedAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 1000)), // 8 mins ago
          summary: 'Water spill causing slip hazard.',
        },
        {
          incidentId: 'incident_3',
          rawText: 'Visitor requesting assistance for a lost bag containing essential items.',
          zone: 'Food Court',
          category: 'lost_person',
          severity: 'medium',
          status: 'open',
          reportedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 mins ago
          summary: 'Lost bag assistance request.',
        },
      ];

      defaultIncidents.forEach((inc) => {
        const docRef = doc(db, 'incidents', inc.incidentId);
        batch.set(docRef, inc);
      });

      await batch.commit();
      console.log('Incidents successfully seeded!');
    }
  } catch (error) {
    console.error('Error seeding data: ', error);
  }
}
