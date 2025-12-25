// Wordle Game Module
// Handles all Wordle-specific game logic

export interface WordleGameState {
    targetWord: string;
    currentRow: number;
    currentGuess: string;
    guesses: string[];
    gameOver: boolean;
    won: boolean;
}

export class WordleGame {
    private state: WordleGameState;
    private validWords: Set<string>;

    constructor(validWords: string[]) {
        this.validWords = new Set(validWords.map(w => w.toUpperCase()));
        this.state = this.initializeGame();
    }

    private initializeGame(): WordleGameState {
        const fiveLetterWords = Array.from(this.validWords).filter(w => w.length === 5);
        const targetWord = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)];

        return {
            targetWord,
            currentRow: 0,
            currentGuess: '',
            guesses: [],
            gameOver: false,
            won: false
        };
    }

    addLetter(letter: string): boolean {
        if (this.state.gameOver || this.state.currentGuess.length >= 5) {
            return false;
        }
        this.state.currentGuess += letter.toUpperCase();
        return true;
    }

    deleteLetter(): boolean {
        if (this.state.gameOver || this.state.currentGuess.length === 0) {
            return false;
        }
        this.state.currentGuess = this.state.currentGuess.slice(0, -1);
        return true;
    }

    submitGuess(): { success: boolean; message?: string; result?: LetterResult[] } {
        if (this.state.gameOver) {
            return { success: false, message: 'Game is over!' };
        }

        if (this.state.currentGuess.length !== 5) {
            return { success: false, message: 'Word must be 5 letters!' };
        }

        if (!this.validWords.has(this.state.currentGuess)) {
            return { success: false, message: 'Not a valid word!' };
        }

        const result = this.evaluateGuess(this.state.currentGuess, this.state.targetWord);
        this.state.guesses.push(this.state.currentGuess);

        const won = this.state.currentGuess === this.state.targetWord;
        const lost = this.state.currentRow >= 5 && !won;

        if (won || lost) {
            this.state.gameOver = true;
            this.state.won = won;
        }

        this.state.currentRow++;
        this.state.currentGuess = '';

        return {
            success: true,
            result,
            message: won ? 'Correct! 🎉' : lost ? `Game Over! Word was: ${this.state.targetWord}` : undefined
        };
    }

    private evaluateGuess(guess: string, target: string): LetterResult[] {
        const result: LetterResult[] = [];
        const targetLetters = target.split('');
        const guessLetters = guess.split('');
        const used: boolean[] = new Array(5).fill(false);

        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = { letter: guessLetters[i], state: 'correct' };
                used[i] = true;
            }
        }

        // Second pass: mark present letters
        for (let i = 0; i < 5; i++) {
            if (result[i]) continue; // Already marked as correct

            const foundIndex = targetLetters.findIndex((letter, idx) =>
                letter === guessLetters[i] && !used[idx]
            );

            if (foundIndex !== -1) {
                result[i] = { letter: guessLetters[i], state: 'present' };
                used[foundIndex] = true;
            } else {
                result[i] = { letter: guessLetters[i], state: 'absent' };
            }
        }

        return result;
    }

    getState(): WordleGameState {
        return { ...this.state };
    }

    reset(): void {
        this.state = this.initializeGame();
    }
}

export interface LetterResult {
    letter: string;
    state: 'correct' | 'present' | 'absent';
}
