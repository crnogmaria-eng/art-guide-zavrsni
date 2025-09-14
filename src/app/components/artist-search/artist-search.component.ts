import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, setDoc, arrayUnion, getDoc, collectionGroup } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

import { doc } from '@angular/fire/firestore';

import { Artwork } from '../../models/Artwork';
import { Ticket } from '../../models/Ticket';
import { AuthService } from '../../services/auth.service';
import { Artist } from '../../models/Artist';
import { ShowArtwork } from '../../models/ShowArtwork';

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
  selectedArtwork: ShowArtwork | null = null;
  ticketPurchased: boolean = false;
  private artists: Artist[] = [];
  private firestore: Firestore = inject(Firestore);

  constructor(private authService: AuthService) { }

  async search() {
    console.log('Pretražujem za:', this.query);

    const q = (this.query || '').toString().trim().toLowerCase();

    const artistsRef = collection(this.firestore, 'artist');
    const artistsSnap = await getDocs(artistsRef);

    this.artists = artistsSnap.docs.map(d => {
      const a = d.data() as Artist;
      a.id = d.id;
      return a;
    });

    const matchingArtists = this.artists.filter(a => a.fullName.toLowerCase().includes(q));

    this.results = matchingArtists.map(a => a.artwork.map(artwork => {
      const showArtwork: ShowArtwork =
      {
        ...artwork,
        artistName: a.fullName,
        imagePath: `/assets/artworks/${artwork.fileName}`
      };
      return showArtwork;
    })).flat();
    console.log(this.results)

    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

  selectArtwork(artwork: ShowArtwork) {
    this.selectedArtwork = artwork;
    this.ticketPurchased = this.authService.user?.tickets?.some(t => t.artworkId === artwork.id) || false;
  }

  async buyTicket() {
    const user = this.authService.user;
    if (!user || !this.selectedArtwork) return;

    const ticketData: Ticket = {
      artworkId: this.selectedArtwork.id,
      date: new Date().toISOString(),
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
