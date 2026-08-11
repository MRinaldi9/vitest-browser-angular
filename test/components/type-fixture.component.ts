import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-type-fixture',
  template: '',
})
export class TypeFixtureComponent {
  name = input('default');
  age = input(0);
  tags = input<string[]>([]);
  onSave = output<string>();
  onDelete = output<number>();
  count = model(0);
}
