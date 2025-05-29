import { Player, Direction } from './types';
import { directionColors, aiDirectionColors } from './constants';

// Helper function to draw grid
export const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.strokeStyle = '#EEEEEE';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
};

// Helper function to draw AI vision cone
export const drawAiVisionCone = (
  ctx: CanvasRenderingContext2D, 
  aiPlayer: Player, 
  canSeePlayer: boolean, 
  visionConeAngle: number, 
  visionDistance: number
) => {
  if (aiPlayer.direction === 'none') return;
  
  // Calculate the cone angle in radians
  const coneAngleRad = (visionConeAngle * Math.PI) / 180;
  
  // Get the base angle based on AI direction
  let baseAngle: number;
  switch (aiPlayer.direction) {
    case 'up':
      baseAngle = -Math.PI / 2; // -90 degrees
      break;
    case 'down':
      baseAngle = Math.PI / 2; // 90 degrees
      break;
    case 'left':
      baseAngle = Math.PI; // 180 degrees
      break;
    case 'right':
      baseAngle = 0; // 0 degrees
      break;
    default:
      return;
  }
  
  // Calculate the start and end angles for the cone
  const startAngle = baseAngle - coneAngleRad / 2;
  const endAngle = baseAngle + coneAngleRad / 2;
  
  // Draw the vision cone
  ctx.beginPath();
  ctx.moveTo(aiPlayer.x, aiPlayer.y);
  ctx.arc(
    aiPlayer.x,
    aiPlayer.y,
    visionDistance,
    startAngle,
    endAngle
  );
  ctx.closePath();
  
  // Fill the cone with a semi-transparent color
  const fillColor = canSeePlayer ? 'rgba(255, 100, 100, 0.2)' : 'rgba(100, 150, 255, 0.2)';
  ctx.fillStyle = fillColor;
  ctx.fill();
  
  // Draw the cone border
  ctx.strokeStyle = canSeePlayer ? 'rgba(255, 50, 50, 0.5)' : 'rgba(50, 100, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
};

// Helper function to draw player
export const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
  const colors = p.isAI ? aiDirectionColors : directionColors;
  const pulseSize = p.size + Math.sin(p.pulse) * 2;
  
  // Draw the player (ball)
  ctx.beginPath();
  ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = colors[p.direction];
  ctx.fill();
  ctx.strokeStyle = p.isAI ? '#333333' : '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add label to distinguish between players
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(p.isAI ? 'AI' : 'P1', p.x, p.y + 4);
  
  // Draw direction indicator
  if (p.direction !== 'none') {
    ctx.beginPath();
    
    // Starting point is the center of the player
    const indicatorLength = p.size + 10;
    
    switch (p.direction) {
      case 'up':
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - indicatorLength);
        break;
      case 'down':
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + indicatorLength);
        break;
      case 'left':
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - indicatorLength, p.y);
        break;
      case 'right':
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + indicatorLength, p.y);
        break;
    }
    
    ctx.strokeStyle = p.isAI ? '#333333' : '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
};
