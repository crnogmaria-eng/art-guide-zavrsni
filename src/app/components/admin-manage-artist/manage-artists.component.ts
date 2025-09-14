import { Component, inject, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Artwork } from '../../models/Artwork';
import { Artist } from '../../models/Artist';

@Component({
  selector: 'app-manage-artists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-artists.component.html',
  styleUrls: ['./manage-artists.component.css']
})
export class ManageArtistComponent implements OnInit {
  artists: Artist[] = [];
  private firestore: Firestore = inject(Firestore);

  // editingArtist holds a mutable representation including comma-separated artwork ids
  editingArtist: (Partial<Artist>) | null = null;

  // model for creating a new artist
  newArtist: { fullName: string; } = { fullName: '', };

  // track artwork edits per artist
  artworkEditingMap: { [artistId: string]: { editingArtwork: Artwork | null; newArtwork: Partial<Artwork> | null } } = {};

  constructor(private injector: Injector) { }

  async ngOnInit() {
    await runInInjectionContext(this.injector, async () => {
      const artistsCol = collection(this.firestore, 'artist');

      try {
        const artistsSnap = await getDocs(artistsCol);

        this.artists = artistsSnap.docs.map(d => {
          const a = d.data() as Artist;
          return { id: d.id, fullName: a.fullName, artwork: (a.artwork || []) } as Artist;
        });
      } catch (err) {
        console.error('Failed to load artists or artworks', err);
      }
    });
  }

  // Start editing an artist
  editArtist(artist: Artist) {
    // create a shallow copy so edits don't immediately mutate the list
    this.editingArtist = { ...artist, artworkString: (artist.artwork || []).map(a => a.id).join(', ') } as any;
  }

