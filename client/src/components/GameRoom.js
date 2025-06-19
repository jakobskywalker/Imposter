import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import CategorySelector from './CategorySelector';
import PlayerOrder from './PlayerOrder';

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
  const [categories, setCategories] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [playerOrder, setPlayerOrder] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);

  useEffect(() => {
    if (!connected || !socket) {
      navigate('/');
      return;
    }

    // Request current room state when joining
    socket.emit('getRoomState', { roomCode });
    socket.emit('getCategories', { roomCode });

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

    socket.on('categoriesUpdated', ({ categories, availableCategories }) => {
      setSelectedCategories(categories);
      setCategories(availableCategories);
    });

    socket.on('gameStarted', ({ isImposter, word, players, playerOrder, currentTurnPlayerId }) => {
      setGameStarted(true);
      setIsImposter(isImposter);
      setWord(word);
      setPlayers(players);
      setPlayerOrder(playerOrder);
      setCurrentTurnPlayerId(currentTurnPlayerId);
      setGameEnded(false);
      setImposterInfo(null);
    });

    socket.on('turnUpdate', ({ currentTurnPlayerId, currentPlayerIndex }) => {
      setCurrentTurnPlayerId(currentTurnPlayerId);
    });

    socket.on('roundStarted', ({ playerOrder, currentTurnPlayerId }) => {
      setPlayerOrder(playerOrder);
      setCurrentTurnPlayerId(currentTurnPlayerId);
    });

    socket.on('gameEnded', ({ imposterId, imposterName, word, reason }) => {
      setGameEnded(true);
      setImposterInfo({ id: imposterId, name: imposterName, word });
      setGameStarted(false);
      setPlayerOrder([]);
      setCurrentTurnPlayerId(null);
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
      socket.off('categoriesUpdated');
      socket.off('turnUpdate');
      socket.off('roundStarted');
    };
  }, [socket, connected, navigate, roomCode]);

  const handleCategoryToggle = (categoryId) => {
    if (!socket || !isHost) return;
    
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    socket.emit('updateCategories', { roomCode, categories: newCategories });
  };

  const handleStartGame = () => {
    if (!socket || selectedCategories.length === 0) return;
    socket.emit('startGame', { roomCode });
  };

  const handleEndGame = () => {
    if (!socket) return;
    socket.emit('endGame', { roomCode });
  };

  const handleNextTurn = () => {
    if (!socket || !isHost) return;
    socket.emit('nextTurn', { roomCode });
  };

  const handleNewRound = () => {
    if (!socket || !isHost) return;
    socket.emit('newRound', { roomCode });
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
        <>
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

          <PlayerOrder
            players={players}
            playerOrder={playerOrder}
            currentTurnPlayerId={currentTurnPlayerId}
            isHost={isHost}
            onNextTurn={handleNextTurn}
            onNewRound={handleNewRound}
          />
        </>
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

      {!gameStarted && Object.keys(categories).length > 0 && (
        <CategorySelector
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          isHost={isHost}
        />
      )}

      {!gameStarted && (
        <>
          {players.length < 3 && (
            <p className="waiting-message">
              Warte auf weitere Spieler... (Mindestens 3 Spieler benötigt)
            </p>
          )}
          {isHost && players.length >= 3 && (
            <div className="game-controls">
              <button 
                className="btn" 
                onClick={handleStartGame}
                disabled={selectedCategories.length === 0}
              >
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