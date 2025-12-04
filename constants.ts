
export const BLOCK_HEIGHT = 1;
export const INITIAL_SIZE = 3.5;
export const MOVE_SPEED_BASE = 0.6;
export const MOVE_SPEED_INCREMENT = 0.01;
export const MOVE_RANGE = 5; // How far the block travels

// Camera Configuration
// [10, 10, 10] gives a symmetric "corner" view (45 degrees), classic for Stack.
// The Y value ensures we look down at a pleasant angle.
export const CAMERA_START_POS = [10, 10, 10] as const; 
export const CAMERA_FOV = 35; // Narrower FOV makes the tower feel closer and more "isometric"

// Visuals
export const DEBRIS_LIFETIME_MS = 2000;
export const BASE_HUE = 200; // Starting color hue (Blue/Cyan)
export const HUE_STEP = 6; // How much hue shifts per block
