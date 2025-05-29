import { Player, Direction, AIVision } from './types';

// Check if player is within AI's vision cone
export const checkAiVision = (
  aiPlayer: Player,
  player: Player,
  aiVision: AIVision
): AIVision => {
  // Calculate vector from AI to player
  const dx = player.x - aiPlayer.x;
  const dy = player.y - aiPlayer.y;
  
  // Calculate distance between AI and player
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If player is too far, AI can't see it
  if (distance > aiVision.visionDistance) {
    return { ...aiVision, canSeePlayer: false };
  }
  
  // Calculate the angle between AI's direction and the player
  let directionAngle: number;
  switch (aiPlayer.direction) {
    case 'up':
      directionAngle = -90; // -90 degrees (up is negative y)
      break;
    case 'down':
      directionAngle = 90; // 90 degrees (down is positive y)
      break;
    case 'left':
      directionAngle = 180; // 180 degrees (left is negative x)
      break;
    case 'right':
      directionAngle = 0; // 0 degrees (right is positive x)
      break;
    default:
      return { ...aiVision, canSeePlayer: false };
  }
  
  // Calculate the angle to the player in degrees
  const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Calculate the difference between the two angles
  let angleDiff = Math.abs(angleToPlayer - directionAngle);
  // Ensure the angle difference is between 0 and 180 degrees
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }
  
  // Check if player is within the vision cone
  const isInCone = angleDiff <= aiVision.visionConeAngle / 2;
  
  // Update the AI vision state
  return { ...aiVision, canSeePlayer: isInCone };
};

// Update AI player position based on its current direction and vision
export const updateAiPlayer = (
  aiPlayer: Player,
  player: Player,
  aiVision: AIVision,
  canvas: HTMLCanvasElement | null
): { updatedAiPlayer: Player, updatedAiVision: AIVision } => {
  // First, check if AI can see the player
  const updatedAiVision = checkAiVision(aiPlayer, player, aiVision);
  
  let newX = aiPlayer.x;
  let newY = aiPlayer.y;
  let newDirection = aiPlayer.direction;
  
  if (updatedAiVision.canSeePlayer) {
    // If AI can see player, calculate the distance to the player
    const dx = player.x - aiPlayer.x;
    const dy = player.y - aiPlayer.y;
    
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    // If AI is close enough to the player, stop moving
    if (distanceToPlayer < aiPlayer.size + player.size) {
      // Stop moving but keep tracking the player
      let trackingDirection: Direction = aiPlayer.direction;
      
      // Update direction to face the player even when standing still
      if (Math.abs(dx) > Math.abs(dy)) {
        trackingDirection = dx > 0 ? 'right' : 'left';
      } else {
        trackingDirection = dy > 0 ? 'down' : 'up';
      }
      
      // Update direction but don't move
      newDirection = trackingDirection;
      
      // Return early with updated direction but same position
      return {
        updatedAiPlayer: {
          ...aiPlayer,
          direction: newDirection,
          pulse: (aiPlayer.pulse + 0.08) % (Math.PI * 2) // Slightly different pulse speed
        },
        updatedAiVision
      };
    }
    
    // Determine which direction to move based on player position
    if (Math.abs(dx) > Math.abs(dy)) {
      // Move horizontally
      newDirection = dx > 0 ? 'right' : 'left';
    } else {
      // Move vertically
      newDirection = dy > 0 ? 'down' : 'up';
    }
    
    // Move towards player
    switch (newDirection) {
      case 'up':
        newY -= aiPlayer.speed;
        break;
      case 'down':
        newY += aiPlayer.speed;
        break;
      case 'left':
        newX -= aiPlayer.speed;
        break;
      case 'right':
        newX += aiPlayer.speed;
        break;
    }
  } else {
    // If AI can't see player, move based on current direction
    switch (aiPlayer.direction) {
      case 'up':
        newY -= aiPlayer.speed;
        break;
      case 'down':
        newY += aiPlayer.speed;
        break;
      case 'left':
        newX -= aiPlayer.speed;
        break;
      case 'right':
        newX += aiPlayer.speed;
        break;
    }
  }
  
  // Keep AI player within canvas bounds and change direction if hitting a wall
  if (canvas) {
    // Check if AI player would go out of bounds
    const wouldHitWall = 
      newX < aiPlayer.size || 
      newX > canvas.width - aiPlayer.size ||
      newY < aiPlayer.size || 
      newY > canvas.height - aiPlayer.size;
    
    // Change direction if hitting a wall
    if (wouldHitWall) {
      // Choose a direction that would move away from the wall
      const availableDirections: Direction[] = [];
      
      if (aiPlayer.x > aiPlayer.size + 50) availableDirections.push('left');
      if (aiPlayer.x < canvas.width - aiPlayer.size - 50) availableDirections.push('right');
      if (aiPlayer.y > aiPlayer.size + 50) availableDirections.push('up');
      if (aiPlayer.y < canvas.height - aiPlayer.size - 50) availableDirections.push('down');
      
      // Choose a random available direction
      if (availableDirections.length > 0) {
        newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
      }
    }
    
    // Ensure the AI stays within bounds regardless
    newX = Math.max(aiPlayer.size, Math.min(canvas.width - aiPlayer.size, newX));
    newY = Math.max(aiPlayer.size, Math.min(canvas.height - aiPlayer.size, newY));
  }
  
  return {
    updatedAiPlayer: {
      ...aiPlayer,
      x: newX,
      y: newY,
      direction: newDirection,
      pulse: (aiPlayer.pulse + 0.08) % (Math.PI * 2) // Slightly different pulse speed
    },
    updatedAiVision
  };
};
