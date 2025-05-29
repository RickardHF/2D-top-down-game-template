import { useEffect, useRef, useState } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface Player {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  size: number;
  pulse: number;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);  const [player, setPlayer] = useState<Player>({
    x: 400,
    y: 300,
    direction: 'none',
    speed: 5,
    size: 20,
    pulse: 0
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

  // Game loop
  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      updatePlayer();
      renderGame();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [keysPressed, player]);

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
      newX = Math.max(20, Math.min(canvas.width - 20, newX));
      newY = Math.max(20, Math.min(canvas.height - 20, newY));
    }    setPlayer({
      x: newX,
      y: newY,
      direction: newDirection === 'none' ? player.direction : newDirection,
      speed: player.speed,
      size: player.size,
      pulse: (player.pulse + 0.1) % (Math.PI * 2), // Increment pulse for animation
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
    }    // Calculate pulsing size effect
    const pulseSize = player.size + Math.sin(player.pulse) * 2;
    
    // Draw the player (ball)
    ctx.beginPath();
    ctx.arc(player.x, player.y, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = directionColors[player.direction];
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw direction indicator
    if (player.direction !== 'none') {
      ctx.beginPath();
      
      // Starting point is the center of the player
      const indicatorLength = player.size + 10;
      
      switch (player.direction) {
        case 'up':
          ctx.moveTo(player.x, player.y);
          ctx.lineTo(player.x, player.y - indicatorLength);
          break;
        case 'down':
          ctx.moveTo(player.x, player.y);
          ctx.lineTo(player.x, player.y + indicatorLength);
          break;
        case 'left':
          ctx.moveTo(player.x, player.y);
          ctx.lineTo(player.x - indicatorLength, player.y);
          break;
        case 'right':
          ctx.moveTo(player.x, player.y);
          ctx.lineTo(player.x + indicatorLength, player.y);
          break;
      }
      
      ctx.strokeStyle = '#000000';
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
          <p>Current direction: <span className="font-bold uppercase">{player.direction}</span></p>
          <div className="mt-2">
            <p className="text-xs mb-1">Direction colors:</p>
            <div className="flex gap-2">
              {Object.entries(directionColors).map(([dir, color]) => (
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
