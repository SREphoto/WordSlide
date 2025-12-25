// Connections Game Module
// Inspired by NYT Connections

export interface ConnectionCategory {
    id: string;
    description: string;
    words: string[];
    level: 0 | 1 | 2 | 3; // 0: Yellow (Easiest), 1: Green, 2: Blue, 3: Purple (Hardest)
}

export interface ConnectionsGameState {
    grid: string[];
    selectedWords: string[];
    foundCategories: ConnectionCategory[];
    mistakesRemaining: number;
    gameOver: boolean;
    won: boolean;
}

const CATEGORY_DATA: ConnectionCategory[][] = [
    [
        { id: "c1", description: "WET WEATHER", words: ["RAIN", "MIST", "DEW", "FOG"], level: 0 },
        { id: "c2", description: "TYPES OF SHOES", words: ["BOOT", "PUMP", "SNEAKER", "MULE"], level: 1 },
        { id: "c3", description: "UNITS OF MEASURE", words: ["INCH", "OUNCE", "PINT", "FOOT"], level: 2 },
        { id: "c4", description: "___ OF THE WORLD", words: ["END", "TOP", "REST", "WAY"], level: 3 }
    ],
    [
        { id: "d1", description: "PARTS OF A TREE", words: ["ROOT", "LEAF", "BRANCH", "TRUNK"], level: 0 },
        { id: "d2", description: "CHESS PIECES", words: ["KING", "QUEEN", "ROOK", "BISHOP"], level: 1 },
        { id: "d3", description: "CLEANING TOOLS", words: ["MOP", "BROOM", "SPONGE", "DUSTER"], level: 2 },
        { id: "d4", description: "R-WORDS IN MUSIC", words: ["RAP", "ROCK", "REEL", "RAG"], level: 3 }
    ],
    // Add more puzzles if desired
];

export class ConnectionsGame {
    private categories: ConnectionCategory[];
    private grid: string[] = [];
    private selectedWords: string[] = [];
    private foundCategories: ConnectionCategory[] = [];
    private mistakesRemaining: number = 4;
    private gameOver: boolean = false;
    private won: boolean = false;

    constructor() {
        // Pick a random puzzle set
        const puzzleSet = CATEGORY_DATA[Math.floor(Math.random() * CATEGORY_DATA.length)];
        this.categories = puzzleSet;
        this.initializeGrid();
    }

    private initializeGrid() {
        this.grid = this.categories.flatMap(c => c.words).sort(() => Math.random() - 0.5);
    }

    toggleWord(word: string): boolean {
        if (this.gameOver) return false;

        const index = this.selectedWords.indexOf(word);
        if (index > -1) {
            this.selectedWords.splice(index, 1);
        } else if (this.selectedWords.length < 4) {
            this.selectedWords.push(word);
        } else {
            return false; // Already 4 selected
        }
        return true;
    }

    submitSelection(): { success: boolean, match?: ConnectionCategory, message: string, isOneAway?: boolean } {
        if (this.selectedWords.length !== 4) {
            return { success: false, message: "Select 4 words" };
        }

        // Check for match
        const match = this.categories.find(category =>
            this.selectedWords.every(word => category.words.includes(word))
        );

        if (match) {
            this.foundCategories.push(match);
            // Remove found words from grid
            this.grid = this.grid.filter(word => !this.selectedWords.includes(word));
            this.selectedWords = [];

            if (this.foundCategories.length === 4) {
                this.gameOver = true;
                this.won = true;
            }

            return { success: true, match, message: "Perfect!" };
        } else {
            // Check for "One Away"
            let maxOverlap = 0;
            this.categories.forEach(cat => {
                if (this.foundCategories.includes(cat)) return;
                const overlap = cat.words.filter(w => this.selectedWords.includes(w)).length;
                if (overlap > maxOverlap) maxOverlap = overlap;
            });

            this.mistakesRemaining--;
            if (this.mistakesRemaining === 0) {
                this.gameOver = true;
            }

            return {
                success: false,
                message: maxOverlap === 3 ? "One away..." : "Next time!",
                isOneAway: maxOverlap === 3
            };
        }
    }

    getState(): ConnectionsGameState {
        return {
            grid: this.grid,
            selectedWords: [...this.selectedWords],
            foundCategories: [...this.foundCategories],
            mistakesRemaining: this.mistakesRemaining,
            gameOver: this.gameOver,
            won: this.won
        };
    }

    getSolution(): ConnectionCategory[] {
        return this.categories;
    }
}
