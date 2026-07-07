/**
 * Generates a screen-reader friendly verbal description of a zone's crowd trend over the history period.
 *
 * @param {string} zoneName - Name of the zone (e.g. Gate 1).
 * @param {Array<{crowdLevel: number}>} history - Array of history objects.
 * @returns {string} - Descriptive string.
 */
export function getTrendDescription(zoneName, history) {
  if (!history || history.length === 0) {
    return `${zoneName} crowd level history: no data available.`;
  }

  const startLevel = history[0].crowdLevel;
  const endLevel = history[history.length - 1].crowdLevel;
  const change = endLevel - startLevel;

  let trend = 'stable';
  if (change > 10) {
    trend = 'rising';
  } else if (change < -10) {
    trend = 'falling';
  }

  return `${zoneName} crowd trend over last 30 minutes: ${trend} from ${startLevel}% to ${endLevel}%.`;
}
