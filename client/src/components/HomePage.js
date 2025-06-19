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
      setError('Please enter your name');
      return;
    }

    if (!connected || !socket) {
      setError('Connection error. Please refresh the page.');
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
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!connected || !socket) {
      setError('Connection error. Please refresh the page.');
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
      <h1 className="title">Imposter Game</h1>
      <p className="subtitle">One imposter, one word, endless fun!</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="input-group">
        <label htmlFor="playerName">Your Name</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      <button 
        className="btn"
        onClick={handleCreateRoom}
        disabled={!connected}
      >
        Create New Room
      </button>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="input-group">
        <label htmlFor="roomCode">Room Code</label>
        <input
          id="roomCode"
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-letter code"
          maxLength={6}
        />
      </div>

      <button 
        className="btn"
        onClick={handleJoinRoom}
        disabled={!connected}
      >
        Join Room
      </button>

      {!connected && (
        <p className="waiting-message">Connecting to server...</p>
      )}
    </div>
  );
};

export default HomePage; 