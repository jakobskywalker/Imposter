import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const HomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    if (!connected || !socket) {
      setError('Verbindungsfehler. Bitte lade die Seite neu.');
      return;
    }

    socket.emit('createRoom', { playerName: playerName.trim() });
    
    socket.once('roomCreated', ({ roomCode }) => {
      navigate(`/room/${roomCode}`);
    });

    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    if (!roomCode.trim()) {
      setError('Bitte gib einen Raumcode ein');
      return;
    }

    if (!connected || !socket) {
      setError('Verbindungsfehler. Bitte lade die Seite neu.');
      return;
    }

    socket.emit('joinRoom', { 
      roomCode: roomCode.trim().toUpperCase(), 
      playerName: playerName.trim() 
    });
    
    socket.once('roomJoined', ({ roomCode }) => {
      navigate(`/room/${roomCode}`);
    });

    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  return (
    <div className="container">
      <h1 className="title">Betrüger Spiel</h1>
      <p className="subtitle">Ein Betrüger, ein Wort, endloser Spaß!</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="input-group">
        <label htmlFor="playerName">Dein Name</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Gib deinen Namen ein"
          maxLength={20}
        />
      </div>

      <button 
        className="btn"
        onClick={handleCreateRoom}
        disabled={!connected}
      >
        Neuen Raum erstellen
      </button>

      <div className="divider">
        <span>ODER</span>
      </div>

      <div className="input-group">
        <label htmlFor="roomCode">Raumcode</label>
        <input
          id="roomCode"
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="6-stelligen Code eingeben"
          maxLength={6}
        />
      </div>

      <button 
        className="btn"
        onClick={handleJoinRoom}
        disabled={!connected}
      >
        Raum beitreten
      </button>

      {!connected && (
        <p className="waiting-message">Verbinde mit Server...</p>
      )}
      
      {/* Easter egg */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        right: '10px', 
        fontSize: '0.7rem', 
        color: 'rgba(255,255,255,0.3)',
        fontStyle: 'italic',
        userSelect: 'none'
      }}>
        für die discord nibbers
      </div>
    </div>
  );
};

export default HomePage; 