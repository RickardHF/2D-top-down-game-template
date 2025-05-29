// filepath: c:\repos\simple-ai-game\src\components\Game.tsx
import { useEffect, useRef, useState } from 'react';

// Game types
type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

// Base interface for all game entities
interface GameObject {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  size: number;
  pulse: number;
}

// Player interface - now with cleaner structure
interface Player extends GameObject {
  isAI?: boolean;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Human-controlled player
  const [player, setPlayer] = useState<Player>({
    id: 'player1',
    x: 400,
    y: 300,
    direction: 'none',
    speed: 5,
    size: 20,
    pulse: 0
  });
  
  // AI-controlled player
  const [aiPlayer, setAiPlayer] = useState<Player>({
    id: 'ai1',
    x: 200,
    y: 200,
    direction: 'none',
    speed: 3, // Slightly slower than human player
    size: 20,
    pulse: Math.PI, // Start at different phase for visual distinction
    isAI: true
  });
  
  // AI vision state
  const [aiVision, setAiVision] = useState({
    canSeePlayer: false,
    visionConeAngle: 220, // 220 degrees vision cone
    visionDistance: 40 * 4 // 4x the body size (40 is body diameter)
  });
  
  // Track pressed keys
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
  
  // Colors for different directions
  const directionColors = {
    up: '#FF6B6B',    // Red
    down: '#4ECDC4',  // Teal
    left: '#FFD166',  // Yellow
    right: '#6A0572', // Purple
    none: '#FFFFFF',  // White
  };
  
  // AI player colors (with different hues)
  const aiDirectionColors = {
    up: '#9D50BB',    // Purple
    down: '#00B4DB',  // Blue
    left: '#F2994A',  // Orange
    right: '#4CAF50', // Green
    none: '#AAAAAA',  // Gray
  };

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // AI movement logic
  useEffect(() => {
    const aiMovementInterval = setInterval(() => {
      // Only change direction randomly if AI can't see the player
      if (!aiVision.canSeePlayer && Math.random() < 0.1) { // 10% chance on each interval to change direction
        const directions: Direction[] = ['up', 'down', 'left', 'right'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        setAiPlayer(prev => ({ ...prev, direction: randomDirection }));
      }
    }, 200); // Check for direction change every 200ms
    
    return () => clearInterval(aiMovementInterval);
  }, [aiVision.canSeePlayer]);
  
  // Game loop
  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      updatePlayer();
      updateAiPlayer();
      renderGame();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [keysPressed, player, aiPlayer, aiVision]);
  
  // Check if player is within AI's vision cone
  const checkAiVision = () => {
    // Calculate vector from AI to player
    const dx = player.x - aiPlayer.x;
    const dy = player.y - aiPlayer.y;
    
    // Calculate distance between AI and player
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If player is too far, AI can't see it
    if (distance > aiVision.visionDistance) {
      setAiVision(prev => ({ ...prev, canSeePlayer: false }));
      return;
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
        setAiVision(prev => ({ ...prev, canSeePlayer: false }));
        return; // If AI has no direction, it can't see
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
    setAiVision(prev => ({ ...prev, canSeePlayer: isInCone }));
  };
  
  // Update AI player position based on its current direction
  const updateAiPlayer = () => {
    // First, check if AI can see the player
    checkAiVision();
    
    let newX = aiPlayer.x;
    let newY = aiPlayer.y;
    
    if (aiVision.canSeePlayer) {
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
        if (trackingDirection !== aiPlayer.direction) {
          setAiPlayer(prev => ({ ...prev, direction: trackingDirection }));
        }
        
        // Return early to prevent movement
        return;
      }
      
      // Determine which direction to move based on player position
      let newDirection: Direction = aiPlayer.direction;
      
      // Decide whether to move horizontally or vertically based on the larger distance
      if (Math.abs(dx) > Math.abs(dy)) {
        // Move horizontally
        newDirection = dx > 0 ? 'right' : 'left';
      } else {
        // Move vertically
        newDirection = dy > 0 ? 'down' : 'up';
      }
      
      // Update AI direction
      if (newDirection !== aiPlayer.direction) {
        setAiPlayer(prev => ({ ...prev, direction: newDirection }));
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
    const canvas = canvasRef.current;
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
          const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
          setAiPlayer(prev => ({ ...prev, direction: newDirection }));
        }
      }
      
      // Ensure the AI stays within bounds regardless
      newX = Math.max(aiPlayer.size, Math.min(canvas.width - aiPlayer.size, newX));
      newY = Math.max(aiPlayer.size, Math.min(canvas.height - aiPlayer.size, newY));
    }
    
