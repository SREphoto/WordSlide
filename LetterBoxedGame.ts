// Letter Boxed Game Module
// Inspired by NYT Letter Boxed

export interface LetterBoxedGameState {
    sides: string[][]; // 4 sides, each with 3 letters
    foundWords: string[];
    usedLetters: Set<string>;
    allLetters: Set<string>;
    currentWord: string;
    lastLetter: string;
    gameOver: boolean;
}

export class LetterBoxedGame {
    private sides: string[][];
    private foundWords: string[] = [];
    private usedLetters: Set<string> = new Set();
    private allLetters: Set<string> = new Set();
    private currentWord: string = "";
    private lastLetter: string = "";
    private dictionary: Set<string>;

    constructor(fullDictionary: string[]) {
        // For simplicity, we define a fixed set of letters for now
        // A better version would generate valid boxes
        this.sides = [
            ['A', 'B', 'C'],
            ['D', 'E', 'F'],
            ['G', 'H', 'I'],
            ['J', 'K', 'L']
        ];

        // In a real implementation, we'd pick 12 letters that work
        // For this demo, let's use a known winnable set
        this.sides = [
            ['N', 'I', 'V'],
            ['E', 'T', 'L'],
            ['U', 'O', 'Y'],
            ['A', 'S', 'G']
        ];

        this.sides.forEach(side => side.forEach(l => this.allLetters.add(l)));
        this.dictionary = new Set(fullDictionary);
    }

    addLetter(letter: string): { success: boolean, message?: string } {
        letter = letter.toUpperCase();
        if (!this.allLetters.has(letter)) return { success: false, message: "Not in box" };

        const sideIndex = this.sides.findIndex(side => side.includes(letter));

        if (this.currentWord.length > 0) {
            const lastL = this.currentWord[this.currentWord.length - 1];
            const lastSideIndex = this.sides.findIndex(side => side.includes(lastL));
            if (sideIndex === lastSideIndex) {
                return { success: false, message: "Same side" };
            }
        } else if (this.lastLetter && letter !== this.lastLetter) {
            return { success: false, message: `Must start with ${this.lastLetter}` };
        }

        this.currentWord += letter;
        return { success: true };
    }

    submitWord(): { success: boolean, message: string } {
        if (this.currentWord.length < 3) {
            return { success: false, message: "Too short" };
        }

        const word = this.currentWord.toLowerCase();
        // Basic dictionary check (should be filtered for 3+ letters and box letters)
        if (!this.dictionary.has(word)) {
            return { success: false, message: "Not a word" };
        }

        this.foundWords.push(this.currentWord);
        [...this.currentWord].forEach(l => this.usedLetters.add(l));
        this.lastLetter = this.currentWord[this.currentWord.length - 1];
        this.currentWord = "";

        if (this.usedLetters.size === this.allLetters.size) {
            return { success: true, message: "You used all letters!" };
        }

        return { success: true, message: "Nice!" };
    }

    deleteLetter() {
        if (this.currentWord.length > 0) {
            this.currentWord = this.currentWord.slice(0, -1);
        }
    }

    getState(): LetterBoxedGameState {
        return {
            sides: this.sides,
            foundWords: [...this.foundWords],
            usedLetters: new Set(this.usedLetters),
            allLetters: new Set(this.allLetters),
            currentWord: this.currentWord,
            lastLetter: this.lastLetter,
            gameOver: this.usedLetters.size === this.allLetters.size
        };
    }
}
