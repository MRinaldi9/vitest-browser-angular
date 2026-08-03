import { HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import type {
  EnvironmentProviders,
  InputSignalWithTransform,
  OutputEmitterRef,
  Provider,
  ProviderToken,
  SchemaMetadata,
  Type,
  WritableSignal,
} from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import type { Router, Routes } from '@angular/router';
import type { RouterTestingHarness } from '@angular/router/testing';
import type { Locator, LocatorSelectors, PrettyDOMOptions } from 'vitest/browser';
import { Prettify } from './utils';

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

export interface HttpConfig {
  interceptors?: Array<HttpInterceptorFn>;
}

type InputValueOrSignal<T> =
  T extends InputSignalWithTransform<infer _ReadT, infer WriteT>
    ? WriteT | WritableSignal<WriteT>
    : never;

export type Inputs<CMP_TYPE extends Type<unknown>> = Partial<{
  [PROP in keyof InstanceType<CMP_TYPE> as InstanceType<CMP_TYPE>[PROP] extends InputSignalWithTransform<
    infer _ReadT,
    infer _WriteT
  >
    ? PROP
    : never]: InputValueOrSignal<InstanceType<CMP_TYPE>[PROP]>;
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

/** Base options for rendering a component with `render()`. */
export interface BaseRenderOptions<CMP_TYPE extends Type<unknown> = Type<unknown>> {
  /** The base element to render into.
   *  @default document.body
   * */
  baseElement?: HTMLElement;

  /**
   * When `true`, automatically infers the component's selector and adds it to the template.
   * Only works when `withRouting` is not enabled.
   */
  inferTagName?: boolean;

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

  /** Enable Angular HttpClient testing support for the component. When enabled, `httpTesting` is
   * available in the render result.
   *
   * - When `true`: Enables HttpClient testing with default configuration.
   * - When `HttpConfig`: Enables HttpClient testing with the provided configuration.
   *
   * @example
   *   ```typescript
   *   // Basic HttpClient testing
   *   const { httpTesting } = await render(MyComponent, { withHttp: true });
   *
   *   // With custom interceptors
   *   const { httpTesting } = await render(MyComponent, {
   *     withHttp: { interceptors: [myInterceptor] },
   *   });
   *   ```;
   */
  withHttp?: HttpConfig | boolean;

  /** Additional providers to configure in the testing module. */
  providers?: Array<Provider | EnvironmentProviders>;

  /** Additional imports for the testing module. */
  imports?: Array<unknown>;

  /**
   * The schema metadata for the component.
   *
   * In case the component uses custom elements or other non-standard Angular elements, you can provide the appropriate schema metadata here.
   * @example CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA
   * @see https://angular.dev/api/core/NO_ERRORS_SCHEMA
   * @see https://angular.dev/api/core/CUSTOM_ELEMENTS_SCHEMA
   */
  schema?: SchemaMetadata;

  /**
   * When `true`, removes Angular-specific attributes (`ng-version`)
   * from the rendered DOM after render. Useful for cleaner snapshots
   * and inline assertions on `container.innerHTML`.
   *
   * @default false
   */
  removeAngularAttributes?: boolean;

  /**
   * When provided, overrides the component's `imports` with the specified imports.
   * Useful for mocking child components/directives/pipes used in the component's template.
   *
   * @example
   *   ```typescript
   *   await render(MyComponent, {
   *     overrideImportsComponent: [
   *       { replace: ChildComponent, with: MockComponent },
   *     ],
   *   });
   *   ```;
   */
  overrideImportsComponent?: Array<{ replace: Type<unknown>; with: Type<unknown> }>;

  /**
   * Replaces providers declared on the component itself with alternative providers.
   * Useful for mocking a service that the component declares in its `providers` array.
   *
   * `replace` must match the exact provider shape declared by the component:
   * the same object shape (same `provide`/`useClass`/`useValue`/`useFactory` keys)
   * or the bare class when the component uses the shorthand `providers: [Foo]`.
   * `with` is a full provider that typically provides the same token as `replace`,
   * e.g. `{ provide: Foo, useClass: MockFoo }`.
   *
   *
   * @example
   *   ```typescript
   *   await render(MyComponent, {
   *     overrideProvidersComponent: [
   *       { replace: GreetingService, with: { provide: GreetingService, useClass: MockGreetingService } },
   *     ],
   *   });
   *   ```;
   */
  overrideProvidersComponent?: Array<{
    replace: Provider;
    with: Provider;
  }>;
}

/**
 * Options for `render()` when routing is **not** enabled (`withRouting` is `false` or omitted).
 *
 * `inputs` and `outputs` are available.
 */
export type ComponentRenderOptions<CMP_TYPE extends Type<unknown> = Type<unknown>> = Prettify<
  Omit<BaseRenderOptions<CMP_TYPE>, 'withRouting'> & {
    withRouting?: false;
  }
>;

/**
 * Options for `render()` when routing is enabled (`withRouting` is `true` or a `RoutingConfig`).
 *
 * `inputs` and `outputs` are not allowed — use route `data`/params instead.
 */
export type RoutedRenderOptions<CMP_TYPE extends Type<unknown> = Type<unknown>> = Prettify<
  Omit<BaseRenderOptions<CMP_TYPE>, 'withRouting'> & {
    withRouting: true | RoutingConfig;
    inputs?: never;
    outputs?: never;
  }
>;

/**
 * Fallback options for `render()` when the routing state cannot be statically determined
 * (e.g. `withRouting` is a generic `boolean`).
 *
 * `inputs` and `outputs` are not allowed because the component might be routed.
 */
export type RoutedFallbackRenderOptions<CMP_TYPE extends Type<unknown> = Type<unknown>> = Prettify<
  Omit<BaseRenderOptions<CMP_TYPE>, 'withRouting' | 'inputs' | 'outputs'> & {
    withRouting?: boolean;
    inputs?: never;
    outputs?: never;
  }
>;

/**
 * Base fields shared by every `render()` result, independent of whether routing is enabled.
 */
interface BaseRenderResult<T> extends LocatorSelectors {
  baseElement: HTMLElement;
  container: HTMLElement;
  debug(
    el?: HTMLElement | HTMLElement[] | Locator | Locator[],
    maxLength?: number,
    options?: PrettyDOMOptions,
  ): void;

  /** Vitest browser locator scoped to the rendered component's container. */
  locator: Locator;

  /** The instance of the rendered component's class. */
  componentClassInstance: T;

  /**
   * The Angular TestBed's HttpTestingController instance, if `withHttp` was enabled.
   */
  httpTesting?: HttpTestingController;

  /**
   * Injects a dependency based on the component injector.
   * @param token - The token to inject.
   * @returns The instance of the requested dependency.
   */
  inject: <T>(token: ProviderToken<T>) => T;
}

/**
 * Result of `render()` when routing is **not** enabled.
 *
 * The `fixture` is the `ComponentFixture<T>` of the rendered component.
 */
export interface RenderResult<T> extends BaseRenderResult<T> {
  /**
   * The ComponentFixture for the rendered component.
   */
  fixture: ComponentFixture<T>;

  /**
   * Rerenders the component with new input values.
   *
   * @param newInputs - An object containing the new input values keyed by input name.
   * @returns A promise that resolves once the component has been updated and stabilized.
   */
  rerender: (newInputs: Inputs<Type<T>>) => Promise<void>;
}

/**
 * Result of `render()` when `withRouting` is enabled.
 *
 * The `fixture` is the `RouterTestingHarness`'s internal fixture (typed as
 * `ComponentFixture<unknown>`), and `router` / `routerHarness` are always defined.
 */
export interface RoutedRenderResult<T> extends BaseRenderResult<T> {
  /**
   * The RouterTestingHarness's internal fixture. Not a fixture of `T` directly.
   */
  fixture: ComponentFixture<unknown>;

  /**
   * The RouterTestingHarness instance.
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
  routerHarness: RouterTestingHarness;

  /**
   * The Angular Router instance.
   *
   * Useful for inspecting router state. For navigation, prefer `routerHarness.navigateByUrl()`.
   *
   * @example
   *   expect(router.url).toBe('/user/42');
   */
  router: Router;
}

export interface RenderFn {
  <T>(component: Type<T>, options?: ComponentRenderOptions<Type<T>>): Promise<RenderResult<T>>;
  <T>(component: Type<T>, options: RoutedRenderOptions<Type<T>>): Promise<RoutedRenderResult<T>>;
  <T>(
    component: Type<T>,
    options: RoutedFallbackRenderOptions<Type<T>>,
  ): Promise<RenderResult<T> | RoutedRenderResult<T>>;
}

export interface DirectiveRenderOptions {
  /** Template to render the directive in. Must include the directive selector. */
  template: string;

  /** Host component input values to pass and make reactive. */
  hostProps?: Record<string, unknown>;

  /** Additional imports for the wrapper component. */
  imports?: Array<Type<unknown>>;

  /** Additional providers for the test module. */
  providers?: Array<Provider | EnvironmentProviders>;

  /** The base element for screen queries. Defaults to document.body. */
  baseElement?: HTMLElement;

  /** Change detection strategy for the host component. Defaults to 'onPush'. */
  changeDetection?: 'eager' | 'onPush';
}

export interface DirectiveRenderResult<T> extends LocatorSelectors {
  container: HTMLElement;
  baseElement: HTMLElement;
  /**
   * The host component's fixture.
   */
  hostFixture: ComponentFixture<unknown>;
  /**
   * Instance of the tested directive.
   */
  directiveInstance: T;
  /**
   * Locator scoped to the host element where the directive is applied.
   */
  locator: Locator;
  /**
   * Debug function for the directive's element.
   */
  debug(
    el?: HTMLElement | HTMLElement[] | Locator | Locator[],
    maxLength?: number,
    options?: PrettyDOMOptions,
  ): void;
}
