import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

const HomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { t, language } = useLanguage();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError(t('errorEnterName'));
      return;
    }

    if (!connected || !socket) {
      setError(t('errorConnection'));
      return;
    }

    socket.emit('createRoom', { 
      playerName: playerName.trim(),
      language: language 
    });
    
    socket.once('roomCreated', ({ roomCode }) => {
      navigate(`/room/${roomCode}`);
    });

    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError(t('errorEnterName'));
      return;
    }

    if (!roomCode.trim()) {
      setError(t('errorEnterCode'));
      return;
    }

    if (!connected || !socket) {
      setError(t('errorConnection'));
      return;
    }

    socket.emit('joinRoom', { 
      roomCode: roomCode.trim().toUpperCase(), 
      playerName: playerName.trim(),
      language: language 
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
      <LanguageSelector />
      <h1 className="title">{t('gameTitle')}</h1>
      <p className="subtitle">{t('gameSubtitle')}</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="input-group">
        <label htmlFor="playerName">{t('yourName')}</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder={t('enterName')}
          maxLength={20}
        />
      </div>

      <button 
        className="btn"
        onClick={handleCreateRoom}
        disabled={!connected}
      >
        {t('createRoom')}
      </button>

      <div className="divider">
        <span>{t('or')}</span>
      </div>

      <div className="input-group">
        <label htmlFor="roomCode">{t('roomCode')}</label>
        <input
          id="roomCode"
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder={t('enterRoomCode')}
          maxLength={6}
        />
      </div>

      <button 
        className="btn"
        onClick={handleJoinRoom}
        disabled={!connected}
      >
        {t('joinRoom')}
      </button>

      {!connected && (
        <p className="waiting-message">{t('connecting')}</p>
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