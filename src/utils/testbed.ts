import type { EnvironmentProviders, Provider, SchemaMetadata } from '@angular/core';
import type { DeferBlockBehavior } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import type { HttpConfig, RoutingConfig } from '../types/render';
import { provideHttpTesting } from './http';

/** Options shared by every render mode that configures the TestBed. */
export interface ConfigureTestBedOptions {
  imports?: Array<unknown>;
  providers?: Array<Provider | EnvironmentProviders>;
  withHttp?: HttpConfig | boolean;
  routingConfig?: RoutingConfig;
  deferBlockBehavior?: DeferBlockBehavior;
  schema?: SchemaMetadata | Array<SchemaMetadata>;
}

/**
 * @internal
 * Configures and compiles the testing module shared by `render()` and `renderDirective()`.
 *
 * Router and HttpClient providers are derived from the render options and appended to a copy of
 * the caller's `providers` array, so reusing the same options object across renders never
 * accumulates providers.
 */
export async function configureTestBed({
  imports,
  providers,
  withHttp,
  routingConfig,
  deferBlockBehavior,
  schema,
}: ConfigureTestBedOptions = {}): Promise<void> {
  const testProviders: Array<Provider | EnvironmentProviders> = [...(providers ?? [])];

  if (routingConfig) {
    testProviders.push(
      routingConfig.disableInputBinding
        ? provideRouter(routingConfig.routes)
        : provideRouter(routingConfig.routes, withComponentInputBinding()),
    );
  }

  testProviders.push(...provideHttpTesting(withHttp));

  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : undefined;

  TestBed.configureTestingModule({
    imports,
    providers: testProviders,
    deferBlockBehavior,
    schemas,
  });

  await TestBed.compileComponents();
}
