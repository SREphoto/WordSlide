// Tiles Game Module
// Inspired by NYT Tiles

export interface Tile {
    shape: 'circle' | 'square' | 'triangle' | 'star';
    color: 'red' | 'blue' | 'green' | 'yellow';
    id: number;
}

export interface TilesGameState {
    grid: (Tile | null)[][];
    layers: number;
    score: number;
    combo: number;
    selectedTile: { r: number, c: number } | null;
    gameOver: boolean;
}

export class TilesGame {
    private grid: (Tile | null)[][];
    private selectedTile: { r: number, c: number } | null = null;
    private score: number = 0;
    private combo: number = 0;
    private gameOver: boolean = false;

    constructor(rows: number = 4, cols: number = 4) {
        this.grid = Array(rows).fill(null).map(() =>
            Array(cols).fill(null).map(() => this.generateRandomTile())
        );
    }

    private generateRandomTile(): Tile {
        const shapes: Tile['shape'][] = ['circle', 'square', 'triangle', 'star'];
        const colors: Tile['color'][] = ['red', 'blue', 'green', 'yellow'];
        return {
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            id: Math.random()
        };
    }

    selectTile(r: number, c: number): { match: boolean, gameOver?: boolean } {
        if (this.gameOver || !this.grid[r][c]) return { match: false };

        if (!this.selectedTile) {
            this.selectedTile = { r, c };
            return { match: false };
        }

        const tileA = this.grid[this.selectedTile.r][this.selectedTile.c]!;
        const tileB = this.grid[r][c]!;

        if (this.selectedTile.r === r && this.selectedTile.c === c) {
            this.selectedTile = null;
            return { match: false };
        }

        if (tileA.shape === tileB.shape || tileA.color === tileB.color) {
            // Match!
            this.grid[this.selectedTile.r][this.selectedTile.c] = this.generateRandomTile(); // For now, just replace
            this.grid[r][c] = this.generateRandomTile();
            this.score += 10 * (this.combo + 1);
            this.combo++;
            this.selectedTile = null;
            return { match: true };
        } else {
            this.combo = 0;
            this.selectedTile = { r, c };
            return { match: false };
        }
    }

    getState(): TilesGameState {
        return {
            grid: this.grid.map(row => [...row]),
            layers: 1,
            score: this.score,
            combo: this.combo,
            selectedTile: this.selectedTile ? { ...this.selectedTile } : null,
            gameOver: this.gameOver
        };
    }
}
