export type Axis = 'x' | 'z';

export interface BoxState {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

export interface DebrisState extends BoxState {
  id: string;
  velocity: [number, number, number];
  rotationSpeed: [number, number, number];
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}
