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

// Word categories for the game
const wordCategories = {
  de: {
    tiere: {
      name: 'Tiere',
      words: ['Katze', 'Hund', 'Elefant', 'Löwe', 'Tiger', 'Pinguin', 'Känguru', 'Giraffe', 'Zebra', 'Affe', 'Bär', 'Wolf', 'Fuchs', 'Adler', 'Delfin', 'Hai', 'Schildkröte', 'Papagei', 'Hamster', 'Kaninchen']
    },
    essen: {
      name: 'Essen & Trinken',
      words: ['Pizza', 'Burger', 'Pasta', 'Sushi', 'Salat', 'Suppe', 'Steak', 'Käse', 'Brot', 'Kuchen', 'Eis', 'Schokolade', 'Kaffee', 'Tee', 'Bier', 'Wein', 'Wasser', 'Saft', 'Smoothie', 'Sandwich']
    },
    orte: {
      name: 'Orte',
      words: ['Strand', 'Berg', 'Wald', 'Stadt', 'Dorf', 'Schule', 'Krankenhaus', 'Supermarkt', 'Restaurant', 'Kino', 'Theater', 'Museum', 'Bibliothek', 'Park', 'Flughafen', 'Bahnhof', 'Hotel', 'Schloss', 'Kirche', 'Stadion']
    },
    sport: {
      name: 'Sport & Hobbys',
      words: ['Fußball', 'Basketball', 'Tennis', 'Schwimmen', 'Laufen', 'Radfahren', 'Skifahren', 'Tanzen', 'Singen', 'Malen', 'Lesen', 'Kochen', 'Fotografieren', 'Wandern', 'Yoga', 'Boxen', 'Golf', 'Reiten', 'Angeln', 'Schach']
    },
    gegenstände: {
      name: 'Gegenstände',
      words: ['Computer', 'Handy', 'Fernseher', 'Auto', 'Fahrrad', 'Flugzeug', 'Schiff', 'Buch', 'Stift', 'Tisch', 'Stuhl', 'Bett', 'Lampe', 'Uhr', 'Brille', 'Schlüssel', 'Tasche', 'Schuhe', 'Gitarre', 'Kamera']
    },
    natur: {
      name: 'Natur',
      words: ['Sonne', 'Mond', 'Stern', 'Wolke', 'Regen', 'Schnee', 'Blitz', 'Regenbogen', 'Baum', 'Blume', 'Gras', 'Rose', 'Tulpe', 'Berg', 'Fluss', 'See', 'Meer', 'Wüste', 'Vulkan', 'Wasserfall']
    },
    berufe: {
      name: 'Berufe',
      words: ['Arzt', 'Lehrer', 'Polizist', 'Feuerwehrmann', 'Koch', 'Pilot', 'Ingenieur', 'Künstler', 'Musiker', 'Schauspieler', 'Journalist', 'Anwalt', 'Richter', 'Verkäufer', 'Manager', 'Programmierer', 'Designer', 'Fotograf', 'Friseur', 'Mechaniker']
    },
    filme: {
      name: 'Filme & Serien',
      words: ['Star Wars', 'Harry Potter', 'Titanic', 'Avatar', 'Marvel', 'Batman', 'James Bond', 'Herr der Ringe', 'Matrix', 'Inception', 'Friends', 'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office', 'Simpsons', 'Disney', 'Pixar', 'Netflix', 'Hollywood']
    }
  },
  en: {
    animals: {
      name: 'Animals',
      words: ['Cat', 'Dog', 'Elephant', 'Lion', 'Tiger', 'Penguin', 'Kangaroo', 'Giraffe', 'Zebra', 'Monkey', 'Bear', 'Wolf', 'Fox', 'Eagle', 'Dolphin', 'Shark', 'Turtle', 'Parrot', 'Hamster', 'Rabbit']
    },
    food: {
      name: 'Food & Drinks',
      words: ['Pizza', 'Burger', 'Pasta', 'Sushi', 'Salad', 'Soup', 'Steak', 'Cheese', 'Bread', 'Cake', 'Ice Cream', 'Chocolate', 'Coffee', 'Tea', 'Beer', 'Wine', 'Water', 'Juice', 'Smoothie', 'Sandwich']
    },
    places: {
      name: 'Places',
      words: ['Beach', 'Mountain', 'Forest', 'City', 'Village', 'School', 'Hospital', 'Supermarket', 'Restaurant', 'Cinema', 'Theater', 'Museum', 'Library', 'Park', 'Airport', 'Station', 'Hotel', 'Castle', 'Church', 'Stadium']
    },
    sports: {
      name: 'Sports & Hobbies',
      words: ['Football', 'Basketball', 'Tennis', 'Swimming', 'Running', 'Cycling', 'Skiing', 'Dancing', 'Singing', 'Painting', 'Reading', 'Cooking', 'Photography', 'Hiking', 'Yoga', 'Boxing', 'Golf', 'Riding', 'Fishing', 'Chess']
    },
    objects: {
      name: 'Objects',
      words: ['Computer', 'Phone', 'Television', 'Car', 'Bicycle', 'Airplane', 'Ship', 'Book', 'Pen', 'Table', 'Chair', 'Bed', 'Lamp', 'Clock', 'Glasses', 'Keys', 'Bag', 'Shoes', 'Guitar', 'Camera']
    },
    nature: {
      name: 'Nature',
      words: ['Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Snow', 'Lightning', 'Rainbow', 'Tree', 'Flower', 'Grass', 'Rose', 'Tulip', 'Mountain', 'River', 'Lake', 'Ocean', 'Desert', 'Volcano', 'Waterfall']
    },
    professions: {
      name: 'Professions',
      words: ['Doctor', 'Teacher', 'Police Officer', 'Firefighter', 'Chef', 'Pilot', 'Engineer', 'Artist', 'Musician', 'Actor', 'Journalist', 'Lawyer', 'Judge', 'Salesperson', 'Manager', 'Programmer', 'Designer', 'Photographer', 'Hairdresser', 'Mechanic']
    },
    movies: {
      name: 'Movies & Shows',
      words: ['Star Wars', 'Harry Potter', 'Titanic', 'Avatar', 'Marvel', 'Batman', 'James Bond', 'Lord of the Rings', 'Matrix', 'Inception', 'Friends', 'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office', 'Simpsons', 'Disney', 'Pixar', 'Netflix', 'Hollywood']
    }
  }
};

