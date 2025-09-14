import { Artwork } from "./Artwork";

export interface ShowArtwork extends Artwork {
    artistName: string;
    imagePath: string;
}