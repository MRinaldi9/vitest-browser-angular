# vitest-browser-angular

> **Note:** This repository is a **fork** of the official [`vitest-browser-angular`](https://github.com/vitest-community/vitest-browser-angular) library. The implementations contained here are developed independently and are **not** shared with the official project.

This community package renders Angular components in [Vitest Browser Mode](https://vitest.dev/guide/browser).

```ts
import { Component, input } from '@angular/core';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-angular';

@Component({
  selector: 'app-hello-world',
  template: '<h1>Hello, {{ name() }}!</h1>',
})
export class HelloWorld {
  name = input.required<string>();
}

test('renders name', async () => {
  const { locator } = await render(HelloWorld, {
    inputs: {
      name: 'World',
    },
  });

  await expect.element(locator).toHaveTextContent('Hello, World!');
});
```

## Setup

There are currently two ways to set up Vitest for Angular:

- Analog's [`vitest-angular` plugin](https://analogjs.org/docs/features/testing/vitest) _(community)_.
- Angular CLI's [`unit-test` builder](https://angular.dev/guide/testing#configuration) _(official)_.

While Angular CLI's `unit-test` builder is the official way to set up Vitest for Angular, it has some [limitations](https://analogjs.org/docs/features/testing/overview#angular-support-for-vitest). Analog's `vitest-angular` plugin provides more Vitest features and greater flexibility.

### Setup with Analog Plugin

1. Set up Vitest

```sh
npm add -D @analogjs/platform vitest-browser-angular

ng g @analogjs/platform:setup-vitest
```

2. Activate browser mode in the generated Vitest configuration by following the [browser mode configuration instructions](https://vitest.dev/guide/browser/#configuration).

### Setup with Angular CLI

1. Configure your Angular project to use the `@angular/build:unit-test` builder, and add the browsers of your choice.

```json
{
  ...,
  "projects": {
    "my-app": {
      ...,
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "browsers": ["Chromium", "Firefox", "Webkit"]
          }
        }
      }
    }
  }
}
```

_Since Angular v21, Vitest is the default runner so you don't need to set the `runner` option._

2. Install the browser provider of your choice using `ng add`

```sh
# With Playwright
ng add @vitest/browser-playwright

# or with WebdriverIO
ng add @vitest/browser-webdriverio
```

3. Add the `vitest-browser-angular` package to your project.

```sh
npm add -D vitest-browser-angular
```

## Zone.js VS Zoneless Setup

Angular CLI will automatically set up the test environment for you depending on the presence of `zone.js` in your project's polyfills.

When using the Analog plugin, you can control the behavior using the `zoneless` option of `setupTestBed()` in `test-setup.ts`:

```ts
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({
  zoneless: true,
});
```

For detailed setup instructions for both Zone.js and Zoneless configurations, please refer to the [Analog Vitest documentation](https://analogjs.org/docs/features/testing/vitest).

## Component Preview

To preview, debug and interact with a component in the browser after the test, you can prevent Angular from destroying it.

In Angular CLI, enable this using the `--debug` option.

With the Analog plugin, enable this using the `teardown.destroyAfterEach` option of `setupTestBed()` in `test-setup.ts`:

```ts
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({
  teardown: { destroyAfterEach: false },
});
```

## Usage

### Basic Example

The `render` function supports two query patterns:

```ts
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-angular';

@Component({
  template: ` <h1>Welcome</h1> `,
})
export class MyComponent {}

test('query elements', async () => {
  // Pattern 1: Use locator to query within the component element
  const { locator } = await render(MyComponent);
  await expect.element(locator.getByText('Welcome')).toBeVisible();

  // Pattern 2: Use screen to query from document.body (useful for portals/overlays)
  const screen = await render(MyComponent);
  await expect.element(screen.getByText('Welcome')).toBeVisible();
  await expect.element(screen.getByText('Some Popover Content')).toBeVisible();
});
```

### Query Methods

Both `locator` and `screen` provide the following query methods:

- `getByRole` - Locate by ARIA role and accessible name
- `getByText` - Locate by text content
- `getByLabelText` - Locate by associated label text
- `getByPlaceholder` - Locate by placeholder text
- `getByAltText` - Locate by alt text (images)
- `getByTitle` - Locate by title attribute
- `getByTestId` - Locate by data-testid attribute

**When to use which pattern:**

- **`locator`**: (full name: "Component Locator") - queries are scoped to the component's host element. Best for most component tests.
- **`screen`**: Queries start from `baseElement` (defaults to `document.body`). Use when testing components that render content outside their host element (modals, tooltips, portals).

### Container Element

Access the component's host element directly via `container` (shortcut for `fixture.nativeElement`):

```ts
const { container, locator } = await render(MyComponent);
expect(container).toBe(locator.element());
```

### Base Element

Customize the root element for screen queries (useful for portal/overlay testing):

```ts
const customContainer = document.querySelector('#modal-root');
const screen = await render(ModalComponent, {
  baseElement: customContainer,
});
// screen queries now start from customContainer instead of document.body
```

## Inputs

Pass input values to components using the `inputs` option:

```ts
import { Component, input } from '@angular/core';

@Component({
  template: '<h2>{{ name() }}</h2><p>Price: ${{ price() }}</p>',
  standalone: true,
})
export class ProductComponent {
  name = input('Unknown Product');
  price = input(0);
}

test('render with inputs', async () => {
  const screen = await render(ProductComponent, {
    inputs: {
      name: 'Laptop',
      price: 1299.99,
    },
  });

  await expect.element(screen.getByText('Laptop')).toBeVisible();
  await expect.element(screen.getByText(/Price: \$1299\.99/)).toBeVisible();
});
```

Works with both signal-based inputs (`input()`) and `@Input()` decorators.

### Rerender

Update component inputs after rendering using `rerender`:

```ts
import { Component, input } from '@angular/core';
import { signal } from '@angular/core';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-angular';

@Component({
  template: '<h2>{{ name() }}</h2><p>Price: ${{ price() }}</p>',
})
export class ProductComponent {
  name = input('Unknown Product');
  price = input(0);
}

test('rerender with new inputs', async () => {
  const { locator, rerender } = await render(ProductComponent, {
    inputs: { name: 'Laptop', price: 1299.99 },
  });

  await expect.element(locator.getByText('Laptop')).toBeVisible();
  await expect.element(locator.getByText(/Price: \$1299\.99/)).toBeVisible();

  // Partial update — only the specified inputs change
  await rerender({ price: 999.99 });
  await expect.element(locator.getByText(/Price: \$999\.99/)).toBeVisible();
  await expect.element(locator.getByText('Laptop')).toBeVisible();
});
```

You can also pass `WritableSignal` values to keep the binding reactive:

```ts
test('rerender with signals', async () => {
  const { locator, rerender } = await render(ProductComponent, {
    inputs: { name: 'Laptop', price: 1299.99 },
  });

  const price$ = signal(799.99);
  await rerender({ price: price$ });

  await expect.element(locator.getByText(/Price: \$799\.99/)).toBeVisible();

  // Update the signal — the component updates once change detection runs
  price$.set(649.99);
  await expect.element(locator.getByText(/Price: \$649\.99/)).toBeVisible();
});
```

`rerender` is not available when using `withRouting`.

## Outputs

Subscribe to component outputs using the `outputs` option:

```ts
import { Component, output } from '@angular/core';
import { vi } from 'vitest';

@Component({
  template: '<button (click)="send.emit()">Send</button>',
  standalone: true,
})
export class MessageComponent {
  send = output<void>();
}

test('render with outputs', async () => {
  const sendHandler = vi.fn();
  const { locator } = await render(MessageComponent, {
    outputs: {
      send: sendHandler,
    },
  });

  await locator.getByRole('button', { name: 'Send' }).click();
  expect(sendHandler).toHaveBeenCalled();
});
```

Handlers receive the emitted value, so you can assert on the payload:

```ts
@Component({
  template: '<button (click)="save.emit({ id: 1 })">Save</button>',
  standalone: true,
})
export class SaveComponent {
  save = output<{ id: number }>();
}

test('assert on output payload', async () => {
  const saveHandler = vi.fn();
  const { locator } = await render(SaveComponent, {
    outputs: {
      save: saveHandler,
    },
  });

  await locator.getByRole('button', { name: 'Save' }).click();
  expect(saveHandler).toHaveBeenCalledWith({ id: 1 });
});
```

Works with signal-based outputs (`output()`).

When using `withRouting`, outputs cannot be passed directly to `render()`.

## Routing

### Simple Routing

Enable routing with `withRouting: true` for components that use routing features but don't require specific route configuration:

```ts
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-angular';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  template: `
    <nav>
      <a routerLink="/home">Home</a>
      <a routerLink="/about">About</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  imports: [RouterLink, RouterOutlet],
})
export class RoutedComponent {}

test('render with simple routing', async () => {
  const screen = await render(RoutedComponent, {
    withRouting: true,
  });

  await expect.element(screen.getByText('Home')).toBeVisible();
  await expect.element(screen.getByText('About')).toBeVisible();
});
```

### Routing with Configuration

Configure specific routes and optionally set an initial route:

```ts
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-angular';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, Routes } from '@angular/router';

@Component({
  template: '<h1>Home Page</h1>',
})
export class HomeComponent {}

@Component({
  template: '<h1>About Page</h1>',
  standalone: true,
})
export class AboutComponent {}

@Component({
  template: `
    <nav>
      <a routerLink="/home">Home</a>
      <a routerLink="/about">About</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  imports: [RouterLink, RouterOutlet],
  standalone: true,
})
export class AppComponent {
  router = inject(Router);
}

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

test('render with route configuration', async () => {
  const { locator, routerHarness, router } = await render(AppComponent, {
    withRouting: {
      routes,
      initialRoute: '/home',
    },
  });

  await expect.element(locator).toHaveTextContent('Home Page');

  // Navigate programmatically (prefer routerHarness over router)
  await routerHarness.navigateByUrl('/about');
  await expect.element(locator).toHaveTextContent('About Page');

  // Use router to inspect state
  expect(router.url).toBe('/about');
});
```

### Route Params

When rendering a routed component, `componentClassInstance` provides access to the actual component instance with full routing context:

```ts
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Routes } from '@angular/router';

@Component({
  template: '<h1>User: {{ userId }}</h1>',
})
export class UserComponent {
  private route = inject(ActivatedRoute);
  userId = this.route.snapshot.params['id'];
}

test('access route params', async () => {
  const routes: Routes = [{ path: 'user/:id', component: UserComponent }];

  const { componentClassInstance } = await render(UserComponent, {
    withRouting: {
      routes,
      initialRoute: '/user/42',
    },
  });

  expect(componentClassInstance.userId).toBe('42');
});
```

### Passing Inputs via Route Data

By default, `withComponentInputBinding()` is enabled, which automatically binds route `data`, route params, and query params to matching component inputs. This works with both signal inputs (`input()`) and `@Input()` decorators:

```ts
import { Component, input } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  template: `
    <h2>{{ name() }}</h2>
    <p>Age: {{ age() }}</p>
    <p>Role: {{ role() }}</p>
  `,
})
export class ProfileComponent {
  name = input('Guest');
  age = input(0);
  role = input('user');
}

test('pass inputs via route data', async () => {
  const routes: Routes = [
    {
      path: 'profile',
      component: ProfileComponent,
      data: {
        name: 'Jane Doe',
        age: 30,
        role: 'admin',
      },
    },
  ];

  const { locator, componentClassInstance } = await render(ProfileComponent, {
    withRouting: {
      routes,
      initialRoute: '/profile',
    },
  });

  // Inputs are automatically bound from route data
  expect(componentClassInstance.name()).toBe('Jane Doe');
  expect(componentClassInstance.age()).toBe(30);
  expect(componentClassInstance.role()).toBe('admin');

  await expect.element(locator.getByText('Jane Doe')).toBeVisible();
});
```

### Disabling Input Binding

If you need to manually handle route data via `ActivatedRoute` instead of automatic input binding, use `disableInputBinding`:

```ts
test('disable automatic input binding', async () => {
  const routes: Routes = [
    {
      path: 'profile',
      component: ProfileComponent,
      data: { name: 'Jane Doe' },
    },
  ];

  const { componentClassInstance } = await render(ProfileComponent, {
    withRouting: {
      routes,
      initialRoute: '/profile',
      disableInputBinding: true, // Inputs will NOT be bound from route data
    },
  });

  // Inputs retain their default values
  expect(componentClassInstance.name()).toBe('Guest');
});
```

## HTTP Testing

Enable Angular's `HttpClient` testing support with the `withHttp` option. When enabled, the render result exposes an `httpTesting` instance (`HttpTestingController`) you can use to assert on outgoing requests and flush mocked responses — there's no need to manually wire up `provideHttpClient`/`provideHttpClientTesting`.

### Basic HTTP Testing

Enable HTTP testing with `withHttp: true`:

```ts
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-angular';

@Component({
  template: `
    <h1 data-testid="title">{{ data()?.title ?? '' }}</h1>
    <button data-testid="fetch" (click)="load()">Fetch</button>
  `,
})
export class HttpDemoComponent {
  private http = inject(HttpClient);
  data = signal<{ title: string } | null>(null);

  load() {
    this.http.get<{ title: string }>('/api/data').subscribe(res => this.data.set(res));
  }
}

test('mocks an HTTP response', async () => {
  const { locator, httpTesting } = await render(HttpDemoComponent, {
    withHttp: true,
  });

  await locator.getByTestId('fetch').click();

  const req = httpTesting.expectOne('/api/data');
  expect(req.request.method).toBe('GET');
  req.flush({ title: 'Hello HTTP' });

  await expect.element(locator.getByTestId('title')).toHaveTextContent('Hello HTTP');
});
```

### HTTP with Interceptors

Pass an `HttpConfig` with custom interceptors to register them via Angular's `withInterceptors`:

```ts
import { HttpInterceptorFn } from '@angular/common/http';

const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Custom': 'test-value' } }));

test('applies custom interceptors', async () => {
  const { locator, httpTesting } = await render(HttpDemoComponent, {
    withHttp: { interceptors: [authInterceptor] },
  });

  await locator.getByTestId('fetch').click();

  const req = httpTesting.expectOne('/api/data');
  expect(req.request.headers.get('X-Custom')).toBe('test-value');
  req.flush({ title: 'Intercepted' });

  await expect.element(locator.getByTestId('title')).toHaveTextContent('Intercepted');
});
```

When `withHttp` is omitted, `httpTesting` is `undefined` and `HttpClient` is not configured.

## Component Providers

If you need to add or override [component providers](https://angular.dev/guide/di/defining-dependency-providers#component-or-directive-providers), you can use the `componentProviders` option.

```ts
@Component({
  template: '<h1>{{ title }}</h1>',
  providers: [GreetingService],
})
export class HelloWorldComponent {
  title = 'Hello World';
}

test('renders component with service provider', async () => {
  const screen = await render(ServiceConsumerComponent, {
    componentProviders: [
      { provide: GreetingService, useClass: FakeGreetingService },
    ],
  });

  await expect.element(screen.getByText('Fake Greeting')).toBeVisible();
});
```

## Directives

Use `renderDirective` to test attribute directives. It wraps the directive in a generated host component and renders the provided `template`, so you can drive the directive with real DOM events and assert against the host element.

```ts
import { Directive, input, output } from '@angular/core';
import { test, expect } from 'vitest';
import { renderDirective } from 'vitest-browser-angular';

@Directive({
  selector: '[appHighlight]',
  host: { '[style.color]': 'color()' },
})
export class HighlightDirective {
  color = input('black');
  blurred = output<FocusEvent>();
}

test('renders directive', async () => {
  const { directiveInstance, locator } = await renderDirective(HighlightDirective, {
    template: `<button appHighlight>Test</button>`,
  });

  expect(directiveInstance.color()).toBe('black');
  await expect.element(locator.getByText('Test')).toBeVisible();
});
```

The `template` **must** include the directive selector otherwise an error will be thrown.

### Host Props

Pass reactive values and handlers to the template through `hostProps`. Each property is assigned onto the host component instance, so you can reference it directly in the template binding:

```ts
import { signal } from '@angular/core';

test('binds host inputs and outputs', async () => {
  const color = signal('red');
  const onBlur = vi.fn();

  const { getByText } = await renderDirective(HighlightDirective, {
    template: `<button appHighlight [color]="color()" (blurred)="onBlur($event)">Test</button>`,
    hostProps: { color, onBlur },
  });

  expect(getByText('Test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });

  color.set('blue');
  await expect.element(getByText('Test')).toHaveStyle({ color: 'rgb(0, 0, 255)' });
});
```

Signals passed via `hostProps` keep the binding reactive — updating them propagates to the directive once change detection runs.

### Imports and Providers

Pass additional modules (pipes, directives, components used in the template) via `imports`, and register DI providers via `providers`:

```ts
import { JsonPipe } from '@angular/common';

const { getByText } = await renderDirective(HighlightDirective, {
  template: `<button appHighlight>{{ color() | json }}</button>`,
  imports: [JsonPipe],
  providers: [{ provide: SomeService, useValue: fakeService }],
});
```

### Result

The render result mirrors `render` and adds directive-specific helpers:

- `directiveInstance` — the instance of the tested directive, resolved from the host element's injector.
- `locator` — Vitest browser locator scoped to the host component's container.
- `fixture` — the host component's `ComponentFixture`.
- `container` / `baseElement` — the rendered elements.
- `debug` — pretty-print the DOM for debugging.
- `getByRole`, `getByText`, … — the standard `LocatorSelectors` scoped to `baseElement`.

## Contributing

Want to contribute? Yayy! 🎉

Please read and follow our [Contributing Guidelines](CONTRIBUTING.md) to learn what are the right steps to take before contributing your time, effort and code.

Thanks 🙏

<br/>

## Code Of Conduct

Be kind to each other and please read our [code of conduct](CODE_OF_CONDUCT.md).

<br/>

## Credits

This project is inspired by the following projects:

[vitest-browser-vue](https://github.com/vitest-dev/vitest-browser-vue)
[angular-testing-library](https://github.com/testing-library/angular-testing-library)

## License

MIT
