import { Component, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { ArtLocation } from '../../models/ArtLocation';

type LocationModel = ArtLocation & { stylesString?: string };

@Component({
    selector: 'app-manage-locations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './manage-locations.component.html',
    styleUrls: ['./manage-locations.component.css']
})
export class ManageLocationsComponent implements OnInit {
    locations: LocationModel[] = [];
    editingLocation: Partial<LocationModel> | null = null;

    newLocation: Partial<LocationModel> = { name: '', address: '', styles: [], stylesString: '' };
    // temporary string fields for easier editing in template
    // we won't persist these to Firestore directly

    constructor(private firestore: Firestore, private injector: Injector) { }

    async ngOnInit() {
        await runInInjectionContext(this.injector, async () => {
            try {
                const col = collection(this.firestore, 'locations');
                const snap = await getDocs(col);
                this.locations = snap.docs.map(d => {
                    const data = d.data() as ArtLocation;
                    const entry: LocationModel = { ...data, stylesString: (data.styles || []).join(', ') } as LocationModel;
                    entry.id = d.id;
                    return entry;
                });
            } catch (err) {
                console.error('Failed to load locations', err);
            }
        });
    }

    editLocation(loc: ArtLocation) {
        this.editingLocation = { ...loc, stylesString: (loc.styles || []).join(', ') } as Partial<LocationModel>;
    }

    cancelEdit() {
        this.editingLocation = null;
    }

    async saveEdit() {
        if (!this.editingLocation?.id) return;
        try {
            await runInInjectionContext(this.injector, async () => {
                const ref = doc(this.firestore, `locations/${this.editingLocation?.id}`);
                const styles = ((this.editingLocation as any).stylesString || '')
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== '');

                const payload: Partial<ArtLocation> = {
                    name: this.editingLocation?.name || '',
                    address: this.editingLocation?.address || '',
                    styles: styles
                };
                await updateDoc(ref, payload as any);

                const idx = this.locations.findIndex(l => l.id === this.editingLocation!.id);
                if (idx >= 0) this.locations[idx] = { id: this.editingLocation?.id, ...(payload as any), stylesString: (payload.styles || []).join(', ') } as LocationModel;
                this.editingLocation = null;

            });

        } catch (err) {
            console.error('Failed to save location', err);
        }
    }

    async deleteLocation(locationId: string) {
        try {
            await runInInjectionContext(this.injector, async () => {
                const ref = doc(this.firestore, `locations/${locationId}`);
                await deleteDoc(ref);
                this.locations = this.locations.filter(l => l.id !== locationId);

            });

        } catch (err) {
            console.error('Failed to delete location', err);
        }
    }

    async createLocation() {
        try {
            await runInInjectionContext(this.injector, async () => {
                const col = collection(this.firestore, 'locations');
                const styles = ((this.newLocation as any).stylesString || '');
                const stylesArr = (styles || '')
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== '');

                const payload: Partial<ArtLocation> = {
                    name: this.newLocation.name || '',
                    address: this.newLocation.address || '',
                    styles: stylesArr
                };
                const createdRef = await addDoc(col, payload as any);
                this.locations.unshift({ id: createdRef.id, ...(payload as any), stylesString: (payload.styles || []).join(', ') } as LocationModel);
                this.newLocation = { name: '', address: '', styles: [], stylesString: '' };

            });

        } catch (err) {
            console.error('Failed to create location', err);
        }
    }

}
