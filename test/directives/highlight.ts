import { Directive, input } from '@angular/core';

/** Element-selector directive: the tag name can be inferred from the selector. */
@Directive({
  selector: 'app-highlight',
  host: { '[style.color]': 'color()' },
})
export class Highlight {
  color = input('black');
}
