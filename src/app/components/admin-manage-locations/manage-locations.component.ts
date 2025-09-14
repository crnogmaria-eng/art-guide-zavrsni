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

    // include a dateString for UI editing in format 'dd.mm.yyyy'
    newLocation: Partial<LocationModel> = { name: '', address: '', styles: [], stylesString: '', date: undefined };
    // temporary string fields for easier editing in template
    // we won't persist these to Firestore directly

    constructor(private firestore: Firestore, private injector: Injector) { }

    async ngOnInit() {
        await runInInjectionContext(this.injector, async () => {
            try {
                const col = collection(this.firestore, 'locations');
                const snap = await getDocs(col);
                this.locations = snap.docs.map(d => {
                    const data = d.data() as any as ArtLocation;
                    // normalize date: Firestore might return a Date, string (ISO) or timestamp-like object
                    let dateVal: string | Date | undefined = undefined;
                    if (data?.date instanceof Date) dateVal = data.date;
                    else if (typeof data?.date === 'string') dateVal = data.date;
                    else if (data?.date && typeof (data.date as any).toDate === 'function') {
                        // Firestore Timestamp-like object
                        try { dateVal = (data.date as any).toDate(); } catch { dateVal = undefined; }
                    }

                    const entry: LocationModel = { ...data, stylesString: (data.styles || []).join(', '), date: dateVal } as LocationModel;
                    entry.id = d.id;
                    return entry;
                });
            } catch (err) {
                console.error('Failed to load locations', err);
            }
        });
    }

    editLocation(loc: ArtLocation) {
        // copy date into editingLocation as date string if present
        const raw = (loc as any).date;
        let dateStr: string | undefined;
        if (!raw) dateStr = undefined;
        else if (raw instanceof Date) dateStr = this.formatDate(raw);
        else if (typeof raw === 'string') {
            // assume ISO string -> try to parse
            const parsed = new Date(raw);
            if (!isNaN(parsed.getTime())) dateStr = this.formatDate(parsed);
            else dateStr = raw; // keep as-is
        } else if (raw && raw.toDate instanceof Function) {
            try { dateStr = this.formatDate(raw.toDate()); } catch { dateStr = undefined; }
        } else dateStr = undefined;

        this.editingLocation = { ...loc, stylesString: (loc.styles || []).join(', '), date: dateStr } as Partial<LocationModel>;
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

                const payload: any = {
                    name: this.editingLocation?.name || '',
                    address: this.editingLocation?.address || '',
                    styles: styles
                };

                // if a date string exists in dd.mm.yyyy format, parse to Date and set
                const dateStr = (this.editingLocation as any).date as string | undefined;
                if (dateStr && typeof dateStr === 'string') {
                    const parsed = this.parseDateString(dateStr);
                    if (parsed) payload.date = parsed; // store as JS Date (Firestore will accept)
                }

                await updateDoc(ref, payload as any);

                const idx = this.locations.findIndex(l => l.id === this.editingLocation!.id);
                if (idx >= 0) this.locations[idx] = { id: this.editingLocation?.id, ...(payload as any), stylesString: (payload.styles || []).join(', '), date: (this.editingLocation as any).date } as LocationModel;
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
                const payload: any = {
                    name: this.newLocation.name || '',
                    address: this.newLocation.address || '',
                    styles: stylesArr
                };

                const dateStr = (this.newLocation as any).date as string | undefined;
                if (dateStr && typeof dateStr === 'string') {
                    const parsed = this.parseDateString(dateStr);
                    if (parsed) payload.date = parsed;
                }
                const createdRef = await addDoc(col, payload as any);
                this.locations.unshift({ id: createdRef.id, ...(payload as any), stylesString: (payload.styles || []).join(', '), date: (this.newLocation as any).date } as LocationModel);
                this.newLocation = { name: '', address: '', styles: [], stylesString: '', date: undefined };

            });

        } catch (err) {
            console.error('Failed to create location', err);
        }
    }

    // parse 'dd.mm.yyyy' into a JS Date (local time). Returns Date or undefined if invalid.
    parseDateString(dateStr: string): Date | undefined {
        if (!dateStr) return undefined;
        const parts = dateStr.split('.').map(p => p.trim());
        if (parts.length !== 3) return undefined;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
        // basic validation
        if (year < 1000 || year > 9999) return undefined;
        if (month < 1 || month > 12) return undefined;
        if (day < 1 || day > 31) return undefined;
        // create Date (months are 0-based)
        const d = new Date(year, month - 1, day);
        // check that date components match (guard against overflow, e.g., 31 Feb)
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return undefined;
        return d;
    }

    // format Date or ISO/string to 'dd.mm.yyyy' for display
    formatDate(value: string | Date | undefined): string | undefined {
        if (value === undefined || value === null) return undefined;
        let d: Date | null = null;
        if (value instanceof Date) d = value;
        else if (typeof value === 'string') {
            // try ISO parse
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) d = parsed;
            else return value; // unknown string format, return as-is
        } else if ((value as any)?.toDate instanceof Function) {
            try { d = (value as any).toDate(); } catch { d = null; }
        }
        if (!d) return undefined;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear());
        return `${day}.${month}.${year}`;
    }

}
