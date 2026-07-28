import { HttpInterceptorFn } from '@angular/common/http';
import { render } from '../src';
import { HttpDemoComponent } from './components/http-demo.component';

describe('withHttp', () => {
  test('exposes httpTesting and flushes a mocked response when withHttp is true', async () => {
    const { locator, httpTesting } = await render(HttpDemoComponent, { withHttp: true });

    expect(httpTesting).toBeDefined();

    await locator.getByTestId('fetch').click();

    const req = httpTesting!.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush({ title: 'Hello HTTP' });

    await expect.element(locator.getByTestId('title')).toHaveTextContent('Hello HTTP');
  });

  test('applies custom interceptors when withHttp is configured with them', async () => {
    const authInterceptor: HttpInterceptorFn = (req, next) =>
      next(req.clone({ setHeaders: { 'X-Custom': 'test-value' } }));

    const { locator, httpTesting } = await render(HttpDemoComponent, {
      withHttp: { interceptors: [authInterceptor] },
    });

    expect(httpTesting).toBeDefined();

    await locator.getByTestId('fetch').click();

    const req = httpTesting!.expectOne('/api/data');
    expect(req.request.headers.get('X-Custom')).toBe('test-value');
    req.flush({ title: 'Intercepted' });

    await expect.element(locator.getByTestId('title')).toHaveTextContent('Intercepted');
  });

  test('does not expose httpTesting when withHttp is omitted', async () => {
    const { httpTesting } = await render(HttpDemoComponent);

    expect(httpTesting).toBeUndefined();
  });
});
