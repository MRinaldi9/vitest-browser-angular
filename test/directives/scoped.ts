import { Directive, input, model } from '@angular/core';

export class ScopedService {
  readonly marker = 'real';
}

/** Attribute directive declaring its own provider, without requiring a template. */
@Directive({
  selector: '[appScoped]',
  providers: [ScopedService],
  host: { '[attr.data-scoped]': 'value()' },
})
export class ScopedDirective {
  value = input('scoped');
}

/** Directive exposing a model input, to check the write-back to the source signal. */
@Directive({ selector: '[appTwoWay]' })
export class TwoWayDirective {
  value = model('a');
}
