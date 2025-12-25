// Sudoku Game Module
// Inspired by NYT Sudoku

export interface SudokuGameState {
    grid: number[][]; // 0 for empty
    initialGrid: boolean[][]; // true if fixed
    solution: number[][];
    selectedCell: { r: number, c: number } | null;
    mistakes: number;
    gameOver: boolean;
    won: boolean;
}

export class SudokuGame {
    private grid: number[][];
    private initialGrid: boolean[][];
    private solution: number[][];
    private selectedCell: { r: number, c: number } | null = null;
    private mistakes: number = 0;
    private gameOver: boolean = false;
    private won: boolean = false;

    constructor(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
        const { puzzle, solution } = this.generatePuzzle(difficulty);
        this.grid = puzzle;
        this.solution = solution;
        this.initialGrid = puzzle.map(row => row.map(val => val !== 0));
    }

    private generatePuzzle(difficulty: string) {
        // For development, use a fixed puzzle
        // In production, we'd use a generator or a large bank
        const solution = [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ];

        const puzzle = solution.map(row => [...row]);
        // Remove numbers based on difficulty
        const toRemove = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
        let removed = 0;
        while (removed < toRemove) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] !== 0) {
                puzzle[r][c] = 0;
                removed++;
            }
        }

        return { puzzle, solution };
    }

    selectCell(r: number, c: number) {
        this.selectedCell = { r, c };
    }

    setCellValue(val: number): { success: boolean, mistake?: boolean, gameOver?: boolean, won?: boolean } {
        if (!this.selectedCell || this.gameOver) return { success: false };
        const { r, c } = this.selectedCell;

        if (this.initialGrid[r][c]) return { success: false };

        if (this.solution[r][c] === val) {
            this.grid[r][c] = val;

            // Check win
            const isFull = this.grid.every(row => row.every(v => v !== 0));
            if (isFull) {
                this.gameOver = true;
                this.won = true;
                return { success: true, won: true };
            }
            return { success: true };
        } else {
            this.mistakes++;
            if (this.mistakes >= 3) {
                this.gameOver = true;
                return { success: false, mistake: true, gameOver: true };
            }
            return { success: false, mistake: true };
        }
    }

    getState(): SudokuGameState {
        return {
            grid: this.grid.map(row => [...row]),
            initialGrid: this.initialGrid.map(row => [...row]),
            solution: this.solution,
            selectedCell: this.selectedCell ? { ...this.selectedCell } : null,
            mistakes: this.mistakes,
            gameOver: this.gameOver,
            won: this.won
        };
    }
}
