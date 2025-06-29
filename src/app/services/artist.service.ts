import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  constructor(private firestore: Firestore) {}

  searchArtist(queryText: string): Observable<any[]> {
    const artistsRef = collection(this.firestore, 'artists');
    const q = query(artistsRef, where('name', '>=', queryText), where('name', '<=', queryText + '\uf8ff'));

    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }
}
