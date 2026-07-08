/**
 * @file useRecentIncidents.js
 * @description Hook to filter incidents reported in the last hour.
 */
import { useMemo } from 'react';

/**
 * Custom hook to filter incidents to only those reported in the last hour.
 *
 * @param {Array} incidents - List of all incidents.
 * @returns {Array} - List of incidents reported in the last hour.
 */
export function useRecentIncidents(incidents) {
  return useMemo(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return (incidents || []).filter((inc) => {
      if (!inc.reportedAt) return false;
      const reportedTime =
        inc.reportedAt instanceof Date ? inc.reportedAt : new Date(inc.reportedAt);
      return reportedTime.getTime() >= oneHourAgo.getTime();
    });
  }, [incidents]);
}

export default useRecentIncidents;
