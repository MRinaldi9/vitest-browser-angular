import { Component, InjectionToken } from '@angular/core';
import { render } from '@wismaz/vitest-browser-angular';
import { HomeComponent } from './components/home.component';
import { RoutedComponent } from './components/routed.component';
import { GreetingService, ServiceConsumerComponent } from './components/service-consumer.component';

const LOGIN_TOKEN = new InjectionToken<string>('login');

describe('inject feature', () => {
  test('inject resolves a service from global providers', async () => {
    const { inject } = await render(ServiceConsumerComponent, {
      providers: [GreetingService],
    });

    const result = inject(GreetingService);
    expect(result).toBeInstanceOf(GreetingService);
    expect(result.getGreeting('World')).toBe('Hello, World!');
  });

  test('inject resolves a service from component-level providers', async () => {
    const { inject } = await render(ServiceConsumerComponent, {
      componentProviders: [GreetingService],
    });

    const result = inject(GreetingService);
    expect(result).toBeInstanceOf(GreetingService);
    expect(result.getGreeting('World')).toBe('Hello, World!');
  });

  test('inject resolves from component-level when same token exists at both levels', async () => {
    const { inject } = await render(ServiceConsumerComponent, {
      providers: [GreetingService],
      componentProviders: [
        {
          provide: GreetingService,
          useClass: class extends GreetingService {
            override getGreeting(name: string): string {
              return `Hi ${name}!`;
            }
          },
        },
      ],
    });

    const result = inject(GreetingService);
    expect(result.getGreeting('World')).toBe('Hi World!');
  });

  test('inject resolves an InjectionToken', async () => {
    @Component({
      template: '<p>{{ token }}</p>',
    })
    class TokenComponent {
      token = 'token works';
    }

    const { inject } = await render(TokenComponent, {
      providers: [{ provide: LOGIN_TOKEN, useValue: 'admin' }],
    });

    expect(inject(LOGIN_TOKEN)).toBe('admin');
  });

  test('inject works with a routed component', async () => {
    const { inject } = await render(RoutedComponent, {
      withRouting: {
        routes: [
          { path: '', component: RoutedComponent },
          { path: 'home', component: HomeComponent },
        ],
        initialRoute: '/home',
      },
      providers: [GreetingService],
    });

    const result = inject(GreetingService);
    expect(result).toBeInstanceOf(GreetingService);
  });

  test('inject throws for an unregistered token', async () => {
    const { inject } = await render(ServiceConsumerComponent, {
      providers: [GreetingService],
    });

    expect(() => inject(LOGIN_TOKEN)).toThrow();
  });
});
