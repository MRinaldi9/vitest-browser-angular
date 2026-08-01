/* oxlint-disable typescript/no-explicit-any */
import { signal } from '@angular/core';
import { render } from '@wismaz/vitest-browser-angular';
import { HelloWorldComponent } from './components/hello-world.component';
import { ProductComponent } from './components/product.component';
import { RoutedComponent } from './components/routed.component';
import { UserProfileComponent } from './components/user-profile.component';

test('render', async () => {
  const { locator } = await render(HelloWorldComponent);
  await expect.element(locator).toHaveTextContent('Hello World');
});

test('render with inputs (signal-based)', async () => {
  const { getByRole, getByText } = await render(UserProfileComponent, {
    inputs: {
      name: 'Jane Doe',
      age: 30,
      email: 'jane@example.com',
      isActive: true,
    },
  });

  await expect.element(getByRole('heading', { name: 'Jane Doe' })).toBeVisible();
  await expect.element(getByText('Age: 30')).toBeVisible();
  await expect.element(getByText('Email: jane@example.com')).toBeVisible();
  await expect.element(getByText('Status: Active')).toBeVisible();
  await expect.element(getByText('Jane Doe (30 years old) - jane@example.com')).toBeVisible();
});

test('render with inputs (@Input decorator)', async () => {
  const { getByRole, getByText } = await render(ProductComponent, {
    inputs: {
      name: 'Laptop',
      price: 1299.99,
      inStock: true,
      category: 'Electronics',
    },
  });

  await expect.element(getByRole('heading', { name: 'Laptop' })).toBeVisible();
  await expect.element(getByText('Price: $1299.99')).toBeVisible();
  await expect.element(getByText('In Stock: Yes')).toBeVisible();
  await expect.element(getByText('Category: Electronics')).toBeVisible();
});

test('render with outputs', async () => {
  const sendHandler = vi.fn();
  const { getByRole } = await render(UserProfileComponent, {
    outputs: {
      send: sendHandler,
    },
  });
  await getByRole('button', { name: 'Send' }).click();
  expect(sendHandler).toHaveBeenCalled();
});

test('render with dynamic inputs signal', async () => {
  const name = signal('John Doe');
  const { locator } = await render(UserProfileComponent, {
    inputs: {
      name,
    },
  });
  await expect.element(locator.getByRole('heading', { name: 'John Doe' })).toBeVisible();
  name.set('Jane Smith');
  await expect.element(locator.getByRole('heading', { name: 'Jane Smith' })).toBeVisible();
});

describe('rerender', () => {
  test('rerender updates the DOM with new input values', async () => {
    const { rerender, getByRole, getByText } = await render(UserProfileComponent, {
      inputs: { name: 'Alice', age: 25 },
    });

    await expect.element(getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect.element(getByText('Age: 25')).toBeVisible();

    await rerender({ name: 'Bob', age: 30 });

    await expect.element(getByRole('heading', { name: 'Bob' })).toBeVisible();
    await expect.element(getByText('Age: 30')).toBeVisible();
  });

  test('rerender preserves inputs not included in the update', async () => {
    const { rerender, getByRole, getByText } = await render(UserProfileComponent, {
      inputs: { name: 'Alice', age: 25, email: 'alice@example.com', isActive: true },
    });

    await rerender({ name: 'Bob' });

    await expect.element(getByRole('heading', { name: 'Bob' })).toBeVisible();
    await expect.element(getByText('Age: 25')).toBeVisible();
    await expect.element(getByText('Email: alice@example.com')).toBeVisible();
    await expect.element(getByText('Status: Active')).toBeVisible();
  });

  test('rerender updates computed properties derived from inputs', async () => {
    const { rerender, getByText } = await render(UserProfileComponent, {
      inputs: { name: 'Alice', age: 25, email: 'alice@example.com' },
    });

    await expect.element(getByText('Alice (25 years old) - alice@example.com')).toBeVisible();

    await rerender({ name: 'Bob', age: 30 });

    await expect.element(getByText('Bob (30 years old) - alice@example.com')).toBeVisible();
  });

  test('rerender throws when input was not provided in the initial render', async () => {
    const { rerender } = await render(UserProfileComponent, {
      inputs: { name: 'Alice' },
    });

    await expect(rerender({ age: 25 })).rejects.toThrow(
      '[render] Cannot rerender component with input "age"',
    );
  });

  test('rerender works with a signal passed as the initial input', async () => {
    const name = signal('Charlie');
    const { locator, rerender } = await render(UserProfileComponent, {
      inputs: { name },
    });

    await expect.element(locator.getByRole('heading', { name: 'Charlie' })).toBeVisible();

    await rerender({ name: 'Diana' });

    await expect.element(locator.getByRole('heading', { name: 'Diana' })).toBeVisible();
  });

  test('rerender is not available when withRouting is enabled', async () => {
    const result = await render(UserProfileComponent, { withRouting: true });

    expect((result as any).rerender).toBeUndefined();
  });
});

describe('removeAngularAttributes', () => {
  test('ng-version is present on the container by default', async () => {
    const { container } = await render(HelloWorldComponent);

    expect(container.hasAttribute('ng-version')).toBe(true);
  });

  test('ng-version is removed when removeAngularAttributes is true', async () => {
    const { container } = await render(HelloWorldComponent, {
      removeAngularAttributes: true,
    });
    expect(container.hasAttribute('ng-version')).toBe(false);
  });

  test('removeAngularAttributes works with routed components', async () => {
    const { container } = await render(RoutedComponent, {
      withRouting: true,
      removeAngularAttributes: true,
    });

    expect(container.hasAttribute('ng-version')).toBe(false);
  });
});
