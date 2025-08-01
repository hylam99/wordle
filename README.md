# Wordle Game

A modern implementation of the popular Wordle word-guessing game built with Next.js, featuring multiple game modes and real-time multiplayer functionality.

## Features
- **Normal Mode**: Classic Wordle gameplay with 6 attempts to guess a 5-letter word
- **Hard Mode**: Enhanced difficulty with additional constraints (Host cheating version)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.0 or higher)
- **npm**, **yarn**, **pnpm**, or **bun** package manager

You can check your Node.js version by running:

```bash
node --version
```

## Setup

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd wordle
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

## Running the Project

### Development Mode

To start the development server with hot reload:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

The development server includes:

- Hot reloading for instant updates
- TypeScript compilation
- Tailwind CSS processing
- Next.js Turbopack for faster builds

### Manual Testing

1. **Start the development server** using `npm run dev`
2. **Navigate to** [http://localhost:3000](http://localhost:3000)
3. **Test each game mode**:
   - Click on "Normal Mode" to test classic gameplay
   - Click on "Hard Mode" to test enhanced difficulty
   - Click on "Multiplayer Mode"to test real-time multiplayer features
