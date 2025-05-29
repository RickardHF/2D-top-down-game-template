import { Player, Direction } from './types';

// Update player position based on key presses
export const updatePlayer = (
  player: Player,
  keysPressed: { [key: string]: boolean },
  canvas: HTMLCanvasElement | null
): Player => {
  let newX = player.x;
  let newY = player.y;
  let newDirection: Direction = 'none';

  if (keysPressed['w']) {
    newY -= player.speed;
    newDirection = 'up';
  } else if (keysPressed['s']) {
    newY += player.speed;
    newDirection = 'down';
  }

  if (keysPressed['a']) {
    newX -= player.speed;
    newDirection = 'left';
  } else if (keysPressed['d']) {
    newX += player.speed;
    newDirection = 'right';
  }

  // Keep player within canvas bounds
  if (canvas) {
    newX = Math.max(player.size, Math.min(canvas.width - player.size, newX));
    newY = Math.max(player.size, Math.min(canvas.height - player.size, newY));
  }
  
  return {
    ...player,
    x: newX,
    y: newY,
    direction: newDirection === 'none' ? player.direction : newDirection,
    pulse: (player.pulse + 0.1) % (Math.PI * 2) // Increment pulse for animation
  };
};
