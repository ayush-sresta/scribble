export const CLIENT_EVENTS = {
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  START_GAME: "game:start",
  DRAWING_START: "drawing:start",
  DRAWING_MOVE: "drawing:move",
  DRAWING_END: "drawing:end",
  CLEAR_CANVAS: "drawing:clear",
  GAME_SYNC: "game:sync",
} as const;

export const SERVER_EVENTS = {
  ROOM_JOINED: "room:joined",
  ROOM_UPDATED: "room:updated",
  ROOM_ERROR: "room:error",
  ROOM_LEFT: "room:left",
  GAME_STARTED: "game:started",
  GAME_ERROR: "game:error",
  DRAWING_START: "drawing:start",
  DRAWING_MOVE: "drawing:move",
  DRAWING_END: "drawing:end",
  CLEAR_CANVAS: "drawing:clear",
  WORD_SELECTED: "game:word-selected",
} as const;

export interface JoinRoomPayload {
  code: string;
  playerId: string;
}

export interface LeaveRoomPayload {
  code: string;
  playerId: string;
}

export interface StartGamePayload {
  code: string;
  playerId: string;
}

export interface DrawingPointPayload {
  code: string;
  x: number;
  y: number;
  color: string;
  brushSize: number;
}

export interface DrawingEndPayload {
  code: string;
}

export interface GameSyncPayload {
  code: string;
  playerId: string;
}
