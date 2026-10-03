import { Directive } from '@angular/core';

/** Directive declaring more than one tag name in its selector. */
@Directive({ selector: 'app-first, app-second' })
export class MultiTagDirective {}
