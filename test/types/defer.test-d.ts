import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { expectTypeOf } from 'vitest';
import { render, renderDirective } from '@wismaz/vitest-browser-angular';
import type { DeferBlockStateConfig } from '@wismaz/vitest-browser-angular';
import { TypeFixtureComponent } from '../components/type-fixture.component';
import { ChangeClass } from '../directives/change-class';

describe('defer blocks', () => {
  test('accepts defer options', async () => {
    await render(TypeFixtureComponent, {
      deferBlockBehavior: DeferBlockBehavior.Manual,
      deferBlockStates: DeferBlockState.Complete,
    });
    await render(TypeFixtureComponent, {
      deferBlockStates: [{ deferBlockState: DeferBlockState.Loading, deferBlockIndex: 0 }],
    });
  });

  test('DeferBlockStateConfig matches shape', () => {
    expectTypeOf<DeferBlockStateConfig>().toEqualTypeOf<{
      deferBlockState: DeferBlockState;
      deferBlockIndex: number;
    }>();
  });

  test('rejects invalid defer options', async () => {
    // @ts-expect-error deferBlockStates only accepts DeferBlockState or DeferBlockStateConfig[]
    await render(TypeFixtureComponent, { deferBlockStates: 'Complete' });
    // @ts-expect-error deferBlockState is required and must be a DeferBlockState
    await render(TypeFixtureComponent, { deferBlockStates: [{ deferBlockIndex: 0 }] });
    // @ts-expect-error deferBlockIndex must be a number
    const badIndex: DeferBlockStateConfig['deferBlockIndex'] = '0';
    void badIndex;
  });

  test('renderDeferBlock exposed on results', async () => {
    const result = await render(TypeFixtureComponent);
    const { renderDeferBlock } = result;
    expectTypeOf(renderDeferBlock).toEqualTypeOf<
      (deferBlockState: DeferBlockState, deferBlockIndex?: number) => Promise<void>
    >();
    // @ts-expect-error renderDeferBlock only accepts DeferBlockState values
    renderDeferBlock('Complete');
    // @ts-expect-error deferBlockIndex must be a number
    renderDeferBlock(DeferBlockState.Complete, '0');

    const routed = await render(TypeFixtureComponent, { withRouting: true });
    expectTypeOf(routed.renderDeferBlock).toEqualTypeOf<
      (deferBlockState: DeferBlockState, deferBlockIndex?: number) => Promise<void>
    >();

    const directive = await renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
    });
    expectTypeOf(directive.renderDeferBlock).toEqualTypeOf<
      (deferBlockState: DeferBlockState, deferBlockIndex?: number) => Promise<void>
    >();
  });
});
