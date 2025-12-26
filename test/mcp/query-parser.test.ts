/**
 * Query Parser Unit Tests
 * Tests tokenizer, parser, and MongoDB translation
 */

import { describe, expect, it } from 'vitest';
import { parseQuery, validateQuery } from '../../src/mcp/query-parser.js';

describe('Query Parser', () => {
  describe('validateQuery', () => {
    it('should validate correct queries', () => {
      expect(validateQuery('.name == "test"').valid).toBe(true);
      expect(validateQuery('.parent == 1').valid).toBe(true);
      expect(validateQuery('.name contains "sword"').valid).toBe(true);
    });

    it('should reject invalid queries', () => {
      const result = validateQuery('.name ==');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return helpful error messages', () => {
      const result = validateQuery('.name @@ "test"');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected character');
    });
  });

  describe('Equality operators', () => {
    it('should parse string equality', () => {
      const query = parseQuery('.name == "sword"');
      expect(query).toEqual({ 'properties.name.value': 'sword' });
    });

    it('should parse number equality', () => {
      const query = parseQuery('.parent == 10');
      expect(query).toEqual({ parent: 10 });
    });

    it('should parse boolean equality', () => {
      const query = parseQuery('.hidden == true');
      expect(query).toEqual({ 'properties.hidden.value': true });
    });

    it('should parse null equality', () => {
      const query = parseQuery('.owner == null');
      expect(query).toEqual({ 'properties.owner.value': null });
    });

    it('should parse inequality', () => {
      const query = parseQuery('.type != "room"');
      expect(query).toEqual({ 'properties.type.value': { $ne: 'room' } });
    });
  });

  describe('Numeric comparisons', () => {
    it('should parse greater than', () => {
      const query = parseQuery('.weight > 5');
      expect(query).toEqual({ 'properties.weight.value': { $gt: 5 } });
    });

    it('should parse greater than or equal', () => {
      const query = parseQuery('.level >= 10');
      expect(query).toEqual({ 'properties.level.value': { $gte: 10 } });
    });

    it('should parse less than', () => {
      const query = parseQuery('.health < 100');
      expect(query).toEqual({ 'properties.health.value': { $lt: 100 } });
    });

    it('should parse less than or equal', () => {
      const query = parseQuery('.damage <= 50');
      expect(query).toEqual({ 'properties.damage.value': { $lte: 50 } });
    });

    it('should handle negative numbers', () => {
      const query = parseQuery('.temperature > -10');
      expect(query).toEqual({ 'properties.temperature.value': { $gt: -10 } });
    });

    it('should handle decimal numbers', () => {
      const query = parseQuery('.rate >= 0.5');
      expect(query).toEqual({ 'properties.rate.value': { $gte: 0.5 } });
    });
  });

  describe('String operators', () => {
    it('should parse contains (case-insensitive substring)', () => {
      const query = parseQuery('.name contains "sword"');
      expect(query).toEqual({
        'properties.name.value': { $regex: 'sword', $options: 'i' },
      });
    });

    it('should escape regex special characters in contains', () => {
      const query = parseQuery('.name contains "test.value"');
      expect(query).toEqual({
        'properties.name.value': { $regex: 'test\\.value', $options: 'i' },
      });
    });

    it('should parse like with wildcard *', () => {
      const query = parseQuery('.name like "Iron*"');
      expect(query).toEqual({
        'properties.name.value': { $regex: '^Iron.*$', $options: 'i' },
      });
    });

    it('should parse like with single char wildcard ?', () => {
      const query = parseQuery('.name like "Item?"');
      expect(query).toEqual({
        'properties.name.value': { $regex: '^Item.$', $options: 'i' },
      });
    });

    it('should parse like with mixed wildcards', () => {
      const query = parseQuery('.name like "*Sword?"');
      expect(query).toEqual({
        'properties.name.value': { $regex: '^.*Sword.$', $options: 'i' },
      });
    });

    it('should parse matches with direct regex', () => {
      const query = parseQuery('.name matches "^[A-Z].*"');
      expect(query).toEqual({
        'properties.name.value': { $regex: '^[A-Z].*' },
      });
    });
  });

  describe('Exists operator', () => {
    it('should parse property exists', () => {
      const query = parseQuery('.description exists');
      expect(query).toEqual({
        'properties.description.value': { $exists: true },
      });
    });

    it('should parse negated exists with not', () => {
      const query = parseQuery('not .description exists');
      expect(query).toEqual({
        $nor: [{ 'properties.description.value': { $exists: true } }],
      });
    });
  });

  describe('Logical operators', () => {
    it('should parse AND', () => {
      const query = parseQuery('.type == "weapon" and .damage > 10');
      expect(query).toEqual({
        $and: [
          { 'properties.type.value': 'weapon' },
          { 'properties.damage.value': { $gt: 10 } },
        ],
      });
    });

    it('should parse OR', () => {
      const query = parseQuery('.type == "weapon" or .type == "armor"');
      expect(query).toEqual({
        $or: [
          { 'properties.type.value': 'weapon' },
          { 'properties.type.value': 'armor' },
        ],
      });
    });

    it('should parse NOT', () => {
      const query = parseQuery('not .hidden == true');
      expect(query).toEqual({
        $nor: [{ 'properties.hidden.value': true }],
      });
    });

    it('should handle multiple ANDs (left associative)', () => {
      const query = parseQuery('.a == 1 and .b == 2 and .c == 3');
      expect(query).toEqual({
        $and: [
          {
            $and: [{ 'properties.a.value': 1 }, { 'properties.b.value': 2 }],
          },
          { 'properties.c.value': 3 },
        ],
      });
    });

    it('should handle multiple ORs', () => {
      const query = parseQuery('.a == 1 or .b == 2 or .c == 3');
      expect(query).toEqual({
        $or: [
          {
            $or: [{ 'properties.a.value': 1 }, { 'properties.b.value': 2 }],
          },
          { 'properties.c.value': 3 },
        ],
      });
    });

    it('should respect operator precedence (AND before OR)', () => {
      const query = parseQuery('.a == 1 or .b == 2 and .c == 3');
      // Should be: .a == 1 or (.b == 2 and .c == 3)
      expect(query).toEqual({
        $or: [
          { 'properties.a.value': 1 },
          {
            $and: [{ 'properties.b.value': 2 }, { 'properties.c.value': 3 }],
          },
        ],
      });
    });
  });

  describe('Parentheses grouping', () => {
    it('should handle simple parentheses', () => {
      const query = parseQuery('(.name == "test")');
      expect(query).toEqual({ 'properties.name.value': 'test' });
    });

    it('should override precedence with parentheses', () => {
      const query = parseQuery('(.a == 1 or .b == 2) and .c == 3');
      expect(query).toEqual({
        $and: [
          {
            $or: [{ 'properties.a.value': 1 }, { 'properties.b.value': 2 }],
          },
          { 'properties.c.value': 3 },
        ],
      });
    });

    it('should handle nested parentheses', () => {
      const query = parseQuery('((.a == 1))');
      expect(query).toEqual({ 'properties.a.value': 1 });
    });

    it('should handle complex nested expression', () => {
      const query = parseQuery('(.a == 1 or .b == 2) and (.c == 3 or .d == 4)');
      expect(query).toEqual({
        $and: [
          {
            $or: [{ 'properties.a.value': 1 }, { 'properties.b.value': 2 }],
          },
          {
            $or: [{ 'properties.c.value': 3 }, { 'properties.d.value': 4 }],
          },
        ],
      });
    });
  });

  describe('Special properties', () => {
    it('should map .id to _id', () => {
      const query = parseQuery('.id == 42');
      expect(query).toEqual({ _id: 42 });
    });

    it('should keep .parent as direct field', () => {
      const query = parseQuery('.parent == 1');
      expect(query).toEqual({ parent: 1 });
    });

    it('should map regular properties to properties.X.value', () => {
      const query = parseQuery('.customProp == "value"');
      expect(query).toEqual({ 'properties.customProp.value': 'value' });
    });
  });

  describe('String literals', () => {
    it('should handle single quotes', () => {
      const query = parseQuery(".name == 'test'");
      expect(query).toEqual({ 'properties.name.value': 'test' });
    });

    it('should handle double quotes', () => {
      const query = parseQuery('.name == "test"');
      expect(query).toEqual({ 'properties.name.value': 'test' });
    });

    it('should handle escaped quotes', () => {
      const query = parseQuery('.name == "test\\"value"');
      expect(query).toEqual({ 'properties.name.value': 'test"value' });
    });

    it('should handle strings with spaces', () => {
      const query = parseQuery('.name == "Iron Sword"');
      expect(query).toEqual({ 'properties.name.value': 'Iron Sword' });
    });

    it('should handle empty strings', () => {
      const query = parseQuery('.name == ""');
      expect(query).toEqual({ 'properties.name.value': '' });
    });
  });

  describe('Error handling', () => {
    it('should throw on unterminated string', () => {
      expect(() => parseQuery('.name == "test')).toThrow('Unterminated string');
    });

    it('should throw on unexpected character', () => {
      expect(() => parseQuery('.name @@ "test"')).toThrow(
        'Unexpected character',
      );
    });

    it('should throw on missing operator', () => {
      expect(() => parseQuery('.name "test"')).toThrow('Expected operator');
    });

    it('should throw on missing value', () => {
      expect(() => parseQuery('.name ==')).toThrow('Expected value');
    });

    it('should throw on unclosed parenthesis', () => {
      expect(() => parseQuery('(.name == "test"')).toThrow('Expected RPAREN');
    });

    it('should throw on unexpected token at end', () => {
      expect(() => parseQuery('.name == "test" "extra"')).toThrow(
        'Unexpected token',
      );
    });

    it('should throw on missing property after dot', () => {
      expect(() => parseQuery('. == "test"')).toThrow('Expected IDENTIFIER');
    });
  });

  describe('Whitespace handling', () => {
    it('should handle extra whitespace', () => {
      const query = parseQuery('  .name   ==   "test"  ');
      expect(query).toEqual({ 'properties.name.value': 'test' });
    });

    it('should handle tabs and newlines', () => {
      const query = parseQuery('.name\t==\n"test"');
      expect(query).toEqual({ 'properties.name.value': 'test' });
    });
  });

  describe('Real-world queries', () => {
    it('should parse weapon query', () => {
      const query = parseQuery(
        '.type == "weapon" and .damage >= 10 and .weight < 5',
      );
      expect(query.$and).toBeDefined();
    });

    it('should parse item search', () => {
      const query = parseQuery(
        '.name contains "sword" or .name contains "blade"',
      );
      expect(query.$or).toBeDefined();
    });

    it('should parse player lookup', () => {
      const query = parseQuery('.parent == 10 and .type == "player"');
      expect(query).toEqual({
        $and: [{ parent: 10 }, { 'properties.type.value': 'player' }],
      });
    });

    it('should parse complex filter', () => {
      const query = parseQuery(
        '(.type == "weapon" or .type == "armor") and .owner == 42 and .level >= 5',
      );
      expect(query.$and).toBeDefined();
      // Parser is left-associative: ((A and B) and C) = 2 elements at top level
      expect(query.$and).toHaveLength(2);
      // Verify the structure contains all conditions
      expect(JSON.stringify(query)).toContain('weapon');
      expect(JSON.stringify(query)).toContain('armor');
      expect(JSON.stringify(query)).toContain('owner');
      expect(JSON.stringify(query)).toContain('level');
    });
  });
});
