import { generateId, debounce, throttle, clamp, isValidJSON } from '../index';

describe('Shared Utils', () => {
  describe('generateId', () => {
    it('should generate valid UUID format', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous timeout when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('first');
      jest.advanceTimersByTime(200);

      debouncedFn('second');
      jest.advanceTimersByTime(200);

      debouncedFn('third');
      jest.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle multiple arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn('test');
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should throttle subsequent calls within the limit', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');
    });

    it('should allow execution after throttle period', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);

      throttledFn('second');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 1, 10)).toBe(5);
      expect(clamp(1, 1, 10)).toBe(1);
      expect(clamp(10, 1, 10)).toBe(10);
    });

    it('should clamp to minimum when value is too low', () => {
      expect(clamp(-5, 1, 10)).toBe(1);
      expect(clamp(0, 1, 10)).toBe(1);
    });

    it('should clamp to maximum when value is too high', () => {
      expect(clamp(15, 1, 10)).toBe(10);
      expect(clamp(100, 1, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(5, -10, -1)).toBe(-1);
    });

    it('should handle decimal values', () => {
      expect(clamp(1.5, 1.2, 1.8)).toBe(1.5);
      expect(clamp(1.0, 1.2, 1.8)).toBe(1.2);
      expect(clamp(2.0, 1.2, 1.8)).toBe(1.8);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
      expect(clamp(1, 3, 3)).toBe(3);
      expect(clamp(3, 3, 3)).toBe(3);
    });
  });

  describe('isValidJSON', () => {
    it('should return true for valid JSON strings', () => {
      expect(isValidJSON('{}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('true')).toBe(true);
      expect(isValidJSON('false')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isValidJSON('{')).toBe(false);
      expect(isValidJSON('}')).toBe(false);
      expect(isValidJSON('{"key": value}')).toBe(false);
      expect(isValidJSON("{'key': 'value'}")).toBe(false);
      expect(isValidJSON('[1, 2, 3,]')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('')).toBe(false);
      expect(isValidJSON('hello world')).toBe(false);
    });

    it('should handle complex nested JSON', () => {
      const complexJSON = JSON.stringify({
        users: [
          { id: 1, name: 'John', active: true },
          { id: 2, name: 'Jane', active: false },
        ],
        meta: {
          total: 2,
          page: 1,
          filters: null,
        },
      });

      expect(isValidJSON(complexJSON)).toBe(true);
    });

    it('should handle JSON with special characters', () => {
      expect(isValidJSON('{"unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"}')).toBe(true);
      expect(isValidJSON('{"escaped": "line1\\nline2\\ttab"}')).toBe(true);
      expect(isValidJSON('{"quotes": "\\"quoted\\""}')).toBe(true);
    });
  });
});
