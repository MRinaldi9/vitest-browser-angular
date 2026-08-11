import { Component, input, model, NO_ERRORS_SCHEMA, output, signal } from '@angular/core';
import type { ProviderToken, WritableSignal } from '@angular/core';
import type { HttpTestingController } from '@angular/common/http/testing';
import { expectTypeOf } from 'vitest';
import { render, renderDirective } from '@wismaz/vitest-browser-angular';
import type {
  DirectiveRenderResult,
  Inputs,
  Outputs,
  RenderResult,
  RoutedRenderResult,
} from '@wismaz/vitest-browser-angular';
import { ChangeClass } from './directives/change-class';

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

export async function acceptsUnknownInputKeys() {
  render(TypeFixtureComponent, { inputs: { naem: 'x' } });
}

export async function rejectsWrongInputValueTypes() {
  // @ts-expect-error age only accepts number or WritableSignal<number>
  render(TypeFixtureComponent, { inputs: { age: 'not a number' } });
}

export async function acceptsUnknownOutputKeys() {
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

export async function acceptsOverrideProvidersComponent() {
  render(TypeFixtureComponent, {
    overrideProvidersComponent: [
      {
        replace: TypeFixtureComponent,
        with: { provide: TypeFixtureComponent, useClass: TypeFixtureComponent },
      },
    ],
  });
}

export async function rejectsRemovedComponentProviders() {
  // @ts-expect-error componentProviders was removed in favor of overrideProvidersComponent
  render(TypeFixtureComponent, { componentProviders: [TypeFixtureComponent] });
}

export async function rejectsMalformedOverrideProvidersComponent() {
  render(TypeFixtureComponent, {
    // @ts-expect-error replace must be a provider
    overrideProvidersComponent: [{ replace: 'nope', with: TypeFixtureComponent }],
  });
}

export async function acceptsSharedRenderOptions() {
  renderDirective(ChangeClass, {
    template: `<button test>Test</button>`,
    withHttp: true,
    schema: NO_ERRORS_SCHEMA,
    removeAngularAttributes: true,
    overrideImportsDirective: [{ replace: ChangeClass, with: ChangeClass }],
    overrideProvidersDirective: [
      { replace: ChangeClass, with: { provide: ChangeClass, useClass: ChangeClass } },
    ],
  });
}

export async function rejectsRoutingOptions() {
  // @ts-expect-error withRouting is not allowed on renderDirective
  renderDirective(ChangeClass, { template: `<button test>Test</button>`, withRouting: true });
  // @ts-expect-error inputs are not allowed on renderDirective
  renderDirective(ChangeClass, { template: `<button test>Test</button>`, inputs: {} });
  // @ts-expect-error outputs are not allowed on renderDirective
  renderDirective(ChangeClass, { template: `<button test>Test</button>`, outputs: {} });
  // @ts-expect-error inferTagName is not allowed on renderDirective
  renderDirective(ChangeClass, { template: `<button test>Test</button>`, inferTagName: true });
}

export async function directiveResultExposesInjectAndHttpTesting() {
  const result = await renderDirective(ChangeClass, {
    template: `<button test>Test</button>`,
    withHttp: true,
  });

  expectTypeOf(result).toEqualTypeOf<DirectiveRenderResult<ChangeClass>>();
  expectTypeOf(result.inject).toEqualTypeOf<<T>(token: ProviderToken<T>) => T>();
  expectTypeOf(result.httpTesting).toEqualTypeOf<HttpTestingController | undefined>();
}
