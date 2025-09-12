import { AppUser } from "./AppUser";

export interface EditAppUser extends AppUser {
    preferencesString: string;
    ticketsString: string;
}