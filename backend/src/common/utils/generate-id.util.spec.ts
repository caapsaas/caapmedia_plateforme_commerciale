import { generateId } from './generate-id.util';
import { ID_PREFIXES } from '../constants/id-prefixes.const';

describe('generateId', () => {
  it('should generate IDs with correct format', () => {
    const id = generateId(ID_PREFIXES.EMPLOYEE);
    expect(id).toMatch(/^EMP-[A-Z0-9]{9,}$/);
  });

  it('should include the prefix', () => {
    const id = generateId(ID_PREFIXES.PRODUCT);
    expect(id.startsWith('PRD-')).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      ids.add(generateId(ID_PREFIXES.ORDER));
    }
    expect(ids.size).toBe(10000);
  });

  it('should work with all prefixes', () => {
    Object.values(ID_PREFIXES).forEach((prefix) => {
      const id = generateId(prefix);
      expect(id.startsWith(`${prefix}-`)).toBe(true);
      expect(id.length).toBeGreaterThan(4);
    });
  });

  it('should handle lowercase prefix input', () => {
    const id = generateId('emp');
    expect(id.startsWith('EMP-')).toBe(true);
  });

  it('should generate base36 encoded timestamp and random', () => {
    const id1 = generateId(ID_PREFIXES.EMPLOYEE);
    const id2 = generateId(ID_PREFIXES.EMPLOYEE);

    // Extract timestamp+random part
    const part1 = id1.substring(4); // Remove "EMP-"
    const part2 = id2.substring(4);

    // They should be different (unless generated in same millisecond with same random)
    expect(part1).not.toBe(part2);
  });

  it('should be consistent format across calls', () => {
    const ids = Array.from({ length: 100 }, () => generateId(ID_PREFIXES.USER));

    ids.forEach((id) => {
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe('USR');
      expect(parts[1].length).toBeGreaterThanOrEqual(6);
    });
  });
});
