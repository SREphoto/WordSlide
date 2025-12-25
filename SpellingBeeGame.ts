// Spelling Bee Game Module
// Inspired by NYT Spelling Bee

export interface SpellingBeeState {
    centerLetter: string;
    outerLetters: string[];
    foundWords: string[];
    totalWords: number;
    maxScore: number;
    currentScore: number;
    rank: string;
}

export class SpellingBeeGame {
    private centerLetter: string = '';
    private outerLetters: string[] = [];
    private allValidWords: Set<string> = new Set();
    private foundWords: Set<string> = new Set();
    private dictionary: Set<string>;

    constructor(dictionary: string[]) {
        this.dictionary = new Set(dictionary.map(w => w.toUpperCase()));
        this.initializeGame();
    }

    private initializeGame() {
        // Find a suitable "pangram" to derive the letters from
        // A pangram in Spelling Bee contains at least 7 unique letters
        const pangrams = Array.from(this.dictionary).filter(w => {
            const unique = new Set(w.split('')).size;
            return unique === 7 && w.length >= 7;
        });

        if (pangrams.length === 0) {
            // Fallback letters if no 7-letter unique word found
            const fallback = "HONEYED".split('');
            this.setupLetters(fallback);
        } else {
            const chosenPangram = pangrams[Math.floor(Math.random() * pangrams.length)];
            const uniqueLetters = Array.from(new Set(chosenPangram.split('')));
            this.setupLetters(uniqueLetters);
        }
    }

    private setupLetters(uniqueLetters: string[]) {
        // Shuffle and pick a center letter
        const shuffled = uniqueLetters.sort(() => Math.random() - 0.5);
        this.centerLetter = shuffled[0];
        this.outerLetters = shuffled.slice(1);

        // Pre-calculate all valid words from dictionary for this set
        this.allValidWords.clear();
        this.dictionary.forEach(word => {
            if (this.isValidForSet(word)) {
                this.allValidWords.add(word);
            }
        });
    }

    private isValidForSet(word: string): boolean {
        if (word.length < 4) return false;
        if (!word.includes(this.centerLetter)) return false;

        const letterSet = new Set([this.centerLetter, ...this.outerLetters]);
        for (const char of word) {
            if (!letterSet.has(char)) return false;
        }
        return true;
    }

    submitWord(word: string): { success: boolean, message: string, score?: number } {
        const upperWord = word.toUpperCase();

        if (upperWord.length < 4) {
            return { success: false, message: "Too short" };
        }
        if (!upperWord.includes(this.centerLetter)) {
            return { success: false, message: "Missing center letter" };
        }
        if (this.foundWords.has(upperWord)) {
            return { success: false, message: "Already found" };
        }
        if (!this.allValidWords.has(upperWord)) {
            return { success: false, message: "Not in word list" };
        }

        this.foundWords.add(upperWord);
        const score = this.calculateWordScore(upperWord);

        let message = "Nice!";
        const uniqueInWord = new Set(upperWord.split('')).size;
        if (uniqueInWord === 7) message = "Pangram! 🐝";

        return { success: true, message, score };
    }

    private calculateWordScore(word: string): number {
        if (word.length === 4) return 1;

        let score = word.length;
        const uniqueLetters = new Set(word.split('')).size;
        if (uniqueLetters === 7) score += 7; // Pangram bonus

        return score;
    }

    getState(): SpellingBeeState {
        const currentScore = Array.from(this.foundWords).reduce((sum, word) => sum + this.calculateWordScore(word), 0);
        const maxScore = Array.from(this.allValidWords).reduce((sum, word) => sum + this.calculateWordScore(word), 0);

        return {
            centerLetter: this.centerLetter,
            outerLetters: this.outerLetters,
            foundWords: Array.from(this.foundWords).sort(),
            totalWords: this.allValidWords.size,
            maxScore: maxScore,
            currentScore: currentScore,
            rank: this.getRank(currentScore, maxScore)
        };
    }

    private getRank(score: number, max: number): string {
        const ratio = score / max;
        if (ratio === 0) return "Beginner";
        if (ratio < 0.05) return "Good Start";
        if (ratio < 0.1) return "Moving Up";
        if (ratio < 0.2) return "Good";
        if (ratio < 0.3) return "Solid";
        if (ratio < 0.4) return "Nice";
        if (ratio < 0.5) return "Great";
        if (ratio < 0.7) return "Amazing";
        if (ratio < 0.9) return "Genius";
        return "Queen Bee";
    }

    shuffleOuterLetters() {
        this.outerLetters.sort(() => Math.random() - 0.5);
    }
}
