import { Component, input, model, output, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { expectTypeOf } from 'vitest';
import { render } from '@wismaz/vitest-browser-angular';
import type {
  Inputs,
  Outputs,
  RenderResult,
  RoutedRenderResult,
} from '@wismaz/vitest-browser-angular';

@Component({
  selector: 'app-type-fixture',
  template: '',
})
export class TypeFixtureComponent {
  name = input('default');
  age = input(0);
  tags = input<string[]>([]);
  onSave = output<string>();
  onDelete = output<number>();
  count = model(0);
}

test('type inference for inputs and outputs', () => {
  expectTypeOf<Inputs<typeof TypeFixtureComponent>>().toEqualTypeOf<{
    name?: string | WritableSignal<string>;
    age?: number | WritableSignal<number>;
    tags?: string[] | WritableSignal<string[]>;
    count?: number | WritableSignal<number>;
  }>();

  expectTypeOf<Outputs<typeof TypeFixtureComponent>>().toEqualTypeOf<{
    onSave?: (value: string) => void;
    onDelete?: (value: number) => void;
  }>();
});

export async function rendersWithInputsAndOutputs() {
  render(TypeFixtureComponent, {
    inputs: { name: 'x', age: signal(30), tags: ['a'], count: signal(10) },
  });
  render(TypeFixtureComponent, {
    outputs: {
      onSave: (value: string) => {
        void value;
      },
    },
  });
}

export async function rejectsUnknownInputKeys() {
  // @ts-expect-error unknown input key
  render(TypeFixtureComponent, { inputs: { naem: 'x' } });
}

export async function rejectsWrongInputValueTypes() {
  // @ts-expect-error age only accepts number or WritableSignal<number>
  render(TypeFixtureComponent, { inputs: { age: 'not a number' } });
}

export async function rejectsUnknownOutputKeys() {
  // @ts-expect-error unknown output key
  render(TypeFixtureComponent, { outputs: { onWrong: () => {} } });
}

export async function rejectsWrongOutputHandlerTypes() {
  // @ts-expect-error handler param must be string
  render(TypeFixtureComponent, { outputs: { onSave: (_n: number) => {} } });
}

export async function rejectsInputsWithWithRouting() {
  // @ts-expect-error inputs are not allowed with withRouting: true
  render(TypeFixtureComponent, { withRouting: true, inputs: { name: 'x' } });
  // @ts-expect-error outputs are not allowed with a RoutingConfig
  render(TypeFixtureComponent, { withRouting: { routes: [] }, outputs: { onSave: () => {} } });
}

const withRoutingFlag: boolean = true;

export async function rejectsInputsWithDynamicWithRouting() {
  // @ts-expect-error inputs are not allowed when withRouting is a generic boolean
  render(TypeFixtureComponent, { withRouting: withRoutingFlag, inputs: { name: 'x' } });
}

export async function returnsPlainResult() {
  const result = await render(TypeFixtureComponent, { inputs: { name: 'x' } });
  expectTypeOf(result).toEqualTypeOf<RenderResult<TypeFixtureComponent>>();
}

export async function returnsRoutedResult() {
  const result = await render(TypeFixtureComponent, { withRouting: true });
  expectTypeOf(result).toEqualTypeOf<RoutedRenderResult<TypeFixtureComponent>>();
}

export async function returnsUnionForDynamicRouting() {
  const result = await render(TypeFixtureComponent, { withRouting: withRoutingFlag });
  expectTypeOf(result).toEqualTypeOf<
    RenderResult<TypeFixtureComponent> | RoutedRenderResult<TypeFixtureComponent>
  >();
}
