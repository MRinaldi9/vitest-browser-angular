import {
  Binding,
  Component,
  createComponent,
  EnvironmentInjector,
  ViewEncapsulation,
  ɵgetDirectiveDef as getDirectiveDef,
} from '@angular/core';
import type { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitestBrowserAngularError } from './errors/vitest-browser-angular';
import type { DirectiveFixtureLike } from './types/render';

/**
 * @internal
 * Empty host component mirroring Angular's internal `DirectiveTestHost` (22.2+): the directive is
 * applied to its host element, so no template is involved.
 */
@Component({
  selector: 'ng-directive-test-component',
  template: '',
  encapsulation: ViewEncapsulation.None,
})
class DirectiveTestHost {}

/** How `createDirectiveFixture()` picks its implementation. */
export type CreateDirectiveMode = 'auto' | 'emulated';

export interface CreateDirectiveFixtureOptions {
  /** Tag name of the host element. Inferred from the directive selector when omitted. */
  tagName?: string;
  /** Bindings applied to the directive itself. */
  bindings?: Array<Binding>;
  /** Element the host is appended to. Defaults to `document.body`. */
  baseElement?: HTMLElement;
}

/** Angular 22.2+ `TestBed.createDirective()`, referenced structurally to stay version agnostic. */
interface TestBedWithCreateDirective {
  createDirective?<T>(
    directive: Type<T>,
    options?: { tagName?: string; bindings?: Array<Binding> },
  ): DirectiveFixtureLike<T>;
}

/**
 * Fixtures created by the emulated implementation are not tracked by the TestBed, so they are
 * tracked here and destroyed on cleanup (the host element is ours and must be removed as well).
 */
const emulatedFixtures = new Set<DirectiveFixtureLike<unknown>>();

let mode: CreateDirectiveMode = 'auto';

/**
 * @internal
 * Overrides how directives are created. `'auto'` (default) uses Angular's `createDirective()` when
 * available and the emulated implementation otherwise.
 *
 * Exposed as a testing hook so both code paths can be exercised on a single Angular version.
 */
export function setCreateDirectiveMode(next: CreateDirectiveMode) {
  mode = next;
}

/**
 * @internal
 * Destroys the fixtures created by the emulated implementation and removes their host elements.
 */
export function destroyEmulatedDirectiveFixtures() {
  for (const fixture of emulatedFixtures) {
    try {
      fixture.destroy();
    } finally {
      fixture.nativeElement.remove();
    }
  }
  emulatedFixtures.clear();
}

/**
 * @internal
 * Creates the fixture of a directive applied to a bare host element.
 *
 * Delegates to Angular's `TestBed.createDirective()` when available (22.2+) and falls back to an
 * equivalent implementation built on the public `createComponent()` API otherwise, so both paths
 * return the same `DirectiveFixtureLike` surface.
 */
export function createDirectiveFixture<T>(
  directive: Type<T>,
  options: CreateDirectiveFixtureOptions = {},
): DirectiveFixtureLike<T> {
  const testBed = TestBed as unknown as TestBedWithCreateDirective;
  const resolvedTagName = resolveTagName(directive, options.tagName);

  if (mode === 'auto' && testBed.createDirective) {
    const fixture = testBed.createDirective(directive, {
      tagName: resolvedTagName,
      bindings: options.bindings,
    });
    moveToBaseElement(fixture.nativeElement, options.baseElement);
    return fixture;
  }

  return emulateCreateDirective(directive, resolvedTagName, options);
}

/**
 * @internal
 * Wraps a host component fixture into the directive fixture surface.
 *
 * Angular's `DirectiveFixture` is an `AbstractFixture` just like `ComponentFixture`, so adding the
 * directive-specific members is enough to expose the very same shape.
 */
export function toDirectiveFixture<T>(
  hostFixture: ComponentFixture<unknown>,
  directiveInstance: T,
): DirectiveFixtureLike<T> {
  return Object.assign(hostFixture, {
    directiveInstance,
    onDestroy: (callback: () => void) => hostFixture.componentRef.onDestroy(callback),
  });
}

/**
 * Emulated `TestBed.createDirective()`: creates the host element, applies the directive to it with
 * the requested bindings and wraps the host component fixture into a directive fixture.
 */
function emulateCreateDirective<T>(
  directive: Type<T>,
  tagName: string,
  { bindings = [], baseElement = document.body }: CreateDirectiveFixtureOptions,
): DirectiveFixtureLike<T> {
  if (!getDirectiveDef(directive)?.standalone) {
    throw new VitestBrowserAngularError(
      `The directive ${directive.name} is not standalone, so it cannot be applied to a bare host ` +
        `element. Declare it as standalone, or use the \`template\` mode of renderDirective().`,
    );
  }

  const hostElement = document.createElement(tagName);
  baseElement.appendChild(hostElement);

  const hostRef = createComponent(DirectiveTestHost, {
    hostElement,
    environmentInjector: TestBed.inject(EnvironmentInjector),
    directives: [bindings.length > 0 ? { type: directive, bindings } : directive],
  });

  const fixture = toDirectiveFixture(
    TestBed.runInInjectionContext(() => new ComponentFixture(hostRef)),
    hostRef.injector.get(directive, null, { self: true }) as T,
  );

  emulatedFixtures.add(fixture);

  return fixture;
}

/**
 * Resolves the host tag name from the options, falling back to the directive selector.
 *
 * Always resolved by this library (instead of delegating to Angular) so that both the native and
 * the emulated path report the very same error.
 */
function resolveTagName(directive: Type<unknown>, tagName: string | undefined): string {
  if (tagName) return tagName;

  const directiveDef = getDirectiveDef(directive);

  if (!directiveDef) {
    throw new VitestBrowserAngularError(`The directive ${directive.name} has not been compiled.`);
  }

  const tagNames = [
    ...new Set(
      directiveDef.selectors
        .map(([selectorTag]) => selectorTag)
        .filter((selectorTag): selectorTag is string => Boolean(selectorTag)),
    ),
  ];

  if (tagNames.length > 1) {
    throw new VitestBrowserAngularError(
      `The directive ${directive.name} has multiple tag names in its selector ` +
        `(${tagNames.join(', ')}). Specify which one to use via the \`tagName\` option.`,
    );
  }

  if (tagNames.length === 0) {
    throw new VitestBrowserAngularError(
      `Cannot determine the tag name for ${directive.name}: its selector does not include one and ` +
        `no \`tagName\` option was provided. Directives with an attribute-only selector (e.g. \`[appHighlight]\`) ` +
        `require an explicit \`tagName\`, e.g. 'div'.`,
    );
  }

  return tagNames[0];
}

/** Angular's `createDirective()` always appends the host element to `document.body`. */
function moveToBaseElement(hostElement: Element, baseElement: HTMLElement | undefined) {
  if (!baseElement || baseElement.contains(hostElement)) return;
  baseElement.appendChild(hostElement);
}
