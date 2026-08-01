import { signal } from '@angular/core';
import { render } from '@wismaz/vitest-browser-angular';
import { ModelComponent } from './components/model.component';

describe('model inputs', () => {
  test('binds the initial value from a signal', async () => {
    const count = signal(0);
    const { locator } = await render(ModelComponent, {
      inputs: { count },
    });

    await expect.element(locator.getByTestId('model-value')).toHaveTextContent('Count: 0');
    expect(count()).toBe(0);
  });

  test('propagates child model updates back to the source signal', async () => {
    const count = signal(0);
    const { locator } = await render(ModelComponent, {
      inputs: { count },
    });

    await locator.getByRole('button', { name: 'Increment' }).click();

    expect(count()).toBe(1);
    await expect.element(locator.getByTestId('model-value')).toHaveTextContent('Count: 1');
  });

  test('accepts a plain value', async () => {
    const { getByTestId } = await render(ModelComponent, {
      inputs: { count: 5 },
    });

    await expect.element(getByTestId('model-value')).toHaveTextContent('Count: 5');
  });
});
