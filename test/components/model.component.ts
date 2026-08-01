import { Component, model } from '@angular/core';

@Component({
  selector: 'app-model',
  standalone: true,
  template: `
    <p data-testid="model-value">Count: {{ count() }}</p>
    <button (click)="count.update(v => v + 1)">Increment</button>
  `,
})
export class ModelComponent {
  count = model(0);
}
