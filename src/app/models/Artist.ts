import { Artwork } from "./Artwork";

export interface Artist {
    id: string;
    fullName: string;
    artwork: Artwork[];
}