import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

import { doc, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';

interface Artwork {
  name: string;
  title: string;
  location: string;
  description: string;
  ticketAvailable: boolean;
  imageUrl: string
}

@Component({
  selector: 'app-artist-search',
  templateUrl: './artist-search.component.html',
  styleUrls: ['./artist-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ArtistSearchComponent {
  query: string = '';
  results: Artwork[] = [];
  selectedArtwork: Artwork | null = null;
  ticketPurchased: boolean = false;

  constructor(private firestore: Firestore) {}

  async search() {
    console.log('Pretražujem za:', this.query);
    const collectionRef = collection(this.firestore, 'artworks');
    const snapshot = await getDocs(collectionRef);
    const allDocs = snapshot.docs.map(doc => doc.data() as Artwork);

    this.results = allDocs.filter(item =>
      item.name.toLowerCase().includes(this.query.toLowerCase())
    );

    // reset ako nova pretraga
    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }
 



  selectArtwork(artwork: Artwork) {
    this.selectedArtwork = artwork;
    this.ticketPurchased = false;
  }

  /*buyTicket() {
    this.ticketPurchased = true;
  }*/
 auth = inject(Auth);
  async buyTicket() {
    const user = this.auth.currentUser;
    if (!user || !this.selectedArtwork) return;

    const ticketData = {
      title: this.selectedArtwork.title,
      artist: this.selectedArtwork.name,
      location: this.selectedArtwork.location,
      imageUrl: this.selectedArtwork.imageUrl,
      date: new Date().toISOString(),           // mozes ovdje kasnije dodati pravu datum izložbe
      purchasedAt: new Date().toISOString()
    };

    const userTicketsRef = collection(this.firestore, `users/${user.uid}/tickets`);
    await addDoc(userTicketsRef, ticketData);

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
