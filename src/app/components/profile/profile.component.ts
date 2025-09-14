import { Component, inject, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of, Subscription } from 'rxjs';
import { AppUser } from '../../models/AppUser';
import { AuthService } from '../../services/auth.service';
import { getDocs } from 'firebase/firestore';
import { ShowTicket } from '../../models/ShowTicket';
import { ArtLocation } from '../../models/ArtLocation';
import { tick } from '@angular/core/testing';
import { Ticket } from '../../models/Ticket';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  firestore = inject(Firestore);
  preferences: string[] = [];
  userSubscription: Subscription | null = null;
  public user: AppUser | null = null;
  public showTickets: ShowTicket[] = [];
  public locations: ArtLocation[] = [];

  constructor(private injector: Injector, private authService: AuthService) {
  }

  ngOnInit() {
    this.userSubscription = this.authService.currentUser.subscribe(async (user) => {
      this.user = user;
      this.preferences = user?.preferences || [];

      await runInInjectionContext(this.injector, async () => {
        /// fetch locations for tickets

        const locationsCol = collection(this.firestore, 'locations');
        await getDocs(locationsCol).then(snap => {
          this.locations = snap.docs.map(d => {
            const location = d.data() as ArtLocation;
            location.id = d.id;
            return location;
          });
        });

        const tickets: ShowTicket[] = [];
        this.user?.tickets?.forEach(t => {
          const location = this.locations.find(x => x.id === t.locationId);

          // normalize location.date (could be Firestore Timestamp) to dd.mm.yyyy string for ShowTicket.date
          let dateObj: Date = new Date();
          const locDate: any = location?.date;
          if (locDate) {
            // Firestore Timestamp has toDate() method
            if (typeof locDate.toDate === 'function') {
              dateObj = locDate.toDate();
            } else if (locDate.seconds !== undefined) {
              // raw object with seconds/nanoseconds
              dateObj = new Date((locDate.seconds || 0) * 1000 + (locDate.nanoseconds || 0) / 1e6);
            } else {
              // fallback: try to construct Date from value
              dateObj = new Date(locDate);
            }
            if (isNaN(dateObj.getTime())) {
              dateObj = new Date();
            }
          }

          const dd = String(dateObj.getDate()).padStart(2, '0');
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const yyyy = String(dateObj.getFullYear());
          const dateStr = `${dd}.${mm}.${yyyy}`;

          tickets.push({ ...t, locationName: location?.name || '', date: dateStr } as ShowTicket);
        });

        this.showTickets = tickets;

        console.table(this.locations);

      });

    });

  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
}
