import type { HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import type { ProviderToken, Type } from '@angular/core';
import type { DirectiveFixture } from '@angular/core/testing';
import { renderDirective } from '@wismaz/vitest-browser-angular';
import type {
  DirectiveFixtureLike,
  DirectiveRenderResult,
  Inputs,
} from '@wismaz/vitest-browser-angular';
import { expectTypeOf } from 'vitest';

import { ChangeClass } from '../directives/change-class';
import { Highlight } from '../directives/highlight';

describe('renderDirective', () => {
  test('accepts shared render options', async () => {
    await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      withHttp: true,
      schema: NO_ERRORS_SCHEMA,
      removeAngularAttributes: true,
      overrideImportsDirective: [{ replace: ChangeClass, with: ChangeClass }],
      overrideProvidersDirective: [
        { replace: ChangeClass, with: { provide: ChangeClass, useClass: ChangeClass } },
      ],
    });
  });

  test('rejects routing options', () => {
    // @ts-expect-error withRouting is not allowed on renderDirective
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, withRouting: true });
    // @ts-expect-error inputs are not allowed with a template
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, inputs: {} });
    // @ts-expect-error outputs are not allowed with a template
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, outputs: {} });
    // @ts-expect-error inferTagName is not allowed on renderDirective
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, inferTagName: true });
  });

  test('result exposes inject and httpTesting', async () => {
    const result = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      withHttp: true,
    });

    expectTypeOf(result).toEqualTypeOf<DirectiveRenderResult<ChangeClass>>();
    expectTypeOf(result.inject).toEqualTypeOf<<T>(token: ProviderToken<T>) => T>();
    expectTypeOf(result.httpTesting).toEqualTypeOf<HttpTestingController | undefined>();
    expectTypeOf(result.fixture).toEqualTypeOf<DirectiveFixtureLike<ChangeClass>>();
    expectTypeOf(result.fixture.directiveInstance).toEqualTypeOf<ChangeClass>();
  });
});

describe('renderDirective without a template', () => {
  test('accepts host options', async () => {
    await renderDirective(ChangeClass, {
      tagName: 'button',
      inputs: { className: 'red' },
      outputs: { blurred: () => {} },
      providers: [{ provide: 'token', useValue: 1 }],
      withHttp: true,
      removeAngularAttributes: true,
      overrideProvidersDirective: [
        { replace: ChangeClass, with: { provide: ChangeClass, useClass: ChangeClass } },
      ],
    });

    await renderDirective(Highlight);
  });

  test('rejects template-only options', () => {
    // @ts-expect-error template is not allowed without a host element
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, tagName: 'button' });
    // @ts-expect-error hostProps is not allowed without a template
    renderDirective(ChangeClass, { tagName: 'button', hostProps: {} });
    // @ts-expect-error changeDetection is not allowed without a template
    renderDirective(ChangeClass, { tagName: 'button', changeDetection: 'eager' });
    // @ts-expect-error schema is not allowed without a template
    renderDirective(ChangeClass, { tagName: 'button', schema: NO_ERRORS_SCHEMA });
    // @ts-expect-error deferBlockStates is not allowed without a template
    renderDirective(ChangeClass, { tagName: 'button', deferBlockStates: 0 });
    // @ts-expect-error withRouting is not allowed on renderDirective
    renderDirective(ChangeClass, { tagName: 'button', withRouting: true });
  });

  test('result exposes the unified fixture surface', async () => {
    const result = await renderDirective(ChangeClass, { tagName: 'button' });

    expectTypeOf(result).toEqualTypeOf<DirectiveRenderResult<ChangeClass>>();
    expectTypeOf(result.directiveInstance).toEqualTypeOf<ChangeClass>();
    expectTypeOf(result.fixture).toEqualTypeOf<DirectiveFixtureLike<ChangeClass>>();
    expectTypeOf(result.hostElement).toEqualTypeOf<HTMLElement>();
    expectTypeOf(result.fixture.whenStable).toBeFunction();
    expectTypeOf(result.fixture.detectChanges).toBeFunction();
    expectTypeOf(result.fixture.onDestroy).toBeFunction();
    expectTypeOf(result.rerender).parameter(0).toEqualTypeOf<Inputs<Type<ChangeClass>>>();
  });

  test("Angular's DirectiveFixture satisfies the fixture surface", () => {
    expectTypeOf<DirectiveFixture<ChangeClass>>().toExtend<DirectiveFixtureLike<ChangeClass>>();
  });
});
