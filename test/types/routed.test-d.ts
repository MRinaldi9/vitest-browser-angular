import { expectTypeOf } from 'vitest';
import { render } from '@wismaz/vitest-browser-angular';
import type { RenderResult, RoutedRenderResult } from '@wismaz/vitest-browser-angular';
import { TypeFixtureComponent } from '../components/type-fixture.component';

const routingFlag = true as boolean;

describe('routed render', () => {
  test('returns plain result without routing', async () => {
    const result = await render(TypeFixtureComponent, { inputs: { name: 'x' } });
    expectTypeOf(result).toEqualTypeOf<RenderResult<TypeFixtureComponent>>();
  });

  test('returns routed result with routing', async () => {
    const result = await render(TypeFixtureComponent, { withRouting: true });
    expectTypeOf(result).toEqualTypeOf<RoutedRenderResult<TypeFixtureComponent>>();
  });

  test('returns union for dynamic routing', async () => {
    const result = await render(TypeFixtureComponent, { withRouting: routingFlag });
    expectTypeOf(result).toEqualTypeOf<
      RenderResult<TypeFixtureComponent> | RoutedRenderResult<TypeFixtureComponent>
    >();
  });

  test('rejects inputs with withRouting: true', () => {
    // @ts-expect-error inputs are not allowed with withRouting: true
    render(TypeFixtureComponent, { withRouting: true, inputs: { name: 'x' } });
    // @ts-expect-error outputs are not allowed with a RoutingConfig
    render(TypeFixtureComponent, { withRouting: { routes: [] }, outputs: { onSave: () => {} } });
  });

  test('rejects inputs with dynamic withRouting', () => {
    // @ts-expect-error inputs are not allowed when withRouting is a generic boolean
    render(TypeFixtureComponent, { withRouting: routingFlag, inputs: { name: 'x' } });
  });
});
