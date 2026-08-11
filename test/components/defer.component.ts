import { Component } from '@angular/core';

@Component({
  selector: 'app-defer',
  template: `
    <div>
      @defer {
        <p data-testid="deferred-a">Deferred content A</p>
      } @placeholder {
        <p data-testid="placeholder-a">Placeholder A</p>
      } @loading {
        <p data-testid="loading-a">Loading A...</p>
      }

      @defer {
        <p data-testid="deferred-b">Deferred content B</p>
      } @placeholder {
        <p data-testid="placeholder-b">Placeholder B</p>
      } @loading {
        <p data-testid="loading-b">Loading B...</p>
      }
    </div>
  `,
})
export class DeferComponent {}

@Component({
  selector: 'app-defer-interaction',
  template: `
    <div>
      @defer (on interaction) {
        <p data-testid="deferred-interaction">Interaction content</p>
      } @placeholder {
        <button data-testid="show">Show</button>
      }
    </div>
  `,
})
export class DeferInteractionComponent {}
