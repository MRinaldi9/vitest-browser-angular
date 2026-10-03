import {
  HttpFeature,
  HttpFeatureKind,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { HttpConfig } from '../types/render';

/**
 * @internal
 * Translates the `withHttp` option into the `HttpFeature`s forwarded to `provideHttpClient()`.
 */
export function createHttpFeatures(httpConfig: HttpConfig | true): HttpFeature<HttpFeatureKind>[] {
  const features: HttpFeature<HttpFeatureKind>[] = [];
  if (typeof httpConfig === 'boolean') return features;

  const { interceptors } = httpConfig;
  if (interceptors && interceptors.length > 0) {
    features.unshift(withInterceptors(interceptors));
  }
  return features;
}

/**
 * @internal
 * Returns the HttpClient testing providers when `withHttp` is enabled, an empty list otherwise.
 */
export function provideHttpTesting(
  withHttp?: HttpConfig | boolean,
): Array<Provider | EnvironmentProviders> {
  if (!withHttp) return [];
  return [provideHttpClient(...createHttpFeatures(withHttp)), provideHttpClientTesting()];
}

/**
 * @internal
 * Resolves the `HttpTestingController` installed by `provideHttpClientTesting()`.
 *
 * Returns `undefined` when `withHttp` was not enabled. Must be called once the testing module has
 * been configured and compiled.
 */
export function injectHttpTestingController(): HttpTestingController | undefined {
  return TestBed.inject(HttpTestingController, undefined, { optional: true }) ?? undefined;
}
