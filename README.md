# Imposter Game

A real-time multiplayer web game where one player is secretly the imposter while others get a word to describe. Built with React and Socket.io.

## How to Play

1. **Create or Join a Room**: Enter your name and either create a new room or join an existing one with a 6-letter code.

2. **Wait for Players**: You need at least 3 players to start the game.

3. **Game Start**: 
   - One random player becomes the **Imposter** (doesn't know the word)
   - All other players see the secret word
   - Everyone takes turns describing the word

4. **Objective**:
   - Regular players: Describe the word without making it too obvious
   - Imposter: Try to blend in and guess what the word might be

5. **End Game**: The host can end the game to reveal who the imposter was

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd imposter-game
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

### Running the Application

#### Development Mode

1. Start the backend server:
```bash
npm run dev
```

2. In a new terminal, start the React frontend:
```bash
cd client
npm start
```

3. Open http://localhost:3000 in your browser

#### Production Mode

1. Build the frontend:
```bash
cd client
npm run build
cd ..
```

2. Start the server:
```bash
npm start
```

3. Open http://localhost:3001 in your browser

### Deployment

For deployment, you can use services like:
- Heroku
- Railway
- Render
- Your own VPS

Make sure to set the environment variable:
- `PORT` - The port for the server (default: 3001)

## Features

- Real-time multiplayer gameplay
- Automatic host reassignment if host leaves
- Beautiful modern UI with gradient design
- Responsive design for mobile devices
- Room codes for easy sharing
- Copy room link functionality

## Technologies Used

- **Frontend**: React, React Router, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Styling**: Custom CSS with modern design

## Game Rules

- Minimum 3 players required
- One imposter per game
- Only the host can start/end games
- If the imposter leaves during a game, the game ends
- Players can rejoin with the same name if disconnected 