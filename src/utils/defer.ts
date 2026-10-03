import type { DeferBlockFixture, DeferBlockState } from '@angular/core/testing';

import { VitestBrowserAngularError } from '../errors/vitest-browser-angular';
import type { DeferBlockStateConfig } from '../types/render';

/** Fixture shape required to drive `@defer` blocks. */
interface DeferBlocksFixture {
  getDeferBlocks(): Promise<DeferBlockFixture[]>;
}

/**
 * @internal
 * Renders one (or all) `@defer` blocks of a fixture in the given state.
 *
 * With no `deferBlockIndex`, every defer block is rendered in the given state.
 */
export async function renderDeferBlockState(
  fixture: DeferBlocksFixture,
  deferBlockState: DeferBlockState,
  deferBlockIndex?: number,
) {
  const deferBlockFixtures = await fixture.getDeferBlocks();

  if (deferBlockIndex !== undefined) {
    if (deferBlockIndex < 0) {
      throw new VitestBrowserAngularError('deferBlockIndex must be a positive number.');
    }
    const deferBlockFixture = deferBlockFixtures[deferBlockIndex];
    if (!deferBlockFixture) {
      throw new VitestBrowserAngularError(
        `Could not find a deferrable block with index '${deferBlockIndex}'.`,
      );
    }
    await deferBlockFixture.render(deferBlockState);
    return;
  }

  for (const deferBlockFixture of deferBlockFixtures) {
    await deferBlockFixture.render(deferBlockState);
  }
}

/**
 * @internal
 * Applies the initial `deferBlockStates` option after render.
 */
export async function renderDeferBlockStates(
  fixture: DeferBlocksFixture,
  deferBlockStates: DeferBlockState | Array<DeferBlockStateConfig>,
) {
  if (Array.isArray(deferBlockStates)) {
    for (const { deferBlockState, deferBlockIndex } of deferBlockStates) {
      await renderDeferBlockState(fixture, deferBlockState, deferBlockIndex);
    }
  } else {
    await renderDeferBlockState(fixture, deferBlockStates);
  }
}
