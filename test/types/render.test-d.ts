import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { expectTypeOf } from 'vitest';
import { render } from '@wismaz/vitest-browser-angular';
import type { Inputs, Outputs } from '@wismaz/vitest-browser-angular';
import { TypeFixtureComponent } from '../components/type-fixture.component';

describe('render', () => {
  test('type inference for inputs and outputs', () => {
    expectTypeOf<Inputs<typeof TypeFixtureComponent>>().toEqualTypeOf<
      {
        name?: string | WritableSignal<string>;
        age?: number | WritableSignal<number>;
        tags?: string[] | WritableSignal<string[]>;
        count?: number | WritableSignal<number>;
      } & Record<string, unknown>
    >();

    expectTypeOf<Outputs<typeof TypeFixtureComponent>>().toEqualTypeOf<
      {
        onSave?: (value: string) => void;
        onDelete?: (value: number) => void;
      } & Record<string, unknown>
    >();
  });

  test('accepts inputs and outputs', async () => {
    await render(TypeFixtureComponent, {
      inputs: { name: 'x', age: signal(30), tags: ['a'], count: signal(10) },
    });
    await render(TypeFixtureComponent, {
      outputs: {
        onSave: (value: string) => {
          void value;
        },
      },
    });
  });

  test('accepts unknown input keys', async () => {
    await render(TypeFixtureComponent, { inputs: { naem: 'x' } });
  });

  test('rejects wrong input value types', async () => {
    // @ts-expect-error age only accepts number or WritableSignal<number>
    await render(TypeFixtureComponent, { inputs: { age: 'not a number' } });
  });

  test('accepts unknown output keys', async () => {
    await render(TypeFixtureComponent, { outputs: { onWrong: () => {} } });
  });

  test('rejects wrong output handler types', async () => {
    // @ts-expect-error handler param must be string
    await render(TypeFixtureComponent, { outputs: { onSave: (_n: number) => {} } });
  });
});
