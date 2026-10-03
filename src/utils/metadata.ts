import type { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * @param instance - The component or directive class being overridden.
 * @param type - Whether `instance` is a component or a directive.
 * @param metadataKey - The `imports` or `providers` metadata key.
 * @param overrides - The `replace`/`with` pairs provided by the caller.
 * @internal
 * Applies the `overrideImports*` / `overrideProviders*` options through the TestBed metadata
 * overriders. A no-op when there is nothing to override.
 */
export function overrideMetadata<T>(
  instance: Type<T>,
  type: 'component' | 'directive',
  metadataKey: keyof Pick<Component, 'imports' | 'providers'>,
  overrides: Array<{ replace: unknown; with: unknown }>,
) {
  if (overrides.length === 0) return;

  const override = {
    remove: {
      [metadataKey]: overrides.map(o => o.replace),
    },
    add: {
      [metadataKey]: overrides.map(o => o.with),
    },
  };

  if (type === 'component') {
    TestBed.overrideComponent(instance, override);
  } else {
    TestBed.overrideDirective(instance, override);
  }
}
