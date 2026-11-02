export interface Participant {
    playerId: string;
    username: string;
    role: "host" | "player";
}