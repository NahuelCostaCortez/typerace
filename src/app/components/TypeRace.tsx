'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Player {
  id: string;
  position: number;
  color: string;
  name: string;
  finished: boolean;
}

interface UserScore {
  username: string;
  wpm: number;
  date: string;
  won: boolean;
}

// Difficulty levels for AI (hidden from user)
type Difficulty = 'easy' | 'medium' | 'hard';

interface AiSpeed {
  minSpeed: number;
  maxSpeed: number;
}

const AI_SPEEDS: Record<Difficulty, Record<string, AiSpeed>> = {
  easy: {
    ai1: { minSpeed: 0.3, maxSpeed: 0.6 },
    ai2: { minSpeed: 0.2, maxSpeed: 0.5 },
  },
  medium: {
    ai1: { minSpeed: 0.5, maxSpeed: 0.8 },
    ai2: { minSpeed: 0.4, maxSpeed: 0.7 },
  },
  hard: {
    ai1: { minSpeed: 0.7, maxSpeed: 1.1 },
    ai2: { minSpeed: 0.6, maxSpeed: 1.0 },
  },
};

// sentences array
const SPANISH_SENTENCES = [
  "La inteligencia artificial no es un sustituto de la inteligencia humana, sino una extensión de ella.",
];

// API endpoint to save leaderboard
const saveLeaderboard = async (leaderboard: UserScore[]) => {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leaderboard),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    return false;
  }
};

