import { render } from '@wismaz/vitest-browser-angular';
import { TypeFixtureComponent } from '../components/type-fixture.component';

describe('override providers', () => {
  test('accepts overrideProvidersComponent', async () => {
    await render(TypeFixtureComponent, {
      overrideProvidersComponent: [
        {
          replace: TypeFixtureComponent,
          with: { provide: TypeFixtureComponent, useClass: TypeFixtureComponent },
        },
      ],
    });
  });

  test('rejects removed componentProviders option', async () => {
    // @ts-expect-error componentProviders was removed in favor of overrideProvidersComponent
    await render(TypeFixtureComponent, { componentProviders: [TypeFixtureComponent] });
  });

  test('rejects malformed overrideProvidersComponent', async () => {
    await render(TypeFixtureComponent, {
      // @ts-expect-error replace must be a provider
      overrideProvidersComponent: [{ replace: 'nope', with: TypeFixtureComponent }],
    });
  });
});
