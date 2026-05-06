/**
 * useDebounce — delays updating a value until after a specified delay.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @param {*} value - value to debounce
 * @param {number} delay - delay in milliseconds
 * @returns {*} debounced value
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 */
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
