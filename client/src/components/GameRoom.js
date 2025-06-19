import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const GameRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isImposter, setIsImposter] = useState(false);
  const [word, setWord] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [imposterInfo, setImposterInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!connected || !socket) {
      navigate('/');
      return;
    }

    // Listen for game updates
    socket.on('playersUpdate', ({ players, gameStarted }) => {
      setPlayers(players);
      setGameStarted(gameStarted);
      const currentPlayer = players.find(p => p.id === socket.id);
      if (currentPlayer) {
        setIsHost(currentPlayer.isHost);
      }
    });

    socket.on('gameStarted', ({ isImposter, word, players }) => {
      setGameStarted(true);
      setIsImposter(isImposter);
      setWord(word);
      setPlayers(players);
      setGameEnded(false);
      setImposterInfo(null);
    });

    socket.on('gameEnded', ({ imposterId, imposterName, word, reason }) => {
      setGameEnded(true);
      setImposterInfo({ id: imposterId, name: imposterName, word });
      setGameStarted(false);
      if (reason) {
        setError(reason);
      }
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('playersUpdate');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('error');
    };
  }, [socket, connected, navigate]);

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('startGame', { roomCode });
  };

  const handleEndGame = () => {
    if (!socket) return;
    socket.emit('endGame', { roomCode });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  };

  return (
    <div className="container game-room">
      <div className="room-header">
        <div className="room-code">
          <h2>Room Code:</h2>
          <span className="code">{roomCode}</span>
          <button 
            className="btn btn-secondary" 
            onClick={copyRoomCode}
            style={{ width: 'auto', marginLeft: '10px' }}
          >
            Copy Link
          </button>
        </div>
        <button className="btn btn-danger" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {gameEnded && imposterInfo && (
        <div className="game-ended">
          <h3>Game Over!</h3>
          <p className="reveal">
            The imposter was: <span className="imposter-name">{imposterInfo.name}</span>
          </p>
          <p className="reveal">
            The word was: <span className="word-reveal">{imposterInfo.word}</span>
          </p>
        </div>
      )}

      {gameStarted && !gameEnded && (
        <div className={`game-status ${isImposter ? 'imposter' : ''}`}>
          <h3>
            {isImposter ? "You are the IMPOSTER!" : "You are a REGULAR player"}
          </h3>
          {isImposter ? (
            <p>Try to blend in without knowing the word!</p>
          ) : (
            <>
              <p>The word is:</p>
              <div className="word">{word}</div>
            </>
          )}
        </div>
      )}

      <div className="players-section">
        <h3>Players ({players.length})</h3>
        <div className="players-grid">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`player-card ${player.isHost ? 'host' : ''}`}
            >
              <div className="player-name">{player.name}</div>
              <div className="player-role">
                {player.isHost ? 'Host' : 'Player'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!gameStarted && (
        <>
          {players.length < 3 && (
            <p className="waiting-message">
              Waiting for more players... (Need at least 3 players to start)
            </p>
          )}
          {isHost && players.length >= 3 && (
            <div className="game-controls">
              <button className="btn" onClick={handleStartGame}>
                Start Game
              </button>
            </div>
          )}
          {!isHost && players.length >= 3 && (
            <p className="waiting-message">
              Waiting for the host to start the game...
            </p>
          )}
        </>
      )}

      {gameStarted && !gameEnded && isHost && (
        <div className="game-controls">
          <button className="btn btn-danger" onClick={handleEndGame}>
            End Game & Reveal Imposter
          </button>
        </div>
      )}
    </div>
  );
};

export default GameRoom; 