import React from 'react';

const PlayerOrder = ({ players, playerOrder, currentTurnPlayerId, isHost, onNextTurn, onNewRound }) => {
  if (!playerOrder || playerOrder.length === 0) return null;

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unbekannt';
  };

  return (
    <div className="player-order-container">
      <h3>Spielerreihenfolge:</h3>
      <div className="player-order-list">
        {playerOrder.map((playerId, index) => {
          const isCurrentTurn = playerId === currentTurnPlayerId;
          const player = players.find(p => p.id === playerId);
          
          return (
            <div 
              key={playerId} 
              className={`player-order-item ${isCurrentTurn ? 'current-turn' : ''}`}
            >
              <span className="order-number">{index + 1}</span>
              <span className="player-name">{getPlayerName(playerId)}</span>
              {isCurrentTurn && <span className="turn-indicator">← Jetzt dran!</span>}
            </div>
          );
        })}
      </div>
      
      {isHost && (
        <div className="turn-controls">
          <button 
            className="btn btn-secondary" 
            onClick={onNextTurn}
            style={{ marginRight: '10px' }}
          >
            Nächster Spieler
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onNewRound}
          >
            Neue Runde (Reihenfolge mischen)
          </button>
        </div>
      )}
      
      {!isHost && (
        <p className="turn-info">
          Der Host kontrolliert die Spielerreihenfolge
        </p>
      )}
    </div>
  );
};

export default PlayerOrder; 