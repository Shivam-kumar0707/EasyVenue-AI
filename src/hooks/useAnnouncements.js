import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { draftAnnouncement } from '../ai/draftAnnouncement.js';

/**
 * Custom hook to subscribe to the latest 5 drafted announcements in Firestore,
 * and provide a helper function to create new ones via the Groq AI drafter.
 *
 * @returns {{announcements: Array, loading: boolean, createAnnouncement: Function}}
 */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const announcementsCol = collection(db, 'announcements');
    // Order by timestamp descending and limit to the last 5 for internal logs
    const q = query(announcementsCol, orderBy('timestamp', 'desc'), limit(5));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let dateVal = new Date();

          if (data.timestamp) {
            dateVal = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
          }

          items.push({
            id: docSnap.id,
            ...data,
            timestamp: dateVal,
          });
        });

        setAnnouncements(items);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore announcements subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Triggers the Groq AI drafter, saves the resulting announcement record to Firestore.
   *
   * @param {string} situationInput - Raw user input describing the event situation.
   * @returns {Promise<Object>} - The newly created announcement document fields.
   */
  const createAnnouncement = async (situationInput) => {
    const draftedText = await draftAnnouncement(situationInput);
    const announcementsCol = collection(db, 'announcements');
    const newDocRef = doc(announcementsCol); // Unique ID

    const record = {
      id: newDocRef.id,
      text: draftedText,
      situationInput,
      timestamp: Timestamp.now(),
    };

    await setDoc(newDocRef, record);
    return record;
  };

  return { announcements, loading, createAnnouncement };
}

export default useAnnouncements;
