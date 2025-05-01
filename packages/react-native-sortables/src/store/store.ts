type Listener = () => void;

class ReactiveStore {
  private listeners = new Map<string, Set<Listener>>();
  private values = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    const value = this.values.get(key);
    return value as T | undefined;
  }

  set<T>(key: string, value: T): void {
    const oldValue = this.values.get(key);
    if (oldValue !== value) {
      this.values.set(key, value);
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        for (const listener of keyListeners) {
          listener();
        }
      }
    }
  }

  subscribe(key: string, listener: Listener): () => void {
    let keyListeners = this.listeners.get(key);
    if (!keyListeners) {
      keyListeners = new Set();
      this.listeners.set(key, keyListeners);
    }
    keyListeners.add(listener);

    return () => {
      keyListeners!.delete(listener);
      if (keyListeners!.size === 0) {
        this.listeners.delete(key);
      }
    };
  }
}

export function createStore() {
  return new ReactiveStore();
}
