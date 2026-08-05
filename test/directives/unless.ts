import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';

export class UnlessLocalService {}

@Directive({
  selector: '[appUnless]',
  providers: [UnlessLocalService],
})
export class Unless {
  readonly unless = input(false, { alias: 'appUnless' });

  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      this.viewContainerRef.clear();
      if (!this.unless()) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      }
    });
  }
}
