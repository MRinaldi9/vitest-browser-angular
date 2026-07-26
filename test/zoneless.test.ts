import { render } from '../src';
import { ZonelessComponent } from './components/zoneless.component';

describe('Zoneless Tests', () => {
  beforeEach(() => {
    vitest.useFakeTimers();
  });

  afterEach(() => {
    vitest.clearAllTimers();
  });

  test('updated count after 1 second, but not reflected in the DOM', async () => {
    const { componentClassInstance, locator } = await render(ZonelessComponent);
    const countElement = locator.getByTestId('count');
    expect(componentClassInstance.count).toBe(0);

    vitest.advanceTimersByTime(1000);
    expect(componentClassInstance.count).toBe(1);
    await expect.element(countElement).not.toHaveTextContent('Count: 1');
  });

  test('updated count with button clicks and reflected in the DOM', async () => {
    const { componentClassInstance, locator, fixture } = await render(ZonelessComponent);
    const countElement = locator.getByTestId('count');
    expect(componentClassInstance.count).toBe(0);

    const updateButton = locator.getByRole('button', {
      name: 'Update Count',
    });
    await updateButton.click();

    expect(componentClassInstance.count).toBe(1);
    fixture.detectChanges();
    await expect.element(countElement).toHaveTextContent('Count: 1');
  });
});
