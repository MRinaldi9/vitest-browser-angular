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

export interface DirectiveRenderOptions {
  /** Template to render the directive in. Must include the directive selector. */
  template: string;

  /** Host component input values to pass and make reactive. */
  hostProps?: Record<string, unknown>;

  /** Additional imports for the test module. */
  imports?: Type<unknown>[];

  /** Additional providers for the test module. */
  providers?: Provider[];

  /** The base element for screen queries. Defaults to document.body. */
  baseElement?: HTMLElement;
}

export interface DirectiveRenderResult<T> extends LocatorSelectors {
  container: HTMLElement;
  baseElement: HTMLElement;
  /**
   * The host component's fixture.
   */
  fixture: ComponentFixture<unknown>;
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
  const imports = [directiveClass, ...(options.imports || [])];
  const providers = [...(options.providers || [])];
  const hostProps = options.hostProps || {};
  @Component({
    selector: 'test-host',
    imports,
    template: options.template,
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TestHostComponent {
    constructor() {
      if (options.hostProps) {
        Object.assign(this, hostProps);
      }
    }
  }

  const { fixture, container, locator, debug } = await render(TestHostComponent, {
    providers,
    baseElement,
  });
  const directiveDE = fixture.debugElement.query(By.directive(directiveClass));
  if (!directiveDE) {
    throw new Error(
      `[renderDirective] Could not find directive ${directiveClass.name} in template. ` +
        `Make sure the template includes the directive selector and it is imported.`,
    );
  }
  return {
    container,
    baseElement,
    fixture,
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
