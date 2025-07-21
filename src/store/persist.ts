
import { StateStorage } from 'zustand/middleware';

// Define a type for the persist options
export interface PersistOptions<T> {
  name: string;
  storage?: StateStorage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T | undefined) => ((state: T | undefined, error: Error | undefined) => void) | void;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T | Promise<T>;
  merge?: (persistedState: unknown, currentState: T) => T;
}

// Define the persist middleware function
export const persist = <T>(config: PersistOptions<T>) => (
  set: Function,
  get: Function,
  api: any
) => {
  // Implementation of persist middleware
  const defaultStorage: StateStorage = {
    getItem: (name: string): string | null => {
      try {
        const value = localStorage.getItem(name);
        return value;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.error(error);
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error(error);
      }
    },
  };

  const storage = config.storage || defaultStorage;
  const storageKey = config.name;

  // Load state from storage on initialization
  let state: T | undefined;
  try {
    const persistedState = storage.getItem(storageKey);
    if (persistedState) {
      state = typeof persistedState === 'string' 
        ? JSON.parse(persistedState) 
        : persistedState;
    }
  } catch (error) {
    console.error(error);
  }

  // Create a new setState function that persists state
  const persistedSet = (
    newState: T | ((state: T) => T),
    replace?: boolean
  ) => {
    const currentState = get();
    const updatedState = typeof newState === 'function'
      ? (newState as Function)(currentState)
      : newState;
    
    // Call the original set function
    set(updatedState, replace);
    
    // Persist to storage
    try {
      const stateToPersist = config.partialize 
        ? config.partialize({ ...currentState, ...updatedState })
        : { ...currentState, ...updatedState };
      storage.setItem(storageKey, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error(error);
    }
  };

  // Return the state and functions
  return {
    ...api,
    state: state,
    set: persistedSet,
  };
};
