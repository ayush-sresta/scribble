export interface GameState {
  currentRound: number;
  currentTurn: number;
  currentArtist: string | null;
  currentWord: string | null;
  roundEndsAt: Date | null;
  scores: Map<string, number>;
}
