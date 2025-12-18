import * as moment from 'moment-timezone';
import {
  PLATFORM_TIMEZONE,
  toET,
  toUTC,
  formatET,
  nowET,
  isWithinRange,
  parseETToUTC,
  startOfDayET,
  endOfDayET,
  addHours,
  addDays,
  diffDays,
  diffHours,
  isTimeReached,
  formatTimeRemaining,
} from './timezone.util';

describe('Timezone Utilities', () => {
  describe('PLATFORM_TIMEZONE', () => {
    it('should be America/Toronto', () => {
      expect(PLATFORM_TIMEZONE).toBe('America/Toronto');
    });
  });

  describe('toET', () => {
    it('should convert UTC to ET', () => {
      const utcDate = new Date('2026-06-01T04:00:00Z'); // 4 AM UTC
      const etDate = toET(utcDate);
      const etMoment = moment(etDate).tz(PLATFORM_TIMEZONE);
      
      // In June, ET is EDT (UTC-4), so 4 AM UTC = 0 AM EDT
      expect(etMoment.hour()).toBe(0);
    });
  });

  describe('toUTC', () => {
    it('should convert ET to UTC', () => {
      // Create a date in ET
      const etDate = moment.tz('2026-06-01 00:00:00', 'YYYY-MM-DD HH:mm:ss', PLATFORM_TIMEZONE).toDate();
      const utcDate = toUTC(etDate);
      const utcMoment = moment.utc(utcDate);
      
      // 0 AM EDT = 4 AM UTC
      expect(utcMoment.hour()).toBe(4);
    });
  });

  describe('formatET', () => {
    it('should format date in ET with timezone', () => {
      const date = new Date('2026-06-01T04:00:00Z');
      const formatted = formatET(date);
      
      expect(formatted).toMatch(/2026-06-01 00:00:00 EDT/);
    });

    it('should handle EST vs EDT correctly', () => {
      // January (EST - UTC-5)
      const winterDate = new Date('2026-01-01T05:00:00Z');
      const winterFormatted = formatET(winterDate);
      expect(winterFormatted).toMatch(/EST/);
      
      // June (EDT - UTC-4)
      const summerDate = new Date('2026-06-01T04:00:00Z');
      const summerFormatted = formatET(summerDate);
      expect(summerFormatted).toMatch(/EDT/);
    });
  });

  describe('nowET', () => {
    it('should return current time', () => {
      const before = Date.now();
      const now = nowET();
      const after = Date.now();
      
      expect(now.getTime()).toBeGreaterThanOrEqual(before);
      expect(now.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('isWithinRange', () => {
    it('should return true when date is within range', () => {
      const date = new Date('2026-06-15T00:00:00Z');
      const start = new Date('2026-06-01T00:00:00Z');
      const end = new Date('2026-06-30T23:59:59Z');
      
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return true when date equals start', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const start = new Date('2026-06-01T00:00:00Z');
      const end = new Date('2026-06-30T23:59:59Z');
      
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return true when date equals end', () => {
      const date = new Date('2026-06-30T23:59:59Z');
      const start = new Date('2026-06-01T00:00:00Z');
      const end = new Date('2026-06-30T23:59:59Z');
      
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return false when date is before range', () => {
      const date = new Date('2026-05-31T23:59:59Z');
      const start = new Date('2026-06-01T00:00:00Z');
      const end = new Date('2026-06-30T23:59:59Z');
      
      expect(isWithinRange(date, start, end)).toBe(false);
    });

    it('should return false when date is after range', () => {
      const date = new Date('2026-07-01T00:00:00Z');
      const start = new Date('2026-06-01T00:00:00Z');
      const end = new Date('2026-06-30T23:59:59Z');
      
      expect(isWithinRange(date, start, end)).toBe(false);
    });
  });

  describe('parseETToUTC', () => {
    it('should parse ET string to UTC date', () => {
      const etString = '2026-06-01 00:00:00';
      const utcDate = parseETToUTC(etString);
      const utcMoment = moment.utc(utcDate);
      
      // 0 AM EDT = 4 AM UTC
      expect(utcMoment.hour()).toBe(4);
    });
  });

  describe('startOfDayET', () => {
    it('should return start of day in ET as UTC', () => {
      const date = new Date('2026-06-15T12:00:00Z');
      const startOfDay = startOfDayET(date);
      const etMoment = moment(startOfDay).tz(PLATFORM_TIMEZONE);
      
      expect(etMoment.hour()).toBe(0);
      expect(etMoment.minute()).toBe(0);
      expect(etMoment.second()).toBe(0);
    });
  });

  describe('endOfDayET', () => {
    it('should return end of day in ET as UTC', () => {
      const date = new Date('2026-06-15T12:00:00Z');
      const endOfDay = endOfDayET(date);
      const etMoment = moment(endOfDay).tz(PLATFORM_TIMEZONE);
      
      expect(etMoment.hour()).toBe(23);
      expect(etMoment.minute()).toBe(59);
      expect(etMoment.second()).toBe(59);
    });
  });

  describe('addHours', () => {
    it('should add hours to a date', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const newDate = addHours(date, 24);
      
      expect(newDate.getTime()).toBe(date.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should subtract hours with negative value', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const newDate = addHours(date, -24);
      
      expect(newDate.getTime()).toBe(date.getTime() - 24 * 60 * 60 * 1000);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const newDate = addDays(date, 14);
      
      expect(newDate.getTime()).toBe(date.getTime() + 14 * 24 * 60 * 60 * 1000);
    });
  });

  describe('diffDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2026-06-30T00:00:00Z');
      const date2 = new Date('2026-06-01T00:00:00Z');
      
      expect(diffDays(date1, date2)).toBe(29);
    });

    it('should return negative for past dates', () => {
      const date1 = new Date('2026-06-01T00:00:00Z');
      const date2 = new Date('2026-06-30T00:00:00Z');
      
      expect(diffDays(date1, date2)).toBe(-29);
    });
  });

  describe('diffHours', () => {
    it('should calculate difference in hours', () => {
      const date1 = new Date('2026-06-01T24:00:00Z');
      const date2 = new Date('2026-06-01T00:00:00Z');
      
      expect(diffHours(date1, date2)).toBe(24);
    });
  });

  describe('isTimeReached', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      expect(isTimeReached(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2099-01-01T00:00:00Z');
      expect(isTimeReached(futureDate)).toBe(false);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format days and hours', () => {
      const future = addDays(nowET(), 5);
      const formatted = formatTimeRemaining(future);
      
      expect(formatted).toContain('day');
    });

    it('should return "Ended" for past dates', () => {
      const past = addDays(nowET(), -5);
      const formatted = formatTimeRemaining(past);
      
      expect(formatted).toBe('Ended');
    });

    it('should handle hours and minutes for short durations', () => {
      const future = addHours(nowET(), 2);
      const formatted = formatTimeRemaining(future);
      
      expect(formatted).toContain('hour');
    });
  });
});
