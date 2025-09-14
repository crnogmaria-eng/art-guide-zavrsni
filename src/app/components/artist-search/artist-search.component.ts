import { Component, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, setDoc, arrayUnion, getDoc, collectionGroup } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

import { doc } from '@angular/fire/firestore';

import { Artwork } from '../../models/Artwork';
import { Ticket } from '../../models/Ticket';
import { AuthService } from '../../services/auth.service';
import { Artist } from '../../models/Artist';
import { ShowArtwork } from '../../models/ShowArtwork';
import { ArtLocation } from '../../models/ArtLocation';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-artist-search',
  templateUrl: './artist-search.component.html',
  styleUrls: ['./artist-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ArtistSearchComponent {
  query: string = '';
  results: ShowArtwork[] = [];
  locations: ArtLocation[] = [];
  selectedArtwork: ShowArtwork | null = null;
  ticketPurchased: boolean = false;
  private artists: Artist[] = [];
  private firestore: Firestore = inject(Firestore);
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService, private injector: Injector) { }

  async ngOnInit() {
    await runInInjectionContext(this.injector, async () => {
      const artistsRef = collection(this.firestore, 'artist');
      const locationsRef = collection(this.firestore, 'locations');

      forkJoin([getDocs(artistsRef), getDocs(locationsRef)]).subscribe(([artistsSnap, locationsSnap]) => {
        this.locations = locationsSnap.docs.map(d => {
          const loc = d.data() as ArtLocation;
          loc.id = d.id;
          return loc;
        });

        this.artists = artistsSnap.docs.map(d => {
          const a = d.data() as Artist;
          a.id = d.id;
          return a;
        });
      });
    });

    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user && this.selectedArtwork) {
        this.ticketPurchased = user.tickets?.some(t => t.locationId === this.selectedArtwork?.locationId) || false;
      } else {
        this.ticketPurchased = false;
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  async search() {
    console.log('Pretražujem za:', this.query);

    const q = (this.query || '').toString().trim().toLowerCase();

    const matchingArtists = this.artists.filter(a => a.fullName.toLowerCase().includes(q));

    this.results = matchingArtists.map(a => a.artwork.map(artwork => {
      const normalized = {
        ...artwork,
        // support legacy 'location' property
        locationId: artwork.locationId
      } as Artwork;

      const showArtwork: ShowArtwork =
      {
        ...normalized,
        artistName: a.fullName,
        imagePath: `/assets/artworks/${normalized.fileName}`,
        locationName: this.locations.find(l => l.id === normalized.locationId)?.name || 'Nepoznato'
      };
      return showArtwork;
    })).flat();
    console.log(this.results)

    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

  selectArtwork(artwork: ShowArtwork) {
    this.selectedArtwork = artwork;
    this.ticketPurchased = this.authService.user?.tickets?.some(t => t.locationId === artwork.locationId) || false;
  }

  async buyTicket() {
    const user = this.authService.user;
    if (!user || !this.selectedArtwork) return;

    const location = this.locations.find(l => l.id === this.selectedArtwork?.locationId);

    // use selected artwork's locationId directly (locations may not be loaded)
    const ticketData: Ticket = {
      locationId: location?.id || this.selectedArtwork.locationId,
      purchasedAt: new Date().toISOString()
    };

    console.log('Kupujem kartu za:', user.id);
    const userRef = doc(this.firestore, `users/${user.id}`);
    await setDoc(userRef, { tickets: arrayUnion(ticketData) }, { merge: true });
    await this.authService.updateUserRef();

    this.ticketPurchased = true;
  }

  closeDetails() {
    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

  closeDetailsByOverlay(event: MouseEvent) {
    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

}
