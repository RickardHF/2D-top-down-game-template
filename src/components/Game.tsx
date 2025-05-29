import { useEffect, useRef, useState } from 'react';
import { Player, AIVision, Direction } from './game/types';
import { directionColors, aiDirectionColors } from './game/constants';
import { drawGrid, drawAiVisionCone, drawPlayer } from './game/rendering';
import { updatePlayer } from './game/HumanPlayer';
import { updateAiPlayer } from './game/AIPlayer';

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
  const [aiVision, setAiVision] = useState<AIVision>({
    canSeePlayer: false,
    visionConeAngle: 220, // 220 degrees vision cone
    visionDistance: 40 * 4 // 4x the body size (40 is body diameter)
  });
  
  // Track pressed keys
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

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
      // Update player position
      setPlayer(prevPlayer => 
        updatePlayer(prevPlayer, keysPressed, canvasRef.current)
      );
      
      // Update AI player position and vision
      const { updatedAiPlayer, updatedAiVision } = updateAiPlayer(
        aiPlayer,
        player,
        aiVision,
        canvasRef.current
      );
      
      setAiPlayer(updatedAiPlayer);
      setAiVision(updatedAiVision);
      
      // Render game
      renderGame();
      
      // Continue the game loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [keysPressed, player, aiPlayer, aiVision]);
  
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
    drawAiVisionCone(ctx, aiPlayer, aiVision.canSeePlayer, aiVision.visionConeAngle, aiVision.visionDistance);
      
    // Then draw AI player
    drawPlayer(ctx, aiPlayer);
      
    // Finally draw human player (so it appears on top if they overlap)
    drawPlayer(ctx, player);
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