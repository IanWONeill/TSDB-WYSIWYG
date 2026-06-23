class SafeStorage {
  private memoryStore: Record<string, string> = {};
  private isSupported: boolean;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        this.isSupported = true;
      } else {
        this.isSupported = false;
      }
    } catch (e) {
      this.isSupported = false;
      console.warn('localStorage is not supported or restricted in this environment. Falling back to in-memory storage.');
    }
  }

  getItem(key: string): string | null {
    if (this.isSupported) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return this.memoryStore[key] || null;
      }
    }
    return this.memoryStore[key] || null;
  }

  setItem(key: string, value: string): void {
    if (this.isSupported) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    this.memoryStore[key] = String(value);
  }

  removeItem(key: string): void {
    if (this.isSupported) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    delete this.memoryStore[key];
  }

  clear(): void {
    if (this.isSupported) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    this.memoryStore = {};
  }
}

export const safeStorage = new SafeStorage();
