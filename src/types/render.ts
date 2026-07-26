import type {
  Type,
  InputSignal,
  OutputEmitterRef,
  Provider,
  EnvironmentProviders,
} from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import type { Routes, Router } from '@angular/router';
import type { RouterTestingHarness } from '@angular/router/testing';
import type { LocatorSelectors, Locator, PrettyDOMOptions } from 'vitest/browser';

/**
 * Configuration options for rendering components with Angular Router support.
 *
 * @example
 *   ```typescript
 *   // Basic routing with route params
 *   await render(UserComponent, {
 *     withRouting: {
 *       routes: [{ path: 'user/:id', component: UserComponent }],
 *       initialRoute: '/user/42',
 *     },
 *   });
 *
 *   // Passing inputs via route data (uses withComponentInputBinding)
 *   await render(ProfileComponent, {
 *     withRouting: {
 *       routes: [
 *         {
 *           path: 'profile',
 *           component: ProfileComponent,
 *           data: { name: 'John', age: 30 },
 *         },
 *       ],
 *       initialRoute: '/profile',
 *     },
 *   });
 *   ```;
 */
export interface RoutingConfig {
  /** The route configuration to use. These routes are passed to `provideRouter()`. */
  routes: Routes;

  /**
   * The initial route to navigate to after setting up the router. This triggers navigation and
   * activates the matching route's component.
   *
   * @example
   *   '/user/42' or '/profile?tab=settings'
   */
  initialRoute?: string;

  /**
   * When `true`, disables Angular's `withComponentInputBinding()` feature.
   *
   * By default, `withComponentInputBinding()` is enabled, which automatically binds route params,
   * query params, and route data to matching component inputs.
   *
   * Set this to `true` if you want to manually handle route data via `ActivatedRoute`.
   *
   * @default false
   */
  disableInputBinding?: boolean;
}

export type Inputs<CMP_TYPE extends Type<unknown>> = Partial<{
  [PROP in keyof InstanceType<CMP_TYPE> as InstanceType<CMP_TYPE>[PROP] extends InputSignal<unknown>
    ? PROP
    : never]: InstanceType<CMP_TYPE>[PROP] extends InputSignal<infer VALUE> ? VALUE : never;
}>;

export type OutputKeys<CMP_TYPE extends Type<unknown>> = {
  [PROP in keyof InstanceType<CMP_TYPE>]: InstanceType<CMP_TYPE>[PROP] extends OutputEmitterRef<unknown>
    ? PROP
    : never;
}[keyof InstanceType<CMP_TYPE>];

export type Outputs<CMP extends Type<unknown>> = Partial<{
  [K in OutputKeys<CMP>]: InstanceType<CMP>[K] extends OutputEmitterRef<infer T>
    ? (value: T) => void
    : never;
}>;

/** Options for rendering a component with `render()`. */
export interface ComponentRenderOptions<CMP_TYPE extends Type<unknown> = Type<unknown>> {
  /** The base element to render into. Defaults to `document.body`. */
  baseElement?: HTMLElement;

  /**
   * Input values to pass to the component.
   *
   * Note: When using `withRouting`, inputs cannot be passed directly. Use route `data` instead.
   */
  inputs?: Inputs<CMP_TYPE>;

  /**
   * Output emitters to pass to the component.
   *
   * Note: When using `withRouting`, outputs cannot be passed directly.
   */
  outputs?: Outputs<CMP_TYPE>;

  /**
   * Enable Angular Router support for the component.
   *
   * - When `true`: Creates a wildcard route for the component and navigates to `/`.
   * - When `RoutingConfig`: Uses the provided routes and initial route.
   *
   * By default, `withComponentInputBinding()` is enabled, allowing you to pass inputs via route
   * `data`, route params, or query params.
   *
   * @example
   *   ```typescript
   *   // Simple routing (component matches any route)
   *   await render(MyComponent, { withRouting: true });
   *
   *   // Full routing configuration
   *   await render(UserComponent, {
   *     withRouting: {
   *       routes: [{ path: 'user/:id', component: UserComponent, data: { role: 'admin' } }],
   *       initialRoute: '/user/42',
   *     },
   *   });
   *   ```;
   */
  withRouting?: RoutingConfig | boolean;

  /** Additional providers to configure in the testing module. */
  providers?: Array<Provider | EnvironmentProviders>;

  /** Providers to add specifically to the component being rendered. */
  componentProviders?: Array<Provider>;

  /** Additional imports for the testing module. */
  imports?: unknown[];
}

export interface RenderResult<T> extends LocatorSelectors {
  baseElement: HTMLElement;
  container: HTMLElement;
  /**
   * The ComponentFixture for the rendered component. When using `withRouting`, this is the
   * RouterTestingHarness's internal fixture not a fixture of `T` directly.
   */
  fixture: ComponentFixture<T> | InstanceType<typeof RouterTestingHarness>['fixture'];
  debug(
    el?: HTMLElement | HTMLElement[] | Locator | Locator[],
    maxLength?: number,
    options?: PrettyDOMOptions,
  ): void;

  /** @deprecated Use locator instead */
  component: Locator;

  /** Vitest browser locator scoped to the rendered component's container. */
  locator: Locator;

  /** The instance of the rendered component's class. */
  componentClassInstance: T;

  /**
   * The RouterTestingHarness instance. Only available when `withRouting` is used.
   *
   * **Preferred for navigation in tests.** Use `navigateByUrl()` which:
   *
   * - Waits for all redirects to complete
   * - Automatically runs change detection
   * - Returns the activated component instance
   * - Handles guard rejections gracefully
   *
   * @example
   *   ```typescript
   *   // Navigate and get the activated component
   *   const userComponent = await routerHarness.navigateByUrl('/user/42', UserComponent);
   *
   *   // Simple navigation
   *   await routerHarness.navigateByUrl('/about');
   */
  routerHarness?: RouterTestingHarness;

  /**
   * The Angular Router instance. Only available when `withRouting` is used.
   *
   * Useful for inspecting router state. For navigation, prefer `routerHarness.navigateByUrl()`.
   *
   * @example
   *   expect(router.url).toBe('/user/42');
   */
  router?: Router;
}

export type RenderFn = <T>(
  component: Type<T>,
  options?: ComponentRenderOptions<Type<T>>,
) => Promise<RenderResult<T>>;
