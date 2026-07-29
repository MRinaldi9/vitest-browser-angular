import type { Type } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  inputBinding,
  isSignal,
  outputBinding,
} from '@angular/core';
import { ɵgetCleanupHook as getCleanupHook, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { page, PrettyDOMOptions, utils } from 'vitest/browser';
import {
  ComponentRenderOptions,
  DirectiveRenderOptions,
  DirectiveRenderResult,
  HttpConfig,
  Inputs,
  Outputs,
  RenderResult,
  RoutedRenderResult,
  RoutingConfig,
} from './types/render';
import {
  HttpFeature,
  HttpFeatureKind,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

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
  options?: Omit<ComponentRenderOptions<Type<T>>, 'withRouting'> & { withRouting?: false },
): Promise<RenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options: Omit<ComponentRenderOptions<Type<T>>, 'withRouting'> & {
    withRouting: true | RoutingConfig;
  },
): Promise<RoutedRenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options?: ComponentRenderOptions<Type<T>>,
): Promise<RenderResult<T> | RoutedRenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options?: ComponentRenderOptions<Type<T>>,
): Promise<RenderResult<T> | RoutedRenderResult<T>> {
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

  if (options?.withHttp || (typeof options?.withHttp === 'boolean' && options.withHttp)) {
    const httpFeatures = _createFeaturesHttp(options.withHttp);

    providers.push(provideHttpClient(...httpFeatures), provideHttpClientTesting());
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

  const httpTesting =
    TestBed.inject(HttpTestingController, undefined, { optional: true }) ?? undefined;

  if (routingConfig) {
    const routerHarness = await RouterTestingHarness.create(routingConfig.initialRoute);
    const router = TestBed.inject(Router);
    const fixture = routerHarness.fixture;
    const container = routerHarness.routeNativeElement!;
    const componentClassInstance = routerHarness.routeDebugElement?.componentInstance as T;

    fixture.autoDetectChanges();
    await fixture.whenStable();

    const locator = page.elementLocator(container);

    return {
      baseElement,
      container,
      fixture,
      debug: (el = baseElement, maxLength, opts) => debug(el, maxLength, opts),
      componentClassInstance,
      locator,
      routerHarness,
      router,
      httpTesting,
      ...getElementLocatorSelectors(baseElement),
    };
  }

  const bindings = _createBindingsComponent(options?.inputs, options?.outputs);
  const fixture = TestBed.createComponent(componentClass, {
    bindings,
    inferTagName: options?.inferTagName,
  });
  const container = fixture.nativeElement;
  const componentClassInstance = fixture.componentInstance;

  fixture.autoDetectChanges();
  await fixture.whenStable();

  const locator = page.elementLocator(container);

  return {
    baseElement,
    container,
    fixture,
    debug: (el = baseElement, maxLength, opts) => debug(el, maxLength, opts),
    componentClassInstance,
    locator,
    httpTesting,
    ...getElementLocatorSelectors(baseElement),
  };
}

/**
 * Renders a directive for testing with Vitest Browser Mode.
 *
 * @param directiveClass - The directive class to test
 * @param options - Configuration including the template where the directive is applied
 * @returns A render result with fixture, directive instance, and query methods
 *
 * @example
 * ```typescript
 * // Basic directive test
 * const { directiveInstance, locator } = await renderDirective(HighlightDirective, {
 *   template: `<div appHighlight>Test</div>`,
 * });
 *
 * // With host input binding
 * const { locator } = await renderDirective(HighlightDirective, {
 *   template: `<div [appHighlight]="color" (blurred)="onClick($event)">Test</div>`,
 *   hostProps: { color: 'red', onClick: vi.fn() },
 *   imports: [JsonPipe], // extra imports for template
 * });
 * ```
 */
export async function renderDirective<T>(
  directiveClass: Type<T>,
  options: DirectiveRenderOptions,
): Promise<DirectiveRenderResult<T>> {
  const baseElement = options.baseElement || document.body;
  const extraImports = options.imports || [];
  if (extraImports.includes(directiveClass)) {
    throw new Error(
      `[renderDirective] The directive ${directiveClass.name} is already passed as the first argument and is added ` +
        `to the test module's \`imports\` automatically. Remove it from \`options.imports\` to avoid a duplicate import.`,
    );
  }
  const imports = [directiveClass, ...extraImports];
  const providers = [...(options.providers || [])];
  const hostProps = options.hostProps || {};
  const changeDetection = options.changeDetection || 'onPush';
  @Component({
    selector: 'test-host',
    imports,
    template: options.template,
    ...(changeDetection === 'eager' ? { changeDetection: ChangeDetectionStrategy.Eager } : {}),
  })
  class TestHostComponent {
    constructor() {
      if (options.hostProps) {
        Object.assign(this, hostProps);
      }
    }
  }

  const {
    fixture: hostFixture,
    container,
    locator,
    debug,
  } = await render(TestHostComponent, {
    providers,
    baseElement,
  });
  const directiveDE = hostFixture.debugElement.query(By.directive(directiveClass));
  if (!directiveDE) {
    throw new Error(
      `[renderDirective] Could not find directive ${directiveClass.name} in template. ` +
        `Make sure the template includes the directive selector`,
    );
  }

  return {
    container,
    baseElement,
    hostFixture,
    locator,
    directiveInstance: directiveDE.injector.get(directiveClass) as T,
    debug: (el = container, maxLength?: number, opts?: PrettyDOMOptions) =>
      debug(el, maxLength, opts),
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
function _createBindingsComponent<C extends Type<unknown>>(
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

function _createFeaturesHttp(httpConfig: HttpConfig | true): HttpFeature<HttpFeatureKind>[] {
  const features: HttpFeature<HttpFeatureKind>[] = [];
  if (typeof httpConfig === 'boolean') return features;

  const { interceptors } = httpConfig;
  if (interceptors && interceptors.length > 0) {
    features.unshift(withInterceptors(interceptors));
  }
  return features;
}
