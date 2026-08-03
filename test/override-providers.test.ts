import { render } from '@wismaz/vitest-browser-angular';
import {
  CustomGreetingService,
  GreetingService,
  SelfProvidedComponent,
  ServiceConsumerComponent,
} from './components/service-consumer.component';

describe('overrideProvidersComponent', () => {
  test('renders component with default service provider', async () => {
    const { locator } = await render(ServiceConsumerComponent, {
      providers: [GreetingService],
    });

    await expect.element(locator.getByTestId('greeting')).toHaveTextContent('Hello, World!');
    await expect
      .element(locator.getByTestId('message'))
      .toHaveTextContent('This component uses injected services');
  });

  test('renders self-provided component without override', async () => {
    const { locator } = await render(SelfProvidedComponent);

    await expect.element(locator.getByTestId('greeting')).toHaveTextContent('Hello, World!');
  });

  test('replaces a shorthand provider with a useClass provider', async () => {
    const { locator } = await render(SelfProvidedComponent, {
      overrideProvidersComponent: [
        {
          replace: GreetingService,
          with: { provide: GreetingService, useClass: CustomGreetingService },
        },
      ],
    });

    await expect
      .element(locator.getByTestId('greeting'))
      .toHaveTextContent('Welcome, World! Nice to see you.');
  });

  test('replaces a provider with a factory provider', async () => {
    const { locator } = await render(SelfProvidedComponent, {
      overrideProvidersComponent: [
        {
          replace: GreetingService,
          with: {
            provide: GreetingService,
            useFactory: () => ({
              getGreeting: (name: string) => `Hey ${name}, what's up?`,
            }),
          },
        },
      ],
    });

    await expect
      .element(locator.getByTestId('greeting'))
      .toHaveTextContent("Hey World, what's up?");
  });

  test('replaces a provider with a value provider', async () => {
    const mockService = {
      getGreeting: (name: string) => `Greetings, ${name}!`,
    };

    const { locator } = await render(SelfProvidedComponent, {
      overrideProvidersComponent: [
        {
          replace: GreetingService,
          with: { provide: GreetingService, useValue: mockService },
        },
      ],
    });

    await expect.element(locator.getByTestId('greeting')).toHaveTextContent('Greetings, World!');
  });
});