// Error messages in multiple languages
const errorMessages = {
  de: {
    roomNotFound: 'Raum nicht gefunden',
    gameInProgress: 'Spiel läuft bereits',
    onlyHostStart: 'Nur der Host kann das Spiel starten',
    minPlayers: 'Mindestens 3 Spieler benötigt',
    onlyHostEnd: 'Nur der Host kann das Spiel beenden',
    onlyHostCategories: 'Nur der Host kann die Kategorien ändern',
    onlyHostRound: 'Nur der Host kann eine neue Runde starten',
    playerDisconnected: 'Spieler getrennt',
    imposterDisconnected: 'Betrüger hat das Spiel verlassen'
  },
  en: {
    roomNotFound: 'Room not found',
    gameInProgress: 'Game already in progress',
    onlyHostStart: 'Only the host can start the game',
    minPlayers: 'Need at least 3 players',
    onlyHostEnd: 'Only the host can end the game',
    onlyHostCategories: 'Only the host can change categories',
    onlyHostRound: 'Only the host can start a new round',
    playerDisconnected: 'Player disconnected',
    imposterDisconnected: 'Imposter left the game'
  }
};

// Old word list for backward compatibility
const wordList = Object.values(wordCategories.de).flatMap(category => category.words);

class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.started = false;
    this.currentWord = '';
    this.imposterId = '';
    this.selectedCategories = ['tiere', 'essen', 'orte', 'sport', 'gegenstände', 'natur', 'berufe', 'filme']; // Default: all categories
    this.playerOrder = [];
    this.currentPlayerIndex = 0;
    this.language = 'de'; // Default language
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
    
    // Get the appropriate category keys based on language
    const categoryMapping = {
      de: ['tiere', 'essen', 'orte', 'sport', 'gegenstände', 'natur', 'berufe', 'filme'],
      en: ['animals', 'food', 'places', 'sports', 'objects', 'nature', 'professions', 'movies']
    };
    
    // Map selected categories to current language
    const mappedCategories = this.selectedCategories.map((cat, index) => {
      const deIndex = categoryMapping.de.indexOf(cat);
      const enIndex = categoryMapping.en.indexOf(cat);
      const actualIndex = deIndex !== -1 ? deIndex : enIndex;
      return categoryMapping[this.language][actualIndex];
    }).filter(cat => cat);
    
    // Get words from selected categories
    const availableWords = mappedCategories.flatMap(categoryId => 
      wordCategories[this.language][categoryId] ? wordCategories[this.language][categoryId].words : []
    );
    
    if (availableWords.length === 0) {
      // Fallback to all words if no categories selected
      const allWords = Object.values(wordCategories[this.language]).flatMap(category => category.words);
      availableWords.push(...allWords);
    }
    
    this.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    // Select random imposter
    const playerIds = Array.from(this.players.keys());
    this.imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Reset all players and set imposter
    this.players.forEach((player) => {
      player.isImposter = player.id === this.imposterId;
    });
    
    // Randomize player order
    this.randomizePlayerOrder();
    
    return true;
  }

  randomizePlayerOrder() {
    const playerIds = Array.from(this.players.keys());
    // Fisher-Yates shuffle
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    this.playerOrder = playerIds;
    this.currentPlayerIndex = 0;
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
  }

  getCurrentTurnPlayerId() {
    return this.playerOrder[this.currentPlayerIndex] || null;
  }

  resetGame() {
    this.started = false;
    this.currentWord = '';
    this.imposterId = '';
    this.playerOrder = [];
    this.currentPlayerIndex = 0;
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

  setCategories(categories) {
    this.selectedCategories = categories;
  }

  getGameState() {
    return {
      players: this.getPlayersInfo(),
      gameStarted: this.started,
      playerOrder: this.playerOrder,
      currentTurnPlayerId: this.getCurrentTurnPlayerId(),
      currentPlayerIndex: this.currentPlayerIndex
    };
  }

  setLanguage(language) {
    this.language = language;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('createRoom', ({ playerName, language = 'de' }) => {
    const roomCode = generateRoomCode();
    const game = new Game(roomCode);
    game.setLanguage(language);
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
  
  socket.on('joinRoom', ({ roomCode, playerName, language = 'de' }) => {
    const game = games.get(roomCode);
    
    if (!game) {
      socket.emit('error', { message: errorMessages[language].roomNotFound });
      return;
    }
    
    if (game.started) {
      socket.emit('error', { message: errorMessages[language].gameInProgress });
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
        ...game.getGameState()
      });
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

  socket.on('updateCategories', ({ roomCode, categories }) => {
    const game = games.get(roomCode);
    
    if (!game) {
      socket.emit('error', { message: 'Raum nicht gefunden' });
      return;
    }
    
    const player = game.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('error', { message: 'Nur der Host kann die Kategorien ändern' });
      return;
    }
    
    game.setCategories(categories);
    
    // Notify all players about category update
    io.to(roomCode).emit('categoriesUpdated', { 
      categories: categories,
      availableCategories: wordCategories[game.language]
    });
  });

  socket.on('setLanguage', ({ roomCode, language }) => {
    const game = games.get(roomCode);
    if (game) {
      game.setLanguage(language);
      
      // Send updated categories for the new language
      io.to(roomCode).emit('categoriesUpdated', { 
        categories: game.selectedCategories,
        availableCategories: wordCategories[language]
      });
    }
  });

  socket.on('getCategories', ({ roomCode }) => {
    const game = games.get(roomCode);
    if (game) {
      socket.emit('categoriesUpdated', { 
        categories: game.selectedCategories,
        availableCategories: wordCategories[game.language],
        currentLanguage: game.language
      });
    }
  });

  socket.on('nextTurn', ({ roomCode }) => {
    const game = games.get(roomCode);
    
    if (!game || !game.started) return;
    
    game.nextTurn();
    
    io.to(roomCode).emit('turnUpdate', {
      currentTurnPlayerId: game.getCurrentTurnPlayerId(),
      currentPlayerIndex: game.currentPlayerIndex
    });
  });

  socket.on('newRound', ({ roomCode }) => {
    const game = games.get(roomCode);
    
    if (!game || !game.started) return;
    
    const player = game.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('error', { message: 'Nur der Host kann eine neue Runde starten' });
      return;
    }
    
    // Randomize order for new round
    game.randomizePlayerOrder();
    
    io.to(roomCode).emit('roundStarted', {
      playerOrder: game.playerOrder,
      currentTurnPlayerId: game.getCurrentTurnPlayerId(),
      currentPlayerIndex: 0
    });
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