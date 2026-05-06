/**
 * Tests for useDebounce hook.
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useDebounce from '../../hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Before delay, value should still be 'initial'
    expect(result.current).toBe('initial');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'second' });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'final' });
    act(() => { jest.advanceTimersByTime(300); });

    expect(result.current).toBe('final');
  });
});
