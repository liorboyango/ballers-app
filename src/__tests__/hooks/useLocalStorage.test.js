/**
 * Tests for useLocalStorage hook.
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useLocalStorage from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when key not in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when key exists in localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('updates value in state and localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('updated');
  });

  it('removes value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('handles objects correctly', () => {
    const { result } = renderHook(() => useLocalStorage('obj-key', {}));

    act(() => {
      result.current[1]({ name: 'Test', value: 42 });
    });

    expect(result.current[0]).toEqual({ name: 'Test', value: 42 });
    expect(JSON.parse(localStorage.getItem('obj-key'))).toEqual({ name: 'Test', value: 42 });
  });
});
