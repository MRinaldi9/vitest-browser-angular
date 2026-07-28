import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-http-demo',
  template: `
    <div>
      <h1 data-testid="title">{{ data()?.title ?? '' }}</h1>
      <button data-testid="fetch" (click)="load()">Fetch</button>
    </div>
  `,
})
export class HttpDemoComponent {
  private http = inject(HttpClient);
  data = signal<{ title: string } | null>(null);

  load() {
    this.http.get<{ title: string }>('/api/data').subscribe(res => this.data.set(res));
  }
}