  // Save edits back to Firestore
  async saveEdit() {
    if (!this.editingArtist?.id) return;
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistRef = doc(this.firestore, `artist/${this.editingArtist?.id}`);

        const artworkObjs = [] as Artwork[];
        // artworkIds.map(id => this.artworks.find(a => a.id === id)).filter(Boolean) as Artwork[];

        const updated: Artist = {
          id: this.editingArtist?.id || '',
          fullName: this.editingArtist?.fullName || '',
          artwork: artworkObjs
        };

        await updateDoc(artistRef, { fullName: updated.fullName, artwork: updated.artwork });

        // reflect changes locally
        const idx = this.artists.findIndex(a => a.id === updated.id);
        if (idx >= 0) this.artists[idx] = updated;

        this.editingArtist = null;

      });

    } catch (err) {
      console.error('Failed to save artist edits', err);
    }
  }

  cancelEdit() {
    this.editingArtist = null;
  }

  // Update a single field on the artist document
  async updateField(artistId: string, field: string, value: any) {
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistRef = doc(this.firestore, `artist/${artistId}`);
        await updateDoc(artistRef, { [field]: value });

      });

    } catch (err) {
      console.error('Failed to update artist field', err);
    }
  }

  // Delete artist
  async deleteArtist(artistId: string) {
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistRef = doc(this.firestore, `artist/${artistId}`);
        await deleteDoc(artistRef);
        this.artists = this.artists.filter(a => a.id !== artistId);
      });
    } catch (err) {
      console.error('Failed to delete artist', err);
    }
  }

  // Create a new artist document
  async createArtist() {
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistsCol = collection(this.firestore, 'artists');

        const artworkObjs = [] as Artwork[];
        // artworkIds.map(id => this.artworks.find(a => a.id === id)).filter(Boolean) as Artwork[];

        const payload: Partial<Artist> = {
          fullName: this.newArtist.fullName || '',
          artwork: artworkObjs
        };

        const createdRef = await addDoc(artistsCol, payload as any);

        // reflect locally
        const createdArtist: Artist = { id: createdRef.id, fullName: payload.fullName || '', artwork: payload.artwork || [] } as Artist;
        this.artists.unshift(createdArtist);

        // reset form
        this.newArtist = { fullName: '' };
      });
    } catch (err) {
      console.error('Failed to create artist', err);
    }
  }

  // Create a new artwork for a specific artist (push into artist.artwork and persist)
  async createArtwork(artistId: string) {
    const entry = this.artworkEditingMap[artistId];
    if (!entry || !entry.newArtwork) return;

    try {
      await runInInjectionContext(this.injector, async () => {
        const newId = doc(collection(this.firestore, 'artist', artistId, 'artwork')).id;
        const artwork: Artwork = {
          id: newId,
          name: entry.newArtwork?.name || '',
          location: entry.newArtwork?.location || '',
          fileName: entry.newArtwork?.fileName || '',
          description: entry.newArtwork?.description || ''
        } as Artwork;

        const artistIdx = this.artists.findIndex(a => a.id === artistId);
        if (artistIdx === -1) return;

        const artistRef = doc(this.firestore, `artist/${artistId}`);
        const updatedArtworks = [...(this.artists[artistIdx].artwork || []), artwork];

        await updateDoc(artistRef, { artwork: updatedArtworks });

        // update local state
        this.artists[artistIdx].artwork = updatedArtworks;
        this.artworkEditingMap[artistId].newArtwork = null;

      });
    } catch (err) {
      console.error('Failed to create artwork', err);
    }
  }

  // Begin editing existing artwork for artist
  editArtwork(artistId: string, artwork: Artwork) {
    this.artworkEditingMap[artistId] = this.artworkEditingMap[artistId] || { editingArtwork: null, newArtwork: null };
    // clone the artwork for editing
    this.artworkEditingMap[artistId].editingArtwork = { ...artwork } as Artwork;
  }

  // Save edited artwork back into artist document
  async saveArtwork(artistId: string) {
    const entry = this.artworkEditingMap[artistId];
    if (!entry || !entry.editingArtwork) return;
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistIdx = this.artists.findIndex(a => a.id === artistId);
        if (artistIdx === -1) return;

        const updatedArtworks = (this.artists[artistIdx].artwork || []).map(a => a.id === entry.editingArtwork!.id ? entry.editingArtwork! : a);

        const artistRef = doc(this.firestore, `artist/${artistId}`);
        await updateDoc(artistRef, { artwork: updatedArtworks });

        this.artists[artistIdx].artwork = updatedArtworks;
        this.artworkEditingMap[artistId].editingArtwork = null;
      });
    } catch (err) {
      console.error('Failed to save artwork', err);
    }
  }

  cancelArtworkEdit(artistId: string) {
    if (this.artworkEditingMap[artistId]) this.artworkEditingMap[artistId].editingArtwork = null;
  }

  createEmptyArtwork(artist: Artist) {
    if (!this.artworkEditingMap[artist.id]) {
      this.artworkEditingMap[artist.id] = { editingArtwork: null, newArtwork: null };
    };
    this.artworkEditingMap[artist.id].newArtwork = { name: '', location: '', fileName: '' };
  }

  // Cancel showing the new artwork form for an artist
  cancelNewArtwork(artistId: string) {
    if (this.artworkEditingMap[artistId]) this.artworkEditingMap[artistId].newArtwork = null;
  }

  // Helper for template: return editing artwork id or empty string
  editingArtworkId(artistId: string): string {
    const entry = this.artworkEditingMap[artistId];
    if (!entry || !entry.editingArtwork) return '';
    return entry.editingArtwork.id;
  }

  // Delete an artwork from an artist
  async deleteArtwork(artistId: string, artworkId: string) {
    try {
      await runInInjectionContext(this.injector, async () => {
        const artistIdx = this.artists.findIndex(a => a.id === artistId);
        if (artistIdx === -1) return;

        const updatedArtworks = (this.artists[artistIdx].artwork || []).filter(a => a.id !== artworkId);
        const artistRef = doc(this.firestore, `artist/${artistId}`);
        await updateDoc(artistRef, { artwork: updatedArtworks });

        this.artists[artistIdx].artwork = updatedArtworks;

      });
    } catch (err) {
      console.error('Failed to delete artwork', err);
    }
  }
}
