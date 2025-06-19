import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  de: {
    // HomePage
    gameTitle: 'Imposter Game für Nibbers',
    gameSubtitle: 'Ein Betrüger, ein Wort, endloser Spaß!',
    yourName: 'Dein Name',
    enterName: 'Gib deinen Namen ein',
    createRoom: 'Neuen Raum erstellen',
    or: 'ODER',
    roomCode: 'Raumcode',
    enterRoomCode: '6-stelligen Code eingeben',
    joinRoom: 'Raum beitreten',
    connecting: 'Verbinde mit Server...',
    
    // Errors
    errorEnterName: 'Bitte gib deinen Namen ein',
    errorEnterCode: 'Bitte gib einen Raumcode ein',
    errorConnection: 'Verbindungsfehler. Bitte lade die Seite neu.',
    errorRoomNotFound: 'Raum nicht gefunden',
    errorGameInProgress: 'Spiel läuft bereits',
    errorOnlyHost: 'Nur der Host kann das Spiel starten',
    errorMinPlayers: 'Mindestens 3 Spieler benötigt',
    errorOnlyHostEnd: 'Nur der Host kann das Spiel beenden',
    errorOnlyHostCategories: 'Nur der Host kann die Kategorien ändern',
    errorOnlyHostRound: 'Nur der Host kann eine neue Runde starten',
    
    // GameRoom
    roomCodeLabel: 'Raumcode:',
    copyLink: 'Link kopieren',
    leaveRoom: 'Raum verlassen',
    linkCopied: 'Raumlink in Zwischenablage kopiert!',
    gameEnded: 'Spiel beendet!',
    imposterWas: 'Der Betrüger war:',
    wordWas: 'Das Wort war:',
    youAreImposter: 'Du bist der BETRÜGER!',
    youAreNormal: 'Du bist ein NORMALER Spieler',
    tryToBlend: 'Versuche dich einzufügen, ohne das Wort zu kennen!',
    theWordIs: 'Das Wort ist:',
    players: 'Spieler',
    host: 'Host',
    player: 'Spieler',
    waitingForPlayers: 'Warte auf weitere Spieler... (Mindestens 3 Spieler benötigt)',
    startGame: 'Spiel starten',
    waitingForHost: 'Warte darauf, dass der Host das Spiel startet...',
    endGameReveal: 'Spiel beenden & Betrüger aufdecken',
    
    // Categories
    selectCategories: 'Wähle Kategorien:',
    selectedCategories: 'Ausgewählte Kategorien:',
    words: 'Wörter',
    selectAtLeastOne: 'Bitte wähle mindestens eine Kategorie aus!',
    
    // Player Order
    playerOrder: 'Spielerreihenfolge:',
    currentTurn: 'Jetzt dran!',
    nextPlayer: 'Nächster Spieler',
    newRound: 'Neue Runde (Reihenfolge mischen)',
    hostControlsOrder: 'Der Host kontrolliert die Spielerreihenfolge',
    
    // Disconnect
    playerDisconnected: 'Spieler getrennt',
    imposterDisconnected: 'Betrüger hat das Spiel verlassen',
    
    // Category Names
    animals: 'Tiere',
    foodDrink: 'Essen & Trinken',
    places: 'Orte',
    sportsHobbies: 'Sport & Hobbys',
    objects: 'Gegenstände',
    nature: 'Natur',
    professions: 'Berufe',
    moviesShows: 'Filme & Serien'
  },
  en: {
    // HomePage
    gameTitle: 'Imposter Game for Nibbers',
    gameSubtitle: 'One imposter, one word, endless fun!',
    yourName: 'Your Name',
    enterName: 'Enter your name',
    createRoom: 'Create New Room',
    or: 'OR',
    roomCode: 'Room Code',
    enterRoomCode: 'Enter 6-letter code',
    joinRoom: 'Join Room',
    connecting: 'Connecting to server...',
    
    // Errors
    errorEnterName: 'Please enter your name',
    errorEnterCode: 'Please enter a room code',
    errorConnection: 'Connection error. Please refresh the page.',
    errorRoomNotFound: 'Room not found',
    errorGameInProgress: 'Game already in progress',
    errorOnlyHost: 'Only the host can start the game',
    errorMinPlayers: 'Need at least 3 players',
    errorOnlyHostEnd: 'Only the host can end the game',
    errorOnlyHostCategories: 'Only the host can change categories',
    errorOnlyHostRound: 'Only the host can start a new round',
    
    // GameRoom
    roomCodeLabel: 'Room Code:',
    copyLink: 'Copy Link',
    leaveRoom: 'Leave Room',
    linkCopied: 'Room link copied to clipboard!',
    gameEnded: 'Game Over!',
    imposterWas: 'The imposter was:',
    wordWas: 'The word was:',
    youAreImposter: 'You are the IMPOSTER!',
    youAreNormal: 'You are a REGULAR player',
    tryToBlend: 'Try to blend in without knowing the word!',
    theWordIs: 'The word is:',
    players: 'Players',
    host: 'Host',
    player: 'Player',
    waitingForPlayers: 'Waiting for more players... (Need at least 3 players)',
    startGame: 'Start Game',
    waitingForHost: 'Waiting for the host to start the game...',
    endGameReveal: 'End Game & Reveal Imposter',
    
    // Categories
    selectCategories: 'Select Categories:',
    selectedCategories: 'Selected Categories:',
    words: 'words',
    selectAtLeastOne: 'Please select at least one category!',
    
    // Player Order
    playerOrder: 'Player Order:',
    currentTurn: "It's your turn!",
    nextPlayer: 'Next Player',
    newRound: 'New Round (Shuffle Order)',
    hostControlsOrder: 'The host controls the player order',
    
    // Disconnect
    playerDisconnected: 'Player disconnected',
    imposterDisconnected: 'Imposter left the game',
    
    // Category Names
    animals: 'Animals',
    foodDrink: 'Food & Drinks',
    places: 'Places',
    sportsHobbies: 'Sports & Hobbies',
    objects: 'Objects',
    nature: 'Nature',
    professions: 'Professions',
    moviesShows: 'Movies & Shows'
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('gameLanguage') || 'de';
  });

  useEffect(() => {
    localStorage.setItem('gameLanguage', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 