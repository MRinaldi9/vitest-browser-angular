import { isSignal, ModelSignal, WritableSignal } from '@angular/core';

/**
 * Checks if the provided value is a writable signal.
 * @param value The value to check.
 * @returns `true` if the value is a writable signal, `false` otherwise.
 */
export function isWSignal<T>(value: unknown): value is WritableSignal<T> {
  return isSignal(value) && 'set' in value && 'update' in value;
}

/**
 * Checks if the provided value is a model signal.
 *
 * A `ModelSignal` is a writable signal that also implements `OutputRef`, so it can be
 * distinguished from a regular signal input by the presence of `subscribe`.
 *
 * @param value The value to check.
 * @returns `true` if the value is a model signal, `false` otherwise.
 */
export function isModelSignal<T>(value: unknown): value is ModelSignal<T> {
  return isSignal(value) && 'set' in value && 'subscribe' in value;
}
