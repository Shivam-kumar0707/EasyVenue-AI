/**
 * Generates SVG line and area path strings for a given array of historical crowd levels.
 *
 * @param {Array<{crowdLevel: number}>} points - Chronological history points.
 * @param {number} width - Target width of the SVG canvas.
 * @param {number} height - Target height of the SVG canvas.
 * @returns {{linePath: string, areaPath: string}}
 */
export function generateSparklinePath(points, width, height) {
  if (!points || points.length === 0) {
    return { linePath: '', areaPath: '' };
  }

  // Handle single data point
  if (points.length === 1) {
    const y = height - (points[0].crowdLevel / 100) * height;
    return {
      linePath: `M 0 ${y} L ${width} ${y}`,
      areaPath: `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  // Map each point to X, Y coordinates
  const coordinates = points.map((p, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - (p.crowdLevel / 100) * height;
    return { x, y };
  });

  // Construct SVG Path strings
  const linePath = coordinates
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${width.toFixed(1)} ${height.toFixed(1)} L 0 ${height.toFixed(1)} Z`;

  return { linePath, areaPath };
}
