import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']  
})
export class ProfileComponent implements OnInit {
  firestore = inject(Firestore);
  auth = inject(Auth);
  tickets$: Observable<any[]> = of([]);
  preferences: string[] = [];

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const ticketsRef = collection(this.firestore, `users/${user.uid}/tickets`);
    this.tickets$ = collectionData(ticketsRef, { idField: 'id' });

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);
    const userData: any = snapshot.data();
    this.preferences = userData?.preferences || [];
  }
}
