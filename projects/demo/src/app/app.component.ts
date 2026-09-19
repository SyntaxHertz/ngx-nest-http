import { Component, inject, signal } from '@angular/core';

import { UsersApi } from './users-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly usersApi = inject(UsersApi);

  readonly users = signal<{ id: number; name: string }[]>([]);
  readonly error = signal<string | null>(null);
  name = 'Alan Turing';

  constructor() {
    this.reload();
  }

  reload(): void {
    this.usersApi.list().subscribe({
      next: users => {
        this.users.set(users);
        this.error.set(null);
      },
      error: () => this.error.set('Could not load users.'),
    });
  }

  create(): void {
    this.usersApi.create({ name: this.name }).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Create failed. Check the DTO and console.'),
    });
  }
}
