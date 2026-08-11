import { NO_ERRORS_SCHEMA } from '@angular/core';
import type { ProviderToken } from '@angular/core';
import type { HttpTestingController } from '@angular/common/http/testing';
import { expectTypeOf } from 'vitest';
import { renderDirective } from '@wismaz/vitest-browser-angular';
import type { DirectiveRenderResult } from '@wismaz/vitest-browser-angular';
import { ChangeClass } from '../directives/change-class';

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
    // @ts-expect-error inputs are not allowed on renderDirective
    renderDirective(ChangeClass, { template: `<button test>Test</button>`, inputs: {} });
    // @ts-expect-error outputs are not allowed on renderDirective
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
  });
});
