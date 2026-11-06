export const CLIENT_EVENTS = {
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
} as const;

export const SERVER_EVENTS = {
  ROOM_JOINED: "room:joined",
  ROOM_UPDATED: "room:updated",
  ROOM_ERROR: "room:error",
  ROOM_LEFT: "room:left",
} as const;

export interface JoinRoomPayload {
  code: string;
  playerId: string;
}

export interface LeaveRoomPayload {
  code: string;
  playerId: string;
}
