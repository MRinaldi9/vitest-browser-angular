import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { render } from '@wismaz/vitest-browser-angular';
import { DeferComponent, DeferInteractionComponent } from './components/defer.component';

describe('Defer Blocks', () => {
  test('renders placeholders by default and defers content', async () => {
    const { container, locator } = await render(DeferComponent);

    await expect.element(locator.getByTestId('placeholder-a')).toHaveTextContent('Placeholder A');
    await expect.element(locator.getByTestId('placeholder-b')).toHaveTextContent('Placeholder B');
    expect(container.textContent).not.toContain('Deferred content');
  });

  test('renderDeferBlock(Complete) renders all deferred content', async () => {
    const { container, renderDeferBlock } = await render(DeferComponent);

    await renderDeferBlock(DeferBlockState.Complete);

    expect(container.textContent).toContain('Deferred content A');
    expect(container.textContent).toContain('Deferred content B');
  });

  test('renderDeferBlock(Complete, index) targets a single block', async () => {
    const { container, renderDeferBlock } = await render(DeferComponent);

    await renderDeferBlock(DeferBlockState.Complete, 0);

    expect(container.textContent).toContain('Deferred content A');
    expect(container.textContent).not.toContain('Deferred content B');
    expect(container.textContent).toContain('Placeholder B');
  });

  test('deferBlockStates renders blocks in the requested state on render', async () => {
    const { container } = await render(DeferComponent, {
      deferBlockStates: DeferBlockState.Complete,
    });

    expect(container.textContent).toContain('Deferred content A');
    expect(container.textContent).toContain('Deferred content B');
  });

  test('deferBlockStates supports targeting blocks by index', async () => {
    const { container } = await render(DeferComponent, {
      deferBlockStates: [{ deferBlockState: DeferBlockState.Loading, deferBlockIndex: 1 }],
    });

    expect(container.textContent).toContain('Placeholder A');
    expect(container.textContent).toContain('Loading B...');
    expect(container.textContent).not.toContain('Deferred content');
  });

  test('renderDeferBlock with a missing index throws', async () => {
    const { renderDeferBlock } = await render(DeferComponent);

    await expect(renderDeferBlock(DeferBlockState.Complete, 5)).rejects.toThrow(
      "Could not find a deferrable block with index '5'",
    );
  });

  test('deferBlockBehavior: Playthrough lets triggers play through', async () => {
    const { locator } = await render(DeferInteractionComponent, {
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    });

    await expect.element(locator.getByTestId('show')).toBeVisible();
    await locator.getByTestId('show').click();
    await expect
      .element(locator.getByTestId('deferred-interaction'))
      .toHaveTextContent('Interaction content');
  });
});
