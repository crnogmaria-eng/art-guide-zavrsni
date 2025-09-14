import { Ticket } from "./Ticket";

export interface ShowTicket extends Ticket {
    locationName: string;
    date: string;
}