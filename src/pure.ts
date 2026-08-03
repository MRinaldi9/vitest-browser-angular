import {
  HttpFeature,
  HttpFeatureKind,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Injector, ProviderToken, Type, WritableSignal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  inputBinding,
  isStandalone,
  outputBinding,
  signal,
} from '@angular/core';
import { ɵgetCleanupHook as getCleanupHook, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { assert } from 'vitest';
import { page, PrettyDOMOptions, server, utils } from 'vitest/browser';
import {
  BaseRenderOptions,
  ComponentRenderOptions,
  DirectiveRenderOptions,
  DirectiveRenderResult,
  HttpConfig,
  Inputs,
  Outputs,
  RenderResult,
  RoutedFallbackRenderOptions,
  RoutedRenderOptions,
  RoutedRenderResult,
  RoutingConfig,
} from './types/render';
import { isModelSignal, isWSignal } from './utils/signals';

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
): Promise<RenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options: RoutedRenderOptions<Type<T>>,
): Promise<RoutedRenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options: RoutedFallbackRenderOptions<Type<T>>,
): Promise<RenderResult<T> | RoutedRenderResult<T>>;
export async function render<T>(
  componentClass: Type<T>,
  options?: BaseRenderOptions<Type<T>>,
): Promise<RenderResult<T> | RoutedRenderResult<T>> {
  if (!isStandalone(componentClass)) {
    throw new Error('[vitest-browser-angular] The component must be standalone.');
  }
  const {
    baseElement = document.body,
    imports = [],
    providers = [],
    withRouting,
    inputs,
    outputs,
    withHttp,
    schema,
    removeAngularAttributes,
    overrideImportsComponent = [],
    overrideProvidersComponent = [],
    inferTagName,
  } = options || {};

  if (withRouting && inputs) {
    console.warn(
      '[vitest-browser-angular] Using `inputs` with `withRouting` is not supported. ' +
        'Inputs cannot be passed directly to routed components. ' +
        'Consider passing data via route params, query params, or route data instead.',
    );
  }
  if (withRouting && outputs) {
    console.warn('[vitest-browser-angular] Using `outputs` with `withRouting` is not supported.');
  }

  const routingConfig = withRouting
    ? typeof withRouting === 'boolean'
      ? {
          routes: [{ path: '**', component: componentClass }],
          initialRoute: '/',
        }
      : withRouting
    : undefined;

  if (routingConfig) {
    if (routingConfig.disableInputBinding) {
      providers.push(provideRouter(routingConfig.routes));
    } else {
      providers.push(provideRouter(routingConfig.routes, withComponentInputBinding()));
    }
  }

  if (withHttp || (typeof withHttp === 'boolean' && withHttp)) {
    const httpFeatures = _createFeaturesHttp(withHttp);

    providers.push(provideHttpClient(...httpFeatures), provideHttpClientTesting());
  }

  TestBed.configureTestingModule({
    imports,
    providers,
    ...(schema ? { schemas: [schema] } : {}),
  });

  _overrideMetadataComponent(componentClass, 'imports', overrideImportsComponent);
  _overrideMetadataComponent(componentClass, 'providers', overrideProvidersComponent);

  const httpTesting =
    TestBed.inject(HttpTestingController, undefined, { optional: true }) ?? undefined;

  if (routingConfig) {
    return await _routedRenderResult<T>(routingConfig, {
      removeAngularAttributes,
      baseElement,
      httpTesting,
    });
  }

  const { bindings, inputSignals } = _createBindingsComponent(inputs, outputs);
  const fixture = TestBed.createComponent(componentClass, {
    bindings,
    inferTagName,
  });
  const container = fixture.nativeElement;
  const componentClassInstance = fixture.componentInstance;

  _attachModelWriteBack(componentClassInstance as Record<string, unknown>, inputSignals);

  const rerender = async (newInputs: Inputs<typeof componentClass>) => {
    for (const [key, value] of Object.entries(newInputs)) {
      if (key in inputSignals) {
        inputSignals[key].set(value);
      } else {
        throw new Error(
          `[render] Cannot rerender component with input "${key}" because it was not provided in the initial render options.`,
        );
      }
    }
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const inject = _inject(fixture.debugElement.injector);

  fixture.autoDetectChanges();
  await fixture.whenStable();

  if (removeAngularAttributes) {
    _removeAngularAttrs(container);
  }

  _ensureTestIdAttribute(baseElement);
  _ensureTestIdAttribute(container);
  const locator = page.elementLocator(container);

  return {
    baseElement,
    container,
    fixture,
    debug: (el = baseElement, maxLength, opts) => debug(el, maxLength, opts),
    componentClassInstance,
    locator,
    httpTesting,
    rerender,
    inject,
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

let testIdCounter = 0;

/**
 * @internal
 * Ensures the element carries a stable `data-testid` so that
 * `page.elementLocator()` generates a selector that survives DOM mutations
 * (instead of a text-based selector that goes stale).
 */
function _ensureTestIdAttribute(element: HTMLElement) {
  const attributeId = server.config.browser.locators.testIdAttribute;
  if (!element.hasAttribute(attributeId)) {
    element.setAttribute(attributeId, `__vitest_${testIdCounter++}__`);
  }
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
  const inputSignals: Record<string, WritableSignal<unknown>> = {};
  const inputBindings = Object.entries(inputsBinding).map(([key, value]) => {
    const tmpSignal = isWSignal(value) ? value : signal(value);
    inputSignals[key] = tmpSignal;
    return inputBinding(key, tmpSignal);
  });
  const outputBindings = Object.entries(outputsBinding).map(([key, value]) =>
    outputBinding(key, value as (v: unknown) => unknown),
  );
  return { inputSignals, bindings: [...inputBindings, ...outputBindings] };
}

/**
 * @internal
 * Wires model input write-back after the component instance exists.
 *
 * `inputBinding()` already covers the input side of model inputs (they are `InputSignal`s).
 * Subscribing to the model's `Change` output keeps the source signal in sync when the
 * component updates the model, mirroring Angular's `twoWayBinding()`.
 */
function _attachModelWriteBack(
  instance: Record<string, unknown>,
  inputSignals: Record<string, WritableSignal<unknown>>,
) {
  for (const key of Object.keys(inputSignals)) {
    const prop = instance[key];
    if (isModelSignal(prop)) {
      prop.subscribe(value => inputSignals[key].set(value));
    }
  }
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

async function _routedRenderResult<T>(
  routingConfig: RoutingConfig,
  {
    baseElement,
    httpTesting,
    removeAngularAttributes,
  }: {
    removeAngularAttributes?: boolean;
    baseElement: HTMLElement;
    httpTesting?: HttpTestingController;
  },
): Promise<RoutedRenderResult<T>> {
  const routerHarness = await RouterTestingHarness.create(routingConfig.initialRoute);
  const router = TestBed.inject(Router);
  const fixture = routerHarness.fixture;

  const container = routerHarness.routeNativeElement!;
  const componentClassInstance = routerHarness.routeDebugElement?.componentInstance as T;
  const inject = _inject(routerHarness.routeDebugElement?.injector);

  fixture.autoDetectChanges();
  await fixture.whenStable();

  if (removeAngularAttributes) {
    _removeAngularAttrs(container);
  }

  _ensureTestIdAttribute(baseElement);
  _ensureTestIdAttribute(container);
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
    inject,
    ...getElementLocatorSelectors(baseElement),
  };
}

/**
 * @internal
 * Closure that returns an `inject` function for the given injector. Throws if the injector is undefined.
 * @param injector - The Angular injector to use for dependency resolution.
 * @returns A function that takes a token and returns the corresponding instance from the injector.
 */
function _inject(injector: Injector | undefined): <T>(token: ProviderToken<T>) => T {
  assert(injector, '[vitest-browser-angular] Injector is undefined. Cannot inject dependencies.');
  return token => injector.get(token);
}

function _removeAngularAttrs(element: HTMLElement) {
  element.removeAttribute('ng-version');
}

function _overrideMetadataComponent<T>(
  componentClass: Type<T>,
  metadataKey: keyof Pick<Component, 'imports' | 'providers'>,
  overrides: Array<{ replace: unknown; with: unknown }>,
) {
  if (overrides.length === 0) return;
  TestBed.overrideComponent(componentClass, {
    remove: {
      [metadataKey]: overrides.map(o => o.replace),
    },
    add: {
      [metadataKey]: overrides.map(o => o.with),
    },
  });
}
