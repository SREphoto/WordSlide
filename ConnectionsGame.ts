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
    [
        { id: "e1", description: "BREAD TYPES", words: ["RYE", "SODA", "PITA", "NAAN"], level: 0 },
        { id: "e2", description: "BIRDS", words: ["ROBIN", "FINCH", "SWIFT", "JAY"], level: 1 },
        { id: "e3", description: "MATHEMATICAL TERMS", words: ["MEAN", "ROOT", "SINE", "PLOT"], level: 2 },
        { id: "e4", description: "STAR ___", words: ["FISH", "GAZE", "TREK", "DUST"], level: 3 }
    ],
    [
        { id: "f1", description: "COFFEE ORDERS", words: ["LATTE", "MOCHA", "DECAF", "ICED"], level: 0 },
        { id: "f2", description: "KINDS OF METAL", words: ["GOLD", "IRON", "TIN", "LEAD"], level: 1 },
        { id: "f3", description: "PARTS OF A CAR", words: ["HOOD", "TIRE", "DOOR", "VENT"], level: 2 },
        { id: "f4", description: "COLLECTIVE NOUNS", words: ["PRIDE", "HERD", "PACK", "GANG"], level: 3 }
    ],
    [
        { id: "g1", description: "DESSERTS", words: ["CAKE", "PIE", "TART", "FLAN"], level: 0 },
        { id: "g2", description: "HALLOWEEN SYMBOLS", words: ["BAT", "GHOST", "WITCH", "PUMP"], level: 1 },
        { id: "g3", description: "GEOMETRIC SHAPES", words: ["CONE", "CUBE", "LINE", "OVAL"], level: 2 },
        { id: "g4", description: "ENDS IN -HOUSE", words: ["WARE", "LIGHT", "PLAY", "TREE"], level: 3 }
    ],
    [
        { id: "h1", description: "KINDS OF WIND", words: ["BREEZE", "GALE", "GUST", "ZEPHYR"], level: 0 },
        { id: "h2", description: "MUSICAL INSTRUMENTS", words: ["CELLO", "HARP", "LUTE", "OBOE"], level: 1 },
        { id: "h3", description: "FLIGHTLESS BIRDS", words: ["EMU", "KIWI", "PENGUIN", "RHEA"], level: 2 },
        { id: "h4", description: "STARTS WITH 'P'", words: ["PLANE", "PLATE", "PLUM", "PLUS"], level: 3 }
    ],
    [
        { id: "i1", description: "MEASUREMENT UNITS", words: ["FOOT", "MILE", "YARD", "INCH"], level: 0 },
        { id: "i2", description: "COMPUTER COMPONENTS", words: ["CHIP", "DISK", "RAM", "CORE"], level: 1 },
        { id: "i3", description: "STREAMS OF WATER", words: ["BROOK", "CREEK", "RIVER", "RUN"], level: 2 },
        { id: "i4", description: "ENDS IN -BELL", words: ["BLUE", "DOOR", "DUMB", "FIRE"], level: 3 }
    ],
    [
        { id: "j1", description: "TYPES OF TEA", words: ["BLACK", "GREEN", "HERBAL", "WHITE"], level: 0 },
        { id: "j2", description: "DANCE STYLES", words: ["SALSA", "SWING", "TANGO", "WALTZ"], level: 1 },
        { id: "j3", description: "CHESS TERMS", words: ["CHECK", "MATE", "PAWN", "STALE"], level: 2 },
        { id: "j4", description: "PALINDROMES", words: ["KAYAK", "LEVEL", "RADAR", "STATS"], level: 3 }
    ]
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
