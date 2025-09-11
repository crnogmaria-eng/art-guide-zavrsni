import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-manage-users',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section style="padding:20px">
      <h2>Manage Users</h2>
      <p>Placeholder page for managing users (admin only).</p>
    </section>
  `
})
export class ManageUsersComponent { }
