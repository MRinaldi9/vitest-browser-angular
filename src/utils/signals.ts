import { isSignal, WritableSignal } from '@angular/core';

/**
 * Checks if the provided value is a writable signal.
 * @param value The value to check.
 * @returns `true` if the value is a writable signal, `false` otherwise.
 */
export function isWSignal<T>(value: unknown): value is WritableSignal<T> {
  return isSignal(value) && 'set' in value && 'update' in value;
}
