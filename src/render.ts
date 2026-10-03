import type { HttpTestingController } from '@angular/common/http/testing';
import { isStandalone } from '@angular/core';
import type { Type } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { page, utils } from 'vitest/browser';

import { VitestBrowserAngularError } from './errors/vitest-browser-angular';
import type {
  BaseRenderOptions,
  ComponentRenderOptions,
  DeferBlockStateConfig,
  RenderResult,
  RoutedFallbackRenderOptions,
  RoutedRenderOptions,
  RoutedRenderResult,
  RoutingConfig,
} from './types/render';
import { attachModelWriteBack, createBindings, createRerender } from './utils/bindings';
import { renderDeferBlockStates, renderDeferBlockState } from './utils/defer';
import { ensureTestIdAttribute, removeAngularAttributes } from './utils/dom';
import { injectHttpTestingController } from './utils/http';
import { createInjectFn } from './utils/inject';
import { overrideMetadata } from './utils/metadata';
import { configureTestBed } from './utils/testbed';

const { debug, getElementLocatorSelectors } = utils;

/**
 * Renders an Angular component for testing with Vitest Browser Mode.
 *
 * @example
 *   ```typescript
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
 *   ```;
 *
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
    throw new VitestBrowserAngularError('The component must be standalone.');
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
    removeAngularAttributes: shouldRemoveAngularAttributes,
    overrideImportsComponent = [],
    overrideProvidersComponent = [],
    inferTagName,
    deferBlockBehavior = DeferBlockBehavior.Manual,
    deferBlockStates,
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

  const routingConfig: RoutingConfig | undefined = withRouting
    ? typeof withRouting === 'boolean'
      ? {
          routes: [{ path: '**', component: componentClass }],
          initialRoute: '/',
        }
      : withRouting
    : undefined;

  overrideMetadata(componentClass, 'component', 'imports', overrideImportsComponent);
  overrideMetadata(componentClass, 'component', 'providers', overrideProvidersComponent);

  await configureTestBed({
    imports,
    providers,
    withHttp,
    routingConfig,
    deferBlockBehavior,
    schema,
  });

  const httpTesting = injectHttpTestingController();

  if (routingConfig) {
    return await routedRenderResult<T>(routingConfig, {
      removeAngularAttributes: shouldRemoveAngularAttributes,
      baseElement,
      httpTesting,
      deferBlockStates,
    });
  }

  const { bindings, inputSignals } = createBindings<typeof componentClass>(inputs, outputs);
  const fixture = TestBed.createComponent(componentClass, {
    bindings,
    inferTagName,
  });
  const container = fixture.nativeElement;
  const componentClassInstance = fixture.componentInstance;

  attachModelWriteBack(componentClassInstance as Record<string, unknown>, inputSignals);

  const rerender = createRerender<typeof componentClass>(fixture, inputSignals);

  const inject = createInjectFn(fixture.debugElement.injector);

  fixture.autoDetectChanges();
  await fixture.whenStable();

  if (deferBlockStates) {
    await renderDeferBlockStates(fixture, deferBlockStates);
  }

  if (shouldRemoveAngularAttributes) {
    removeAngularAttributes(container);
  }

  ensureTestIdAttribute(baseElement);
  ensureTestIdAttribute(container);
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
    renderDeferBlock: (deferBlockState, deferBlockIndex) =>
      renderDeferBlockState(fixture, deferBlockState, deferBlockIndex),
    ...getElementLocatorSelectors(baseElement),
  };
}

async function routedRenderResult<T>(
  routingConfig: RoutingConfig,
  {
    baseElement,
    httpTesting,
    removeAngularAttributes: shouldRemoveAngularAttributes,
    deferBlockStates,
  }: {
    removeAngularAttributes?: boolean;
    baseElement: HTMLElement;
    httpTesting?: HttpTestingController;
    deferBlockStates?: DeferBlockState | Array<DeferBlockStateConfig>;
  },
): Promise<RoutedRenderResult<T>> {
  const routerHarness = await RouterTestingHarness.create(routingConfig.initialRoute);
  const router = TestBed.inject(Router);
  const fixture = routerHarness.fixture;

  const container = routerHarness.routeNativeElement!;
  const componentClassInstance = routerHarness.routeDebugElement?.componentInstance as T;
  const inject = createInjectFn(routerHarness.routeDebugElement?.injector);

  fixture.autoDetectChanges();
  await fixture.whenStable();

  if (deferBlockStates) {
    await renderDeferBlockStates(fixture, deferBlockStates);
  }

  if (shouldRemoveAngularAttributes) {
    removeAngularAttributes(container);
  }

  ensureTestIdAttribute(baseElement);
  ensureTestIdAttribute(container);
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
    renderDeferBlock: (deferBlockState, deferBlockIndex) =>
      renderDeferBlockState(fixture, deferBlockState, deferBlockIndex),
    ...getElementLocatorSelectors(baseElement),
  };
}
