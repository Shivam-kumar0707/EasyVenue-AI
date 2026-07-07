/**
 * Analyzes crowd level history to determine if an anomaly (surge > 30%) has occurred.
 * @param {Array<number>} historyValues - Historical crowd levels in the window.
 * @param {number} currentValue - The latest crowd level value.
 * @returns {{isAnomaly: boolean, beforeValue: number, spikeDiff: number}}
 */
export function checkAnomaly(historyValues, currentValue) {
  if (!historyValues || historyValues.length === 0) {
    return { isAnomaly: false, beforeValue: currentValue, spikeDiff: 0 };
  }

  const minVal = Math.min(...historyValues);
  const spikeDiff = currentValue - minVal;

  return {
    isAnomaly: spikeDiff > 30,
    beforeValue: minVal,
    spikeDiff,
  };
}
