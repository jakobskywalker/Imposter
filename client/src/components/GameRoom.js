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

    // Request current room state when joining
    socket.emit('getRoomState', { roomCode });

    // Listen for game updates
    socket.on('playersUpdate', ({ players, gameStarted }) => {
      console.log('Players update received:', players); // Debug log
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
  }, [socket, connected, navigate, roomCode]);

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
    alert('Raumlink in Zwischenablage kopiert!');
  };

  return (
    <div className="container game-room">
      <div className="room-header">
        <div className="room-code">
          <h2>Raumcode:</h2>
          <span className="code">{roomCode}</span>
          <button 
            className="btn btn-secondary" 
            onClick={copyRoomCode}
            style={{ width: 'auto', marginLeft: '10px' }}
          >
            Link kopieren
          </button>
        </div>
        <button className="btn btn-danger" onClick={handleLeaveRoom}>
          Raum verlassen
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {gameEnded && imposterInfo && (
        <div className="game-ended">
          <h3>Spiel beendet!</h3>
          <p className="reveal">
            Der Betrüger war: <span className="imposter-name">{imposterInfo.name}</span>
          </p>
          <p className="reveal">
            Das Wort war: <span className="word-reveal">{imposterInfo.word}</span>
          </p>
        </div>
      )}

      {gameStarted && !gameEnded && (
        <div className={`game-status ${isImposter ? 'imposter' : ''}`}>
          <h3>
            {isImposter ? "Du bist der BETRÜGER!" : "Du bist ein NORMALER Spieler"}
          </h3>
          {isImposter ? (
            <p>Versuche dich einzufügen, ohne das Wort zu kennen!</p>
          ) : (
            <>
              <p>Das Wort ist:</p>
              <div className="word">{word}</div>
            </>
          )}
        </div>
      )}

      <div className="players-section">
        <h3>Spieler ({players.length})</h3>
        <div className="players-grid">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`player-card ${player.isHost ? 'host' : ''}`}
            >
              <div className="player-name">{player.name}</div>
              <div className="player-role">
                {player.isHost ? 'Host' : 'Spieler'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!gameStarted && (
        <>
          {players.length < 3 && (
            <p className="waiting-message">
              Warte auf weitere Spieler... (Mindestens 3 Spieler benötigt)
            </p>
          )}
          {isHost && players.length >= 3 && (
            <div className="game-controls">
              <button className="btn" onClick={handleStartGame}>
                Spiel starten
              </button>
            </div>
          )}
          {!isHost && players.length >= 3 && (
            <p className="waiting-message">
              Warte darauf, dass der Host das Spiel startet...
            </p>
          )}
        </>
      )}

      {gameStarted && !gameEnded && isHost && (
        <div className="game-controls">
          <button className="btn btn-danger" onClick={handleEndGame}>
            Spiel beenden & Betrüger aufdecken
          </button>
        </div>
      )}
    </div>
  );
};

export default GameRoom; 