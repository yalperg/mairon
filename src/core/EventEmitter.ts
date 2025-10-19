type GenericListener<T> = (data: T) => void;

class EventEmitter<
  E extends string = string,
  M extends Record<E, unknown> = Record<E, unknown>,
> {
  private listeners: Map<E, Set<GenericListener<M[E]>>> = new Map();

  on(event: E, listener: GenericListener<M[E]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: E, listener: GenericListener<M[E]>): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return false;
    }
    return eventListeners.delete(listener);
  }

  emit(event: E): void;
  emit(event: E, data: M[E]): void;
  emit(event: E, data?: M[E]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    for (const listener of eventListeners) {
      try {
        listener(data as M[E]);
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    }
  }

  removeAllListeners(event?: E): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: E): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  eventNames(): E[] {
    return Array.from(this.listeners.keys());
  }
}

export default EventEmitter;
