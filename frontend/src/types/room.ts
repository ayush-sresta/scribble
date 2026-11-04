export interface Participant {
  playerId: string;
  username: string;
  role: "host" | "player";
}

export interface Room {
  code: string;
  status: "waiting" | "playing" | "completed";
  participants: Participant[];
  settings: {
    maxPlayers: number;
  };
}
