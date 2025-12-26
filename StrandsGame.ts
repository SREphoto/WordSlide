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
            { word: "PRECIPITATION", cells: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [6, 0], [7, 0]], isSpangram: true }
        ]
    },
    {
        theme: "KITCHEN TOOLS",
        gridLetters: [
            ['S', 'P', 'O', 'O', 'N', 'U'],
            ['L', 'E', 'T', 'A', 'R', 'T'],
            ['I', 'S', 'G', 'R', 'E', 'E'],
            ['N', 'I', 'F', 'E', 'K', 'N'],
            ['S', 'W', 'H', 'I', 'S', 'K'],
            ['U', 'T', 'E', 'N', 'S', 'I'],
            ['L', 'P', 'A', 'N', 'B', 'O'],
            ['W', 'L', 'K', 'E', 'T', 'T']
        ],
        words: [
            { word: "SPOON", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
            { word: "GRATER", cells: [[2, 2], [2, 3], [2, 4], [1, 4], [1, 3], [1, 2]] },
            { word: "KNIFE", cells: [[3, 5], [3, 4], [3, 3], [3, 2], [3, 1]] },
            { word: "WHISK", cells: [[4, 1], [4, 2], [4, 3], [4, 4], [4, 5]] },
            { word: "PAN", cells: [[6, 2], [6, 1], [7, 1]] },
            { word: "UTENSILS", cells: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [4, 0], [3, 0]], isSpangram: true }
        ]
    },
    {
        theme: "SPACE VOYAGE",
        gridLetters: [
            ['M', 'A', 'R', 'S', 'V', 'E'],
            ['C', 'O', 'M', 'E', 'T', 'N'],
            ['O', 'R', 'B', 'I', 'T', 'U'],
            ['G', 'A', 'L', 'A', 'C', 'S'],
            ['T', 'I', 'C', 'S', 'T', 'A'],
            ['R', 'P', 'L', 'U', 'T', 'O'],
            ['E', 'A', 'R', 'T', 'H', 'A'],
            ['E', 'N', 'U', 'S', 'M', 'O']
        ],
        words: [
            { word: "MARS", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
            { word: "COMET", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
            { word: "ORBIT", cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
            { word: "PLUTO", cells: [[5, 1], [5, 2], [5, 3], [5, 4], [5, 5]] },
            { word: "EARTH", cells: [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4]] },
            { word: "GALACTIC", cells: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [4, 2], [4, 1], [4, 0]], isSpangram: true }
        ]
    },
    {
        theme: "FLORAL FANTASY",
        gridLetters: [
            ['R', 'O', 'S', 'E', 'S', 'F'],
            ['T', 'U', 'L', 'I', 'P', 'L'],
            ['D', 'A', 'I', 'S', 'Y', 'O'],
            ['P', 'O', 'P', 'P', 'Y', 'W'],
            ['L', 'A', 'V', 'E', 'R', 'E'],
            ['B', 'L', 'O', 'S', 'S', 'R'],
            ['O', 'M', 'P', 'E', 'T', 'S'],
            ['F', 'L', 'O', 'W', 'E', 'R']
        ],
        words: [
            { word: "ROSES", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
            { word: "TULIP", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
            { word: "DAISY", cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
            { word: "POPPY", cells: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]] },
            { word: "FLOWER", cells: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], isSpangram: true }
        ]
    },
    {
        theme: "ANIMAL KINGDOM",
        gridLetters: [
            ['L', 'I', 'O', 'N', 'S', 'W'],
            ['T', 'I', 'G', 'E', 'R', 'I'],
            ['B', 'E', 'A', 'R', 'S', 'L'],
            ['W', 'O', 'L', 'V', 'E', 'D'],
            ['H', 'O', 'R', 'S', 'E', 'L'],
            ['C', 'A', 'T', 'S', 'D', 'I'],
            ['D', 'O', 'G', 'S', 'F', 'F'],
            ['W', 'I', 'L', 'D', 'L', 'I']
        ],
        words: [
            { word: "LIONS", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
            { word: "TIGER", cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
            { word: "BEARS", cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
            { word: "WILDLIFE", cells: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [6, 5], [5, 5]], isSpangram: true }
        ]
    }
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
