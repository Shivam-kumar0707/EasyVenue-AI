/**
 * Filters out history documents that are older than 30 minutes from a given array.
 *
 * @param {Array<{timestamp: Date|number}>} history - Array of history objects.
 * @param {Date} cutoffTime - The threshold date. Any entry older than this will be filtered out.
 * @returns {Array} - Filtered history array containing only entries >= cutoffTime.
 */
export function trimOldHistory(history, cutoffTime) {
  if (!history) return [];

  const cutoffMs = cutoffTime.getTime();

  return history.filter((item) => {
    if (!item || !item.timestamp) return false;
    const itemMs =
      item.timestamp instanceof Date
        ? item.timestamp.getTime()
        : new Date(item.timestamp).getTime();
    return itemMs >= cutoffMs;
  });
}
