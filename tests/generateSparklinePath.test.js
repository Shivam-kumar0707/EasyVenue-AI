import { describe, test, expect } from 'vitest';
import { generateSparklinePath } from '../src/utils/generateSparklinePath.js';

describe('generateSparklinePath utility tests', () => {
  test('returns empty paths for null, undefined, or empty arrays', () => {
    const fallbackVal = { linePath: '', areaPath: '' };
    expect(generateSparklinePath(null, 100, 50)).toEqual(fallbackVal);
    expect(generateSparklinePath(undefined, 100, 50)).toEqual(fallbackVal);
    expect(generateSparklinePath([], 100, 50)).toEqual(fallbackVal);
  });

  test('projects a flat horizontal line for a single data point', () => {
    // 50% crowd level at height 50 should place Y coordinate exactly at 25 (midpoint)
    const points = [{ crowdLevel: 50 }];
    const { linePath, areaPath } = generateSparklinePath(points, 150, 50);

    expect(linePath).toBe('M 0 25 L 150 25');
    expect(areaPath).toBe('M 0 25 L 150 25 L 150 50 L 0 50 Z');
  });

  test('correctly projects coordinates for multiple data points', () => {
    // 3 points: 0% (Y=100), 100% (Y=0), 50% (Y=50)
    // Canvas: width=200, height=100
    // X coordinates: 0, 100, 200
    const points = [{ crowdLevel: 0 }, { crowdLevel: 100 }, { crowdLevel: 50 }];

    const { linePath, areaPath } = generateSparklinePath(points, 200, 100);

    expect(linePath).toBe('M 0.0 100.0 L 100.0 0.0 L 200.0 50.0');
    expect(areaPath).toBe('M 0.0 100.0 L 100.0 0.0 L 200.0 50.0 L 200.0 100.0 L 0 100.0 Z');
  });
});
