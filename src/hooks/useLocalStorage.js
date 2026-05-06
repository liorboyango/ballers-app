/**
 * useLocalStorage — custom hook for synced localStorage state.
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if key not found
 * @returns {[value, setValue, removeValue]} tuple
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
import { useState, useCallback } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Set value in state and localStorage.
   * @param {*} value - new value or updater function
   */
  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`useLocalStorage: error setting key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Remove value from localStorage and reset to initial.
   */
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`useLocalStorage: error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
