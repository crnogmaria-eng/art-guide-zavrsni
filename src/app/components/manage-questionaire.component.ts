import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-manage-questionaire',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section style="padding:20px">
      <h2>Manage Questionaire</h2>
      <p>Placeholder page for managing questionnaires (admin only).</p>
    </section>
  `
})
export class ManageQuestionaireComponents { }
