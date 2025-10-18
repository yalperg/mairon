import { EventEmitter } from '../../src/core/EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on/off', () => {
    it('should register and remove listeners', () => {
      const listener = jest.fn();

      emitter.on('test', listener);
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.off('test', listener);
      expect(emitter.listenerCount('test')).toBe(0);
    });

    it('should allow multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('should return false when removing non-existent listener', () => {
      const listener = jest.fn();
      const result = emitter.off('test', listener);
      expect(result).toBe(false);
    });

    it('should return true when successfully removing listener', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      const result = emitter.off('test', listener);
      expect(result).toBe(true);
    });
  });

  describe('emit', () => {
    it('should call all registered listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      emitter.emit('test', { data: 'value' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledWith({ data: 'value' });
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledWith({ data: 'value' });
    });

    it('should not throw if no listeners registered', () => {
      expect(() => emitter.emit('test', {})).not.toThrow();
    });

    it('should continue executing other listeners if one throws', () => {
      const listener1 = jest.fn(() => {
        throw new Error('Listener error');
      });
      const listener2 = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      emitter.emit('test', {});

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should emit without data', () => {
      const listener = jest.fn();
      emitter.on('test', listener);

      emitter.emit('test');

      expect(listener).toHaveBeenCalledWith(undefined);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.removeAllListeners('event1');

      expect(emitter.listenerCount('event1')).toBe(0);
      expect(emitter.listenerCount('event2')).toBe(1);
    });

    it('should remove all listeners for all events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.removeAllListeners();

      expect(emitter.listenerCount('event1')).toBe(0);
      expect(emitter.listenerCount('event2')).toBe(0);
      expect(emitter.eventNames()).toEqual([]);
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for events with no listeners', () => {
      expect(emitter.listenerCount('nonexistent')).toBe(0);
    });

    it('should return correct count', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('eventNames', () => {
    it('should return empty array when no events registered', () => {
      expect(emitter.eventNames()).toEqual([]);
    });

    it('should return all event names', () => {
      emitter.on('event1', jest.fn());
      emitter.on('event2', jest.fn());
      emitter.on('event3', jest.fn());

      const names = emitter.eventNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('event1');
      expect(names).toContain('event2');
      expect(names).toContain('event3');
    });
  });

  describe('edge cases', () => {
    it('should handle registering same listener multiple times', () => {
      const listener = jest.fn();

      emitter.on('test', listener);
      emitter.on('test', listener);

      expect(emitter.listenerCount('test')).toBe(1);

      emitter.emit('test', {});
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener that modifies listeners during emit', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn(() => {
        emitter.off('test', listener1);
      });

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      expect(() => emitter.emit('test', {})).not.toThrow();
    });
  });
});
