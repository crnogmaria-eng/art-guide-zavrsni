import { Ticket } from "./Ticket";

export interface AppUser {
    id: string;
    email: string;
    role: string;
    tickets?: Ticket[];
    preferences?: string[];
}