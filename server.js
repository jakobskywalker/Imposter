const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/build');
  
  // Debug logging
  console.log('Production mode detected');
  console.log('Looking for client build at:', clientBuildPath);
  console.log('Directory exists:', fs.existsSync(clientBuildPath));
  
  if (fs.existsSync(clientBuildPath)) {
    // Serve static files from the React app
    app.use(express.static(clientBuildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      const indexPath = path.join(clientBuildPath, 'index.html');
      console.log('Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    });
  } else {
    console.error('Client build directory not found!');
    app.get('*', (req, res) => {
      res.status(404).send('Client build not found. Please run: cd client && npm run build');
    });
  }
}

// Game state
const games = new Map();
const playerSockets = new Map();

// Word list for the game
const wordList = [
  'Pizza', 'Strand', 'Gitarre', 'Regenbogen', 'Elefant', 'Schokolade', 'Fahrrad', 'Sonnenuntergang',
  'Berg', 'Kaffee', 'Drache', 'Garten', 'Schloss', 'Ozean', 'Wald', 'Gewitter',
  'Schmetterling', 'Kamera', 'Diamant', 'Rakete', 'Wasserfall', 'Teleskop', 'Universum',
  'Vulkan', 'Leuchtturm', 'Kompass', 'Phönix', 'Pyramide', 'Schatz', 'Galaxie',
  'Katze', 'Hund', 'Auto', 'Flugzeug', 'Buch', 'Computer', 'Handy', 'Fernseher',
  'Küche', 'Badezimmer', 'Schule', 'Krankenhaus', 'Supermarkt', 'Restaurant', 'Kino', 'Theater',
  'Fußball', 'Basketball', 'Tennis', 'Schwimmen', 'Tanzen', 'Singen', 'Malen', 'Kochen',
  'Sommer', 'Winter', 'Frühling', 'Herbst', 'Regen', 'Schnee', 'Sonne', 'Wolke'
];

class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.started = false;
    this.currentWord = '';
    this.imposterId = '';
  }

  addPlayer(socketId, name) {
    this.players.set(socketId, {
      id: socketId,
      name: name,
      isImposter: false,
      isHost: this.players.size === 0
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.players.size === 0) {
      games.delete(this.roomCode);
    } else if (this.getHost()?.id === socketId) {
      // Assign new host
      const firstPlayer = this.players.values().next().value;
      if (firstPlayer) {
        firstPlayer.isHost = true;
      }
    }
  }

  getHost() {
    for (let player of this.players.values()) {
      if (player.isHost) return player;
    }
    return null;
  }

  startGame() {
    if (this.players.size < 3) return false;
    
    this.started = true;
    this.currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    // Select random imposter
    const playerIds = Array.from(this.players.keys());
    this.imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Reset all players and set imposter
    this.players.forEach((player) => {
      player.isImposter = player.id === this.imposterId;
    });
    
    return true;
  }

  resetGame() {
    this.started = false;
    this.currentWord = '';
    this.imposterId = '';
    this.players.forEach(player => {
      player.isImposter = false;
    });
  }

  getPlayersInfo() {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost
    }));
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('createRoom', ({ playerName }) => {
    const roomCode = generateRoomCode();
    const game = new Game(roomCode);
    game.addPlayer(socket.id, playerName);
    games.set(roomCode, game);
    playerSockets.set(socket.id, roomCode);
    
    socket.join(roomCode);
    socket.emit('roomCreated', { 
      roomCode, 
      playerId: socket.id,
      isHost: true 
    });
    
    io.to(roomCode).emit('playersUpdate', {
      players: game.getPlayersInfo(),
      gameStarted: game.started
    });
  });
  
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const game = games.get(roomCode);
    
    if (!game) {
      socket.emit('error', { message: 'Raum nicht gefunden' });
      return;
    }
    
    if (game.started) {
      socket.emit('error', { message: 'Spiel läuft bereits' });
      return;
    }
    
    game.addPlayer(socket.id, playerName);
    playerSockets.set(socket.id, roomCode);
    socket.join(roomCode);
    
    socket.emit('roomJoined', { 
      roomCode, 
      playerId: socket.id,
      isHost: false 
    });
    
    // Send update to all players in the room
    io.to(roomCode).emit('playersUpdate', {
      players: game.getPlayersInfo(),
      gameStarted: game.started
    });
  });
  
  socket.on('startGame', ({ roomCode }) => {
    const game = games.get(roomCode);
    
    if (!game) {
      socket.emit('error', { message: 'Raum nicht gefunden' });
      return;
    }
    
    const player = game.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('error', { message: 'Nur der Host kann das Spiel starten' });
      return;
    }
    
    if (!game.startGame()) {
      socket.emit('error', { message: 'Mindestens 3 Spieler benötigt' });
      return;
    }
    
    // Send game data to each player
    game.players.forEach((player, socketId) => {
      io.to(socketId).emit('gameStarted', {
        isImposter: player.isImposter,
        word: player.isImposter ? null : game.currentWord,
        players: game.getPlayersInfo()
      });
    });
    
    io.to(roomCode).emit('playersUpdate', {
      players: game.getPlayersInfo(),
      gameStarted: game.started
    });
  });
  
  socket.on('endGame', ({ roomCode }) => {
    const game = games.get(roomCode);
    
    if (!game) return;
    
    const player = game.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('error', { message: 'Nur der Host kann das Spiel beenden' });
      return;
    }
    
    // Reveal the imposter to everyone
    const imposter = game.players.get(game.imposterId);
    io.to(roomCode).emit('gameEnded', {
      imposterId: game.imposterId,
      imposterName: imposter?.name || 'Unknown',
      word: game.currentWord
    });
    
    game.resetGame();
    
    io.to(roomCode).emit('playersUpdate', {
      players: game.getPlayersInfo(),
      gameStarted: game.started
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomCode = playerSockets.get(socket.id);
    
    if (roomCode) {
      const game = games.get(roomCode);
      if (game) {
        game.removePlayer(socket.id);
        
        if (game.players.size > 0) {
          io.to(roomCode).emit('playersUpdate', {
            players: game.getPlayersInfo(),
            gameStarted: game.started
          });
          
          if (game.started && socket.id === game.imposterId) {
            // End game if imposter leaves
            const imposter = { name: 'Spieler getrennt' };
            io.to(roomCode).emit('gameEnded', {
              imposterId: game.imposterId,
              imposterName: imposter.name,
              word: game.currentWord,
              reason: 'Betrüger hat das Spiel verlassen'
            });
            game.resetGame();
          }
        }
      }
      playerSockets.delete(socket.id);
    }
  });

  // Add getRoomState handler
  socket.on('getRoomState', ({ roomCode }) => {
    const game = games.get(roomCode);
    if (game && game.players.has(socket.id)) {
      socket.emit('playersUpdate', {
        players: game.getPlayersInfo(),
        gameStarted: game.started
      });
    }
  });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 