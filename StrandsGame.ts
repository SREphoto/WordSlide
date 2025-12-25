// Strands Game Module
// Inspired by NYT Strands

export interface StrandsCell {
    letter: string;
    row: number;
    col: number;
    isThemeWord: boolean;
    isSpangram: boolean;
    found: boolean;
}

export interface StrandsGameState {
    grid: StrandsCell[][];
    theme: string;
    foundWords: string[];
    spangramFound: boolean;
    gameOver: boolean;
}

interface StrandsPuzzle {
    theme: string;
    gridLetters: string[][];
    words: { word: string, cells: [number, number][], isSpangram?: boolean }[];
}

const PUZZLE_DATA: StrandsPuzzle[] = [
    {
        theme: "WET WEATHER",
        gridLetters: [
            ['R', 'A', 'I', 'N', 'Y', 'D'],
            ['S', 'T', 'O', 'R', 'M', 'E'],
            ['F', 'O', 'G', 'G', 'Y', 'W'],
            ['M', 'I', 'S', 'T', 'Y', 'C'],
            ['L', 'O', 'U', 'D', 'S', 'O'],
            ['P', 'R', 'E', 'C', 'I', 'L'],
            ['P', 'I', 'T', 'A', 'T', 'D'],
            ['I', 'O', 'N', 'S', 'U', 'N']
        ],
        words: [
            { word: "RAINY", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
            { word: "STORM", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
            { word: "FOGGY", cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
            { word: "MISTY", cells: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]] },
            { word: "CLOUDS", cells: [[3, 5], [4, 5], [4, 4], [4, 3], [4, 2], [4, 1]] },
            { word: "PRECIPITATION", cells: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [1, 5], [2, 5]], isSpangram: true }
        ]
    }
    // Note: Proper Strands puzzles require every letter to be used exactly once.
];

export class StrandsGame {
    private grid: StrandsCell[][];
    private theme: string;
    private puzzleWords: { word: string, cells: [number, number][], isSpangram?: boolean }[];
    private foundWords: string[] = [];
    private spangramFound: boolean = false;
    private gameOver: boolean = false;

    constructor() {
        const puzzle = PUZZLE_DATA[Math.floor(Math.random() * PUZZLE_DATA.length)];
        this.theme = puzzle.theme;
        this.puzzleWords = puzzle.words;

        this.grid = puzzle.gridLetters.map((row, r) =>
            row.map((letter, c) => ({
                letter,
                row: r,
                col: c,
                isThemeWord: false,
                isSpangram: false,
                found: false
            }))
        );
    }

    checkWord(cellCoords: [number, number][]): { success: boolean, word?: string, isSpangram?: boolean } {
        if (this.gameOver) return { success: false };

        const wordStr = cellCoords.map(([r, c]) => this.grid[r][c].letter).join('');
        const match = this.puzzleWords.find(pw => pw.word === wordStr && !this.foundWords.includes(wordStr));

        if (match) {
            this.foundWords.push(match.word);
            match.cells.forEach(([r, c]) => {
                this.grid[r][c].found = true;
                if (match.isSpangram) {
                    this.grid[r][c].isSpangram = true;
                    this.spangramFound = true;
                } else {
                    this.grid[r][c].isThemeWord = true;
                }
            });

            if (this.foundWords.length === this.puzzleWords.length) {
                this.gameOver = true;
            }

            return { success: true, word: match.word, isSpangram: match.isSpangram };
        }

        return { success: false };
    }

    getState(): StrandsGameState {
        return {
            grid: this.grid,
            theme: this.theme,
            foundWords: [...this.foundWords],
            spangramFound: this.spangramFound,
            gameOver: this.gameOver
        };
    }
}