    setAiPlayer(prev => ({
      ...prev,
      x: newX,
      y: newY,
      pulse: (prev.pulse + 0.08) % (Math.PI * 2) // Slightly different pulse speed
    }));
  };

  // Update player position based on key presses
  const updatePlayer = () => {
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
    const canvas = canvasRef.current;
    if (canvas) {
      newX = Math.max(player.size, Math.min(canvas.width - player.size, newX));
      newY = Math.max(player.size, Math.min(canvas.height - player.size, newY));
    }
    
    setPlayer({
      ...player,
      x: newX,
      y: newY,
      direction: newDirection === 'none' ? player.direction : newDirection,
      pulse: (player.pulse + 0.1) % (Math.PI * 2) // Increment pulse for animation
    });
  };

  // Render the game
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a grid for the top-down view
    drawGrid(ctx, canvas);
    
    // Draw the AI vision cone first so it appears behind the players
    drawAiVisionCone(ctx);
      
    // Then draw AI player
    drawPlayer(ctx, aiPlayer);
      
    // Finally draw human player (so it appears on top if they overlap)
    drawPlayer(ctx, player);
  };
  
  // Helper function to draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
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
  const drawAiVisionCone = (ctx: CanvasRenderingContext2D) => {
    if (aiPlayer.direction === 'none') return;
    
    // Calculate the cone angle in radians
    const coneAngleRad = (aiVision.visionConeAngle * Math.PI) / 180;
    
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
      aiVision.visionDistance,
      startAngle,
      endAngle
    );
    ctx.closePath();
    
    // Fill the cone with a semi-transparent color
    const fillColor = aiVision.canSeePlayer ? 'rgba(255, 100, 100, 0.2)' : 'rgba(100, 150, 255, 0.2)';
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw the cone border
    ctx.strokeStyle = aiVision.canSeePlayer ? 'rgba(255, 50, 50, 0.5)' : 'rgba(50, 100, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // Helper function to draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
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

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Simple 2D Game</h1>
      <div className="relative border-2 border-gray-300 rounded-md overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          className="bg-gray-100"
        ></canvas>
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded">
          <p>Use <span className="font-bold">WASD</span> keys to move</p>
          <p>Player direction: <span className="font-bold uppercase">{player.direction}</span></p>
          <p>AI direction: <span className="font-bold uppercase">{aiPlayer.direction}</span></p>
          <p>AI vision: 
            <span className={`font-bold ml-1 ${aiVision.canSeePlayer ? 'text-red-400' : ''}`}>
              {aiVision.canSeePlayer ? 'PLAYER DETECTED!' : 'Scanning...'}
            </span>
          </p>
          
          <div className="mt-2">
            <p className="text-xs mb-1">Player colors:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(directionColors).map(([dir, color]) => (
                dir !== 'none' && (
                  <div key={dir} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: color }}></div>
                    <span className="text-xs uppercase">{dir}</span>
                  </div>
                )
              ))}
            </div>
            
            <p className="text-xs mb-1 mt-2">AI colors:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(aiDirectionColors).map(([dir, color]) => (
                dir !== 'none' && (
                  <div key={dir} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: color }}></div>
                    <span className="text-xs uppercase">{dir}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded-md max-w-2xl">
        <h2 className="font-bold mb-2">Game Controls:</h2>
        <ul className="list-disc pl-5">
          <li><span className="font-mono bg-gray-200 px-2 py-0.5 rounded">W</span> - Move Up</li>
          <li><span className="font-mono bg-gray-200 px-2 py-0.5 rounded">A</span> - Move Left</li>
          <li><span className="font-mono bg-gray-200 px-2 py-0.5 rounded">S</span> - Move Down</li>
          <li><span className="font-mono bg-gray-200 px-2 py-0.5 rounded">D</span> - Move Right</li>
        </ul>
      </div>
    </div>
  );
};

export default Game;
