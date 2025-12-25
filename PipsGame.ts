// Pips Game Module
// A dice matching puzzle

export interface Die {
    val: number;
    id: number;
    removed: boolean;
}

export interface PipsGameState {
    grid: (Die | null)[][];
    selectedDie: { r: number, c: number } | null;
    moves: number;
    gameOver: boolean;
    won: boolean;
}

export class PipsGame {
    private grid: (Die | null)[][];
    private selectedDie: { r: number, c: number } | null = null;
    private moves: number = 0;
    private gameOver: boolean = false;
    private won: boolean = false;

    constructor(rows: number = 4, cols: number = 4) {
        this.grid = Array(rows).fill(null).map(() =>
            Array(cols).fill(null).map(() => ({
                val: Math.floor(Math.random() * 6) + 1,
                id: Math.random(),
                removed: false
            }))
        );
    }

    selectDie(r: number, c: number): { match: boolean, won?: boolean } {
        if (this.gameOver || !this.grid[r][c] || this.grid[r][c]!.removed) return { match: false };

        if (!this.selectedDie) {
            this.selectedDie = { r, c };
            return { match: false };
        }

        const dieA = this.grid[this.selectedDie.r][this.selectedDie.c]!;
        const dieB = this.grid[r][c]!;

        if (this.selectedDie.r === r && this.selectedDie.c === c) {
            this.selectedDie = null;
            return { match: false };
        }

        if (dieA.val + dieB.val === 7) {
            // Match!
            dieA.removed = true;
            dieB.removed = true;
            this.moves++;
            this.selectedDie = null;

            // Check win
            const allRemoved = this.grid.every(row => row.every(die => !die || die.removed));
            if (allRemoved) {
                this.gameOver = true;
                this.won = true;
                return { match: true, won: true };
            }
            return { match: true };
        } else {
            this.selectedDie = { r, c };
            return { match: false };
        }
    }

    getState(): PipsGameState {
        return {
            grid: this.grid.map(row => row.map(die => die ? { ...die } : null)),
            selectedDie: this.selectedDie ? { ...this.selectedDie } : null,
            moves: this.moves,
            gameOver: this.gameOver,
            won: this.won
        };
    }
}