// API endpoint to load leaderboard
const loadLeaderboard = async (): Promise<UserScore[]> => {
  try {
    const response = await fetch('/api/leaderboard');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
};

export default function TypeRace() {
  const [gameStarted, setGameStarted] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentSentence, setCurrentSentence] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: 'player', position: 0, color: 'bg-teal-400', name: 'You', finished: false },
    { id: 'ai1', position: 0, color: 'bg-red-500', name: 'AI 1', finished: false },
    { id: 'ai2', position: 0, color: 'bg-blue-500', name: 'AI 2', finished: false }
  ]);
  const [gameFinished, setGameFinished] = useState(false);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [difficulty] = useState<Difficulty>('easy'); // Fixed to easy, hidden from user
  
  // New state variables for user management and leaderboard
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [bestScore, setBestScore] = useState<number>(0);
  const [userBestScore, setUserBestScore] = useState<UserScore | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Load leaderboard on initial mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const savedLeaderboard = await loadLeaderboard();
      if (savedLeaderboard.length > 0) {
        setLeaderboard(savedLeaderboard);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // Helper function to update a player's position
  const updatePlayerPosition = useCallback((playerId: string, newPosition: number) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId
        ? { 
            ...player, 
            position: Math.min(newPosition, 100),
            finished: newPosition >= 100 
          }
        : player
    ));
  }, []);

  // Handle typing input
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const typed = e.target.value;
    setInputText(typed);
    
    // Start the race on first keystroke if not already started
    if (!gameStarted && readyToStart) {
      setGameStarted(true);
      setStartTime(Date.now());
    }
    
    // Only process input if game is started and not finished
    if (!gameStarted || gameFinished) return;
    
    // Calculate progress based on correctly typed characters
    let correctChars = 0;
    for (let i = 0; i < typed.length; i++) {
      if (i < currentSentence.length && typed[i] === currentSentence[i]) {
        correctChars++;
      }
    }
    
    const progress = (correctChars / currentSentence.length) * 100;
    updatePlayerPosition('player', progress);
    
    // Check if player has finished the complete text
    if (typed === currentSentence) {
      updatePlayerPosition('player', 100);
      // Calculate WPM
      if (startTime) {
        const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
        const words = currentSentence.split(' ').length;
        setWordsPerMinute(Math.round(words / timeElapsed));
      }
    }
  };

  // AI movement
  useEffect(() => {
    if (!gameStarted || gameFinished) return;
    
    // AI 1 movement
    const ai1Interval = setInterval(() => {
      setPlayers(prev => {
        const ai1 = prev.find(p => p.id === 'ai1');
        if (!ai1 || ai1.finished) return prev;
        
        const { minSpeed, maxSpeed } = AI_SPEEDS[difficulty].ai1;
        const speedIncrement = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        const newPosition = Math.min(ai1.position + speedIncrement, 100);
        const finished = newPosition >= 100;
        
        return prev.map(player => 
          player.id === 'ai1' 
            ? { ...player, position: newPosition, finished } 
            : player
        );
      });
    }, 100);
    
    // AI 2 movement
    const ai2Interval = setInterval(() => {
      setPlayers(prev => {
        const ai2 = prev.find(p => p.id === 'ai2');
        if (!ai2 || ai2.finished) return prev;
        
        const { minSpeed, maxSpeed } = AI_SPEEDS[difficulty].ai2;
        const speedIncrement = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        const newPosition = Math.min(ai2.position + speedIncrement, 100);
        const finished = newPosition >= 100;
        
        return prev.map(player => 
          player.id === 'ai2' 
            ? { ...player, position: newPosition, finished } 
            : player
        );
      });
    }, 100);

    return () => {
      clearInterval(ai1Interval);
      clearInterval(ai2Interval);
    };
  }, [gameStarted, gameFinished, difficulty]);

  // Check for game end
  useEffect(() => {
    if (gameFinished) return;
    
    const finishedPlayer = players.find(player => player.finished);
    if (finishedPlayer) {
      // Delay game end slightly to let animations complete
      setTimeout(() => {
        setGameFinished(true);
        
        // Determine if player won
        const playerFinished = players.find(p => p.id === 'player')?.finished || false;
        const ai1Finished = players.find(p => p.id === 'ai1')?.finished || false;
        const ai2Finished = players.find(p => p.id === 'ai2')?.finished || false;
        
        const playerWon = playerFinished && 
          ((!ai1Finished && !ai2Finished) || 
           (finishedPlayer.id === 'player'));
           
        setGameResult(playerWon ? 'win' : 'lose');
        
        // Add to leaderboard and update best score (but don't update attempts here)
        if (wordsPerMinute > 0) {
          // Update best score
          if (wordsPerMinute > bestScore) {
            setBestScore(wordsPerMinute);
            
            // Create user score object
            const newScore: UserScore = {
              username,
              wpm: wordsPerMinute,
              date: new Date().toLocaleDateString(),
              won: playerWon
            };
            
            // Update user's best score
            setUserBestScore(newScore);
          }
        }
      }, 1000);
    }
  }, [players, gameFinished, username, wordsPerMinute, bestScore]);

  // Function to finalize user's turn and update leaderboard with best score
  const finalizeUserTurn = useCallback(() => {
    // Only add user's best score to leaderboard
    if (userBestScore) {
      setLeaderboard(prev => {
        // Remove any previous scores from this user
        const filteredLeaderboard = prev.filter(score => score.username !== username);
        
        // Add the user's best score and sort
        const newLeaderboard = [...filteredLeaderboard, userBestScore].sort((a, b) => b.wpm - a.wpm);
        
        // Save to server
        saveLeaderboard(newLeaderboard);
        
        return newLeaderboard;
      });
    }
    
    // Show leaderboard
    setShowLeaderboard(true);
  }, [userBestScore, username]);

  // Save leaderboard when user is done with all attempts
  useEffect(() => {
    if (attemptsCount > 3) {
      finalizeUserTurn();
    }
  }, [attemptsCount, finalizeUserTurn]);

  // Reset game to the ready state
  const prepareGame = () => {
    // If this is a replay, increment the attempts counter only here
    if (gameFinished) {
      setAttemptsCount(prev => {
        const newCount = prev + 1;
        // If this will be the 4th attempt, go to leaderboard instead
        if (newCount >= 4) {
          setTimeout(() => finalizeUserTurn(), 0);
          return 3; // Keep at 3 max
        }
        return newCount;
      });
    }
    
    // Select a random sentence
    const randomIndex = Math.floor(Math.random() * SPANISH_SENTENCES.length);
    setCurrentSentence(SPANISH_SENTENCES[randomIndex]);
    
    setGameStarted(false);
    setGameFinished(false);
    setInputText('');
    setReadyToStart(true);
    setWordsPerMinute(0);
    setStartTime(null);
    setGameResult(null);
    setShowLeaderboard(false);
    
    // Reset all players to exactly position 0
    setPlayers([
      { id: 'player', position: 0, color: 'bg-teal-400', name: username, finished: false },
      { id: 'ai1', position: 0, color: 'bg-red-500', name: 'AI 1', finished: false },
      { id: 'ai2', position: 0, color: 'bg-blue-500', name: 'AI 2', finished: false }
    ]);
  };
  
  // Handle username submission
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setUsernameError("Por favor, ingrese un nombre de usuario");
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      // Check if username already exists in leaderboard using the API
      const response = await fetch(`/api/leaderboard?checkUsername=${encodeURIComponent(trimmedUsername)}`);
      const data = await response.json();
      
      if (data.exists) {
        setUsernameError("Este nombre ya existe. Por favor, elija otro nombre.");
        setIsCheckingUsername(false);
        return;
      }
      
      // Username is valid
      setUsernameError(null);
      setIsUsernameSet(true);
      setAttemptsCount(1);
      setBestScore(0);
      setUserBestScore(null);
    } catch (error) {
      console.error("Error checking username:", error);
      // Allow the user to proceed anyway if the API check fails
      setUsernameError(null);
      setIsUsernameSet(true);
      setAttemptsCount(1);
      setBestScore(0);
      setUserBestScore(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // Start a new user session
  const handleNewUser = () => {
    // Only finalize if we have a best score and we haven't shown the leaderboard yet
    if (userBestScore && !showLeaderboard) {
      finalizeUserTurn();
    } else {
      // Otherwise just reset everything
      setUsername('');
      setIsUsernameSet(false);
      setAttemptsCount(1);
      setBestScore(0);
      setUserBestScore(null);
      setReadyToStart(false);
      setGameFinished(false);
      setShowLeaderboard(false);
    }
  };
  
  // Finish early without using all attempts
  const handleFinishEarly = () => {
    finalizeUserTurn();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {!isUsernameSet ? (
          // Username input screen
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto mt-16 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">Registra tu nombre</h2>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block mb-2 text-gray-300">Nombre de usuario</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(null); // Clear error when typing
                  }}
                  className={`w-full p-3 bg-gray-700 border ${usernameError ? 'border-red-500' : 'border-gray-600'} rounded focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Ingresa tu nombre"
                  required
                />
                {usernameError && (
                  <p className="mt-2 text-sm text-red-400">{usernameError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isCheckingUsername}
                className={`w-full ${isCheckingUsername ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-700'} text-white font-bold py-3 px-6 rounded transition`}
              >
                {isCheckingUsername ? 'Verificando...' : 'Comenzar'}
              </button>
            </form>
          </div>
        ) : showLeaderboard ? (
          // Leaderboard screen
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold mb-1 text-teal-400">Tabla de Clasificación</h2>
              <p className="text-gray-400">Los jugadores más rápidos</p>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-4 text-left text-gray-400">Posición</th>
                    <th className="py-2 px-4 text-left text-gray-400">Nombre</th>
                    <th className="py-2 px-4 text-left text-gray-400">PPM</th>
                    <th className="py-2 px-4 text-left text-gray-400">Fecha</th>
                    <th className="py-2 px-4 text-left text-gray-400">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((score, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{score.username}</td>
                      <td className="py-3 px-4 text-teal-400 font-bold">{score.wpm}</td>
                      <td className="py-3 px-4 text-gray-400">{score.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${score.won ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {score.won ? 'Victoria' : 'Derrota'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No hay puntuaciones todavía. ¡Sé el primero en jugar!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded"
              >
                Volver
              </button>
              <button
                onClick={handleNewUser}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded"
              >
                Nuevo Usuario
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Race track */}
            <div className="mb-8 bg-gray-800 rounded-lg relative overflow-hidden border border-gray-700">
              <div className="absolute top-2 left-4 text-gray-300 flex space-x-6 items-center">
                <div>
                  <span className="mr-2">Usuario:</span>
                  <span className="text-teal-400 font-bold">{username}</span>
                </div>
                <div>
                  <span className="mr-2">Intentos:</span>
                  <span className={`font-bold ${attemptsCount < 3 ? 'text-teal-400' : 'text-red-400'}`}>{attemptsCount}/3</span>
                </div>
                {bestScore > 0 && (
                  <div>
                    <span className="mr-2">Mejor PPM:</span>
                    <span className="text-yellow-400 font-bold">{bestScore}</span>
                  </div>
                )}
              </div>
              
              {players.map((player, index) => (
                <div key={player.id} className="relative h-16 mb-4 first:mt-4 mt-8">
                  {/* Track */}
                  <div className="absolute left-0 top-0 w-full h-full bg-gray-800/80">
                    {/* Track markings */}
                    <div className="absolute inset-0 flex items-center">
                      {[...Array(30)].map((_, i) => (
                        <div key={i} className="flex-1 h-0.5 bg-white/20 mx-1" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Car */}
                  <div 
                    className={`absolute top-1 h-14 w-14 ${player.color} transition-all duration-300 flex items-center justify-center rounded-md`}
                    style={{
                      left: `calc((100% - 56px) * ${player.position / 100})`
                    }}
                  >
                    {/* Simple car icon */}
                    <div className="w-10 h-6 bg-white/20 rounded-md"></div>
                  </div>
                  
                  {/* Player name label on the right */}
                  <div className="absolute right-2 top-6 text-sm font-medium">
                    <span className={`inline-block w-5 h-5 mr-1 ${player.color} rounded-sm`}></span>
                    {player.id === 'player' ? username : player.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Text input area */}
            <div className="text-center space-y-4">
              {!readyToStart ? (
                <>
                  <p className="text-lg mb-4">
                    ¡Compite contra coches de IA! Escribe el texto lo más rápido que puedas para mover tu coche.
                    ¡El primero en terminar gana!
                  </p>
                  
                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      onClick={prepareGame}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded"
                    >
                      Listo para Competir
                    </button>
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded"
                    >
                      Ver Clasificación
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Typing area with dark navy background */}
                  <div className="relative border border-teal-800 rounded-lg bg-gray-800/70 overflow-hidden">
                    <div className="p-6 text-lg min-h-[120px] tracking-wide leading-relaxed">
                      {currentSentence.split('').map((char, index) => {
                        let className = "text-gray-500"; // Default untyped
                        
                        if (index < inputText.length) {
                          className = inputText[index] === char 
                            ? "text-teal-400" // Correct
                            : "text-red-400";  // Incorrect
                        }
                        
                        // Add cursor after the last typed character
                        return (
                          <span key={index} className={className}>
                            {char}
                            {index === inputText.length - 1 && (
                              <span className="animate-pulse text-white ml-[-4px] inline-block">|</span>
                            )}
                          </span>
                        );
                      })}
                      {/* Show cursor at the beginning if no text typed yet */}
                      {inputText.length === 0 && (
                        <span className="animate-pulse text-white inline-block">|</span>
                      )}
                    </div>
                    <textarea
                      value={inputText}
                      onChange={handleTyping}
                      disabled={gameFinished}
                      className="absolute inset-0 p-6 opacity-0 text-lg resize-none"
                      autoFocus
                    />
                  </div>
                  
                  {/* Game status and WPM display */}
                  <div className="flex justify-between items-center">
                    <div className="text-gray-300">
                      {!gameStarted ? "¡Empieza a escribir para comenzar la carrera!" : 
                        gameFinished ? (
                          gameResult === 'win' ? 
                            "¡Has ganado la carrera! ¡Felicidades!" : 
                            "Has perdido la carrera. ¡Inténtalo de nuevo!"
                        ) : 
                        "¡Adelante! ¡Adelante! ¡Adelante!"
                      }
                    </div>
                    
                    {gameFinished && wordsPerMinute > 0 && (
                      <div className="bg-gray-800 px-4 py-2 rounded-md border border-gray-700">
                        <div className="text-gray-400 text-sm">PPM</div>
                        <div className="text-teal-400 text-2xl font-bold">{wordsPerMinute}</div>
                      </div>
                    )}
                  </div>
                  
                  {gameFinished && (
                    <div className="mt-4 flex justify-center gap-3">
                      {attemptsCount < 3 ? (
                        <div className="flex gap-3">
                          <button
                            onClick={prepareGame}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded"
                          >
                            Competir de Nuevo ({3 - attemptsCount} {3 - attemptsCount === 1 ? 'intento' : 'intentos'} restantes)
                          </button>
                          <button
                            onClick={handleFinishEarly}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded"
                          >
                            Finalizar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowLeaderboard(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded"
                          >
                            Ver Clasificación
                          </button>
                          <button
                            onClick={handleNewUser}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded"
                          >
                            Nuevo Usuario
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2022 TypeRace. All rights reserved.</p>
      </footer>
    </div>
  );
} 