import type { HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Injector, Type } from '@angular/core';
import type { DebugElement } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { page, utils } from 'vitest/browser';
import type { PrettyDOMOptions } from 'vitest/browser';

import { createDirectiveFixture, toDirectiveFixture } from './directive-fixture';
import { VitestBrowserAngularError } from './errors/vitest-browser-angular';
import { render } from './render';
import type {
  DirectiveFixtureLike,
  DirectiveHostRenderOptions,
  DirectiveRenderOptions,
  DirectiveRenderResult,
  Inputs,
} from './types/render';
import { attachModelWriteBack, createBindings, createRerender } from './utils/bindings';
import { EAGER_CHANGE_DETECTION } from './utils/change-detection';
import { renderDeferBlockState } from './utils/defer';
import { ensureTestIdAttribute, removeAngularAttributes } from './utils/dom';
import { injectHttpTestingController } from './utils/http';
import { createInjectFn } from './utils/inject';
import { overrideMetadata } from './utils/metadata';
import { configureTestBed } from './utils/testbed';

const { debug, getElementLocatorSelectors } = utils;

/**
 * Renders a directive for testing with Vitest Browser Mode.
 *
 * Two modes are available, selected by the presence of a `template`:
 *
 * - With a `template`: the directive is applied inside a generated host component, which also
 *   supports structural directives and projected content;
 * - Without a `template`: the directive is applied directly to a bare host element, driven by
 *   `inputs`/`outputs`/`tagName`. This maps to Angular's `TestBed.createDirective()` when available
 *   and is emulated on older versions with the same result surface.
 *
 * @example
 *   ```typescript
 *   // Template mode: content and structural directives
 *   const { directiveInstance, locator } = await renderDirective(HighlightDirective, {
 *   template: `<div appHighlight>Test</div>`,
 *   });
 *
 *   // Host mode: no template, inputs and outputs are bound directly
 *   const { fixture, locator } = await renderDirective(HighlightDirective, {
 *   tagName: 'button',
 *   inputs: { color: 'red' },
 *   outputs: { onBlur: vi.fn() },
 *   });
 *   ```
 *
 * @param directiveClass - The directive class to test
 * @param options - Configuration for the render
 * @returns A render result with fixture, directive instance, and query methods
 */
export async function renderDirective<T>(
  directiveClass: Type<T>,
  options: DirectiveRenderOptions,
): Promise<DirectiveRenderResult<T>>;
export async function renderDirective<T>(
  directiveClass: Type<T>,
  options?: DirectiveHostRenderOptions<Type<T>>,
): Promise<DirectiveRenderResult<T>>;
export async function renderDirective<T>(
  directiveClass: Type<T>,
  options?: DirectiveRenderOptions | DirectiveHostRenderOptions<Type<T>>,
): Promise<DirectiveRenderResult<T>> {
  return isHostMode(options)
    ? await renderDirectiveOnHost(directiveClass, options)
    : await renderDirectiveInTemplate(directiveClass, options as DirectiveRenderOptions);
}

function isHostMode<T>(
  options?: DirectiveRenderOptions | DirectiveHostRenderOptions<Type<T>>,
): options is DirectiveHostRenderOptions<Type<T>> {
  return options?.template === undefined;
}

/** Renders the directive inside the given `template`, through a generated host component. */
async function renderDirectiveInTemplate<T>(
  directiveClass: Type<T>,
  options: DirectiveRenderOptions,
): Promise<DirectiveRenderResult<T>> {
  const {
    baseElement = document.body,
    imports: extraImports = [],
    hostProps = {},
    providers = [],
    overrideImportsDirective = [],
    overrideProvidersDirective = [],
    changeDetection = 'onPush',
    template,
    removeAngularAttributes: shouldRemoveAngularAttributes,
    schema,
    withHttp,
    deferBlockBehavior,
    deferBlockStates,
  } = options;

  if (extraImports.includes(directiveClass)) {
    throw new VitestBrowserAngularError(
      `The directive ${directiveClass.name} is already passed as the first argument and is added ` +
        `to the test module's \`imports\` automatically. Remove it from \`options.imports\` to avoid a duplicate import.`,
    );
  }
  overrideMetadata(directiveClass, 'directive', 'imports', overrideImportsDirective);
  overrideMetadata(directiveClass, 'directive', 'providers', overrideProvidersDirective);

  const imports = [directiveClass, ...extraImports];
  const eagerChangeDetection = EAGER_CHANGE_DETECTION;

  @Component({
    selector: 'test-host',
    imports,
    template,
    changeDetection:
      changeDetection === 'eager' ? eagerChangeDetection : ChangeDetectionStrategy.OnPush,
  })
  class TestHostComponent {
    constructor() {
      if (hostProps) {
        Object.assign(this, hostProps);
      }
    }
  }

  const {
    fixture: hostFixture,
    container,
    httpTesting,
  } = await render(TestHostComponent, {
    providers,
    baseElement,
    withHttp,
    schema,
    removeAngularAttributes: shouldRemoveAngularAttributes,
    deferBlockBehavior,
    deferBlockStates,
  });

  const [directiveNode] = hostFixture.debugElement.queryAllNodes(
    By.directive(directiveClass),
  ) as DebugElement[];

  if (!directiveNode) {
    throw new VitestBrowserAngularError(
      `Could not find directive ${directiveClass.name} in template. ` +
        `Make sure the template includes the directive selector`,
    );
  }

  const fixture = toDirectiveFixture(hostFixture, directiveNode.injector.get(directiveClass) as T);

  return buildRenderResult<T>({
    fixture,
    injector: directiveNode.injector,
    container,
    hostElement: directiveNode.nativeElement as HTMLElement,
    baseElement,
    httpTesting,
    rerender: async () => {
      throw new VitestBrowserAngularError(
        `rerender() is only available when the directive is rendered without a \`template\`. ` +
          `Use writable signals in \`hostProps\` and \`await fixture.whenStable()\` instead.`,
      );
    },
    renderDeferBlock: (deferBlockState, deferBlockIndex) =>
      renderDeferBlockState(hostFixture, deferBlockState, deferBlockIndex),
  });
}

/** Applies the directive directly to a bare host element, without any template. */
async function renderDirectiveOnHost<T>(
  directiveClass: Type<T>,
  options: DirectiveHostRenderOptions<Type<T>> = {},
): Promise<DirectiveRenderResult<T>> {
  const {
    baseElement = document.body,
    providers = [],
    tagName,
    inputs,
    outputs,
    overrideImportsDirective = [],
    overrideProvidersDirective = [],
    removeAngularAttributes: shouldRemoveAngularAttributes,
    withHttp,
    deferBlockBehavior = DeferBlockBehavior.Manual,
  } = options;

  overrideMetadata(directiveClass, 'directive', 'imports', overrideImportsDirective);
  overrideMetadata(directiveClass, 'directive', 'providers', overrideProvidersDirective);

  const { bindings, inputSignals } = createBindings<typeof directiveClass>(inputs, outputs);

  await configureTestBed({
    providers,
    withHttp,
    deferBlockBehavior,
  });

  const httpTesting = injectHttpTestingController();

  const fixture = createDirectiveFixture(directiveClass, { tagName, bindings, baseElement });

  attachModelWriteBack(fixture.directiveInstance as Record<string, unknown>, inputSignals);

  const rerender = createRerender<typeof directiveClass>(fixture, inputSignals, 'directive');

  fixture.autoDetectChanges();
  await fixture.whenStable();

  if (shouldRemoveAngularAttributes) {
    removeAngularAttributes(fixture.nativeElement as HTMLElement);
  }

  return buildRenderResult<T>({
    fixture,
    injector: fixture.debugElement.injector,
    container: fixture.nativeElement as HTMLElement,
    hostElement: fixture.nativeElement as HTMLElement,
    baseElement,
    httpTesting,
    rerender,
    renderDeferBlock: async () => {
      throw new VitestBrowserAngularError(
        `renderDeferBlock() is only available when the directive is rendered with a \`template\`.`,
      );
    },
  });
}

/** Assembles the render result shared by both modes. */
function buildRenderResult<T>({
  fixture,
  injector,
  container,
  hostElement,
  baseElement,
  httpTesting,
  rerender,
  renderDeferBlock,
}: {
  fixture: DirectiveFixtureLike<T>;
  injector: Injector | undefined;
  container: HTMLElement;
  hostElement: HTMLElement;
  baseElement: HTMLElement;
  httpTesting?: HttpTestingController;
  rerender: (newInputs: Inputs<Type<T>>) => Promise<void>;
  renderDeferBlock: (deferBlockState: DeferBlockState, deferBlockIndex?: number) => Promise<void>;
}): DirectiveRenderResult<T> {
  ensureTestIdAttribute(baseElement);
  ensureTestIdAttribute(container);
  const locator = page.elementLocator(container);

  return {
    baseElement,
    container,
    hostElement,
    fixture,
    hostFixture: fixture,
    debug: (el = container, maxLength?: number, opts?: PrettyDOMOptions) =>
      debug(el, maxLength, opts),
    directiveInstance: fixture.directiveInstance,
    locator,
    inject: createInjectFn(injector),
    httpTesting,
    rerender,
    renderDeferBlock,
    ...getElementLocatorSelectors(baseElement),
  };
}
