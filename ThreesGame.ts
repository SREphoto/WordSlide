export interface ThreesGameState {
    keptDice: number[];
    currentRoll: number[];
    totalScore: number;
    gameOver: boolean;
    canRoll: boolean;
    message?: string;
}

export class ThreesGame {
    private keptDice: number[] = [];
    private currentRoll: number[] = [];
    private roundStartKeptCount: number = 0;
    private gameOver: boolean = false;
    private message: string = "Roll to start!";

    constructor() { }

    reset() {
        this.keptDice = [];
        this.currentRoll = [];
        this.roundStartKeptCount = 0;
        this.gameOver = false;
        this.message = "Roll to start!";
    }

    roll(): { success: boolean, message?: string } {
        if (this.gameOver) return { success: false, message: "Game Over" };

        // If not the first roll, check if user kept at least one die
        if (this.currentRoll.length > 0 && this.keptDice.length === this.roundStartKeptCount) {
            return { success: false, message: "You must keep at least one die!" };
        }

        // If we have 5 dice kept, game is done (should be caught by logic below, but safety check)
        if (this.keptDice.length === 5) {
            this.gameOver = true;
            return { success: true, message: "Game Finished!" };
        }

        this.roundStartKeptCount = this.keptDice.length;
        const numToRoll = 5 - this.keptDice.length;

        const roll: number[] = [];
        for (let i = 0; i < numToRoll; i++) {
            roll.push(Math.floor(Math.random() * 6) + 1);
        }
        this.currentRoll = roll;
        this.message = "Select dice to keep (Threes are 0!)";

        return { success: true };
    }

    keepDie(index: number): boolean {
        if (index < 0 || index >= this.currentRoll.length) return false;

        const die = this.currentRoll.splice(index, 1)[0];
        this.keptDice.push(die);

        // Auto-check end of game
        if (this.keptDice.length === 5) {
            this.gameOver = true;
            this.currentRoll = []; // Ensure empty
            this.message = `Game Over! Score: ${this.calculateScore()}`;
        }

        return true;
    }

    calculateScore(): number {
        return this.keptDice.reduce((sum, d) => sum + (d === 3 ? 0 : d), 0);
    }

    getState(): ThreesGameState {
        return {
            keptDice: [...this.keptDice],
            currentRoll: [...this.currentRoll],
            totalScore: this.calculateScore(),
            gameOver: this.gameOver,
            canRoll: !this.gameOver,
            message: this.message
        };
    }
}
