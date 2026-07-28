import { signal } from '@angular/core';
import { userEvent } from 'vitest/browser';
import { renderDirective } from '@wismaz/vitest-browser-angular';
import { ChangeClass } from './directives/change-class';

test('renders directive', async () => {
  const className = signal('test');
  const { getByText, hostFixture } = await renderDirective(ChangeClass, {
    template: `<button test [className]="test()" (blurred)="onBlur($event)">Test</button>`,
    hostProps: {
      test: className,
    },
  });
  expect(getByText('Test')).toHaveClass('test');

  className.set('changed');
  await hostFixture.whenStable();
  await expect.element(getByText('Test')).toHaveClass('changed');
});

test('renders directive and emits outputs', async () => {
  const blurredSpy = vi.fn();
  const { getByText } = await renderDirective(ChangeClass, {
    template: `<button test (blurred)="onBlur($event)">Test</button>`,
    hostProps: {
      onBlur: blurredSpy,
    },
  });
  await userEvent.keyboard('{Tab}');
  await expect.element(getByText('Test')).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  expect(blurredSpy).toHaveBeenCalled();
});

test('throws when the directive is also listed in imports', async () => {
  await expect(
    renderDirective(ChangeClass, {
      template: `<button test>Test</button>`,
      imports: [ChangeClass],
    }),
  ).rejects.toThrowError(
    `[renderDirective] The directive ChangeClass is already passed as the first argument and is added ` +
      `to the test module's \`imports\` automatically. Remove it from \`options.imports\` to avoid a duplicate import.`,
  );
});
