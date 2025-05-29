// Game types and interfaces
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

// Base interface for all game entities
export interface GameObject {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  size: number;
  pulse: number;
}

// Player interface
export interface Player extends GameObject {
  isAI?: boolean;
}

// AI vision state interface
export interface AIVision {
  canSeePlayer: boolean;
  visionConeAngle: number;
  visionDistance: number;
}
