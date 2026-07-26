import type { Type } from '@angular/core';
import { inputBinding, isSignal, outputBinding } from '@angular/core';
import { ɵgetCleanupHook as getCleanupHook, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { page, utils } from 'vitest/browser';
import { ComponentRenderOptions, RenderResult, Inputs } from './types/render';
import { RoutingConfig, Outputs } from './types/render';

const { debug, getElementLocatorSelectors } = utils;

/**
 * Renders an Angular component for testing with Vitest Browser Mode.
 *
 * @example
 * ```typescript
 *   // Basic render
 *   const { locator } = await render(MyComponent);
 *   await expect.element(locator.getByText('Hello')).toBeVisible();
 *
 *   // With inputs
 *   const { componentClassInstance } = await render(UserComponent, {
 *     inputs: { name: 'John', age: 30 },
 *   });
 *
 *   // With routing and route data as inputs
 *   const { router } = await render(ProfileComponent, {
 *     withRouting: {
 *       routes: [{ path: 'profile', component: ProfileComponent, data: { userId: '42' } }],
 *       initialRoute: '/profile',
 *     },
 *   });
 *```
 * @param componentClass - The component class to render
 * @param options - Configuration options for rendering
 * @returns A promise that resolves to the render result with locators and component access
 */
export async function render<T>(
  componentClass: Type<T>,
  options?: ComponentRenderOptions<Type<T>>,
): Promise<RenderResult<T>> {
  const imports = [componentClass, ...(options?.imports || [])];
  const providers = [...(options?.providers || [])];
  const baseElement = options?.baseElement || document.body;

  if (options?.withRouting && options?.inputs) {
    console.warn(
      '[vitest-browser-angular] Using `inputs` with `withRouting` is not supported. ' +
        'Inputs cannot be passed directly to routed components. ' +
        'Consider passing data via route params, query params, or route data instead.',
    );
  }

  const routingConfig: RoutingConfig | undefined = options?.withRouting
    ? typeof options.withRouting === 'boolean'
      ? {
          routes: [{ path: '**', component: componentClass }],
          initialRoute: '/',
        }
      : options.withRouting
    : undefined;

  if (routingConfig) {
    if (routingConfig.disableInputBinding) {
      providers.push(provideRouter(routingConfig.routes));
    } else {
      providers.push(provideRouter(routingConfig.routes, withComponentInputBinding()));
    }
  }

  TestBed.configureTestingModule({
    imports,
    providers,
  });

  if (options?.componentProviders) {
    TestBed.overrideComponent(componentClass, {
      add: {
        providers: options.componentProviders,
      },
    });
  }

  let fixture: RenderResult<T>['fixture'];
  let container: HTMLElement;
  let componentClassInstance: T;
  let routerHarness: RouterTestingHarness | undefined;
  let router: Router | undefined;

  if (routingConfig) {
    routerHarness = await RouterTestingHarness.create(routingConfig.initialRoute);
    router = TestBed.inject(Router);

    fixture = routerHarness.fixture;
    container = routerHarness.routeNativeElement!;
    componentClassInstance = routerHarness.routeDebugElement?.componentInstance as T;
  } else {
    const bindings = createBindingsComponent(options?.inputs, options?.outputs);

    fixture = TestBed.createComponent(componentClass, { bindings });
    container = fixture.nativeElement;
    componentClassInstance = fixture.componentInstance;
  }

  fixture.autoDetectChanges();
  await fixture.whenStable();

  const locator = page.elementLocator(container);

  return {
    baseElement,
    container,
    fixture,
    debug: (el = baseElement, maxLength, opts) => debug(el, maxLength, opts),
    componentClassInstance,
    component: locator, // deprecated, this will be removed in a future version
    locator,
    routerHarness,
    router,
    ...getElementLocatorSelectors(baseElement),
  };
}

export function cleanup(shouldTeardown = false) {
  return getCleanupHook(shouldTeardown)();
}

/**
 * @internal
 * Builds binding configs for `TestBed.createComponent()` from the render options.
 *
 * Map entries through `inputBinding()` / `outputBinding()` — signal values are
 * passed as-is, plain values are wrapped in a factory. Used when routing is off.
 *
 * @param inputsBinding Signal input values keyed by component property
 * @param outputsBinding Output handler functions keyed by component property
 * @returns Flat binding array for `TestBed.createComponent({ bindings })`
 */
function createBindingsComponent<C extends Type<unknown>>(
  inputsBinding: Inputs<C> = {},
  outputsBinding: Outputs<C> = {},
) {
  const inputBindings = Object.entries(inputsBinding).map(([key, value]) =>
    inputBinding(key, isSignal(value) ? value : () => value),
  );
  const outputBindings = Object.entries(outputsBinding).map(([key, value]) =>
    outputBinding(key, value as (v: unknown) => unknown),
  );
  return [...inputBindings, ...outputBindings];
}
