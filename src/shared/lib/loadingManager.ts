// src/services/loadingManager.ts
type Listener = (isLoading: boolean) => void;

class LoadingManager {
  private count = 0;
  private listeners = new Set<Listener>();

  start() {
    this.count++;
    this.notify();
  }

  stop() {
    this.count = Math.max(0, this.count - 1);
    this.notify();
  }

  private notify() {
    const value = this.count > 0;
    this.listeners.forEach((listener) => listener(value));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    // já manda o estado atual
    listener(this.count > 0);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const loadingManager = new LoadingManager();