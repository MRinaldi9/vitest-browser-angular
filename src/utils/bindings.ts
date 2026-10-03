import { inputBinding, outputBinding, signal } from '@angular/core';
import type { Type, WritableSignal } from '@angular/core';

import { VitestBrowserAngularError } from '../errors/vitest-browser-angular';
import type { Inputs, Outputs } from '../types/render';
import { isModelSignal, isWSignal } from './signals';

/**
 * @internal
 * A minimal fixture shape, satisfied both by Angular's `ComponentFixture`/`DirectiveFixture`
 * and by the emulated directive fixture.
 */
interface ChangeDetectionFixture {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}

/**
 * @param inputsBinding Signal input values keyed by component/directive property
 * @param outputsBinding Output handler functions keyed by component/directive property
 * @returns Flat binding array plus the writable signals backing the inputs
 * @internal
 * Builds binding configs for `TestBed.createComponent()` / `TestBed.createDirective()` from the
 * render options.
 *
 * Map entries through `inputBinding()` / `outputBinding()` — signal values are
 * passed as-is, plain values are wrapped in a factory.
 */
export function createBindings<C extends Type<unknown>>(
  inputsBinding: Inputs<C> = {},
  outputsBinding: Outputs<C> = {},
) {
  const inputSignals: Record<string, WritableSignal<unknown>> = {};
  const inputBindings = Object.entries(inputsBinding).map(([key, value]) => {
    const tmpSignal = isWSignal(value) ? value : signal(value);
    inputSignals[key] = tmpSignal;
    return inputBinding(key, tmpSignal);
  });
  const outputBindings = Object.entries(outputsBinding).map(([key, value]) =>
    outputBinding(key, value as (v: unknown) => unknown),
  );
  return { inputSignals, bindings: [...inputBindings, ...outputBindings] };
}

/**
 * @internal
 * Wires model input write-back after the instance exists.
 *
 * `inputBinding()` already covers the input side of model inputs (they are `InputSignal`s).
 * Subscribing to the model's `Change` output keeps the source signal in sync when the
 * instance updates the model, mirroring Angular's `twoWayBinding()`.
 */
export function attachModelWriteBack(
  instance: Record<string, unknown>,
  inputSignals: Record<string, WritableSignal<unknown>>,
) {
  for (const key of Object.keys(inputSignals)) {
    const prop = instance[key];
    if (isModelSignal(prop)) {
      prop.subscribe(value => inputSignals[key].set(value));
    }
  }
}

/**
 * @param fixture - Fixture used to run change detection.
 * @param inputSignals - Signals created by `createBindings()`.
 * @param subject - Noun used in the error message when an unknown input is passed.
 * @internal
 * Builds the `rerender()` helper: pushes new values into the input signals created for the
 * initial render, then runs change detection until the view is stable.
 */
export function createRerender<C extends Type<unknown>>(
  fixture: ChangeDetectionFixture,
  inputSignals: Record<string, WritableSignal<unknown>>,
  subject: 'component' | 'directive' = 'component',
): (newInputs: Inputs<C>) => Promise<void> {
  return async (newInputs: Inputs<C>) => {
    for (const [key, value] of Object.entries(newInputs)) {
      if (key in inputSignals) {
        inputSignals[key].set(value);
      } else {
        throw new VitestBrowserAngularError(
          `Cannot rerender ${subject} with input "${key}" because it was not provided in the initial render options.`,
        );
      }
    }
    fixture.detectChanges();
    await fixture.whenStable();
  };
}
