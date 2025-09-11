import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-manage-artist',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section style="padding:20px">
      <h2>Manage Artists</h2>
      <p>Placeholder page for managing artists (admin only).</p>
    </section>
  `
})
export class ManageArtistComponent { }
