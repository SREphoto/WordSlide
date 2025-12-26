
export interface SevensGameState {
    dice: number[];
    selectedIndices: number[];
    score: number;
    gameOver: boolean;
    rollCount: number;
    message: string;
}

export class SevensGame {
    private dice: number[] = [];
    private score: number = 0;
    private gameOver: boolean = false;
    private message: string = "Roll to start!";
    private rollCount: number = 0;
    private numDice: number = 6;

    constructor() { }

    reset() {
        this.dice = [];
        this.score = 0;
        this.gameOver = false;
        this.message = "Roll to start!";
        this.rollCount = 0;
        this.numDice = 6;
    }

    roll(): void {
        if (this.gameOver) return;

        this.dice = [];
        for (let i = 0; i < this.numDice; i++) {
            this.dice.push(Math.floor(Math.random() * 6) + 1);
        }
        this.rollCount++;

        // Auto-check if any 7s are possible? 
        // Or let user find them? 
        // For a casual game, let's just let the user select.
        // But we need to know if they are stuck.

        if (!this.canMakeSeven(this.dice)) {
            // No moves possible. Game over (for this round/turn).
            this.calculateFinalScore();
            this.gameOver = true;
            this.message = `No more 7s possible! Final Score: ${this.score}`;
        } else {
            this.message = "Select combinations adding to 7";
        }
    }

    removeDice(indices: number[]): { success: boolean, message?: string } {
        if (this.gameOver) return { success: false, message: "Game Over" };

        const selectedValues = indices.map(i => this.dice[i]);
        const sum = selectedValues.reduce((a, b) => a + b, 0);

        if (sum === 7) {
            // Remove acceptable
            // Filter out used dice. 
            // We need to be careful about indices shifting if we splice. 
            // Better to recreate the dice array.
            const newDice = this.dice.filter((_, i) => !indices.includes(i));
            this.dice = newDice;
            this.numDice = this.dice.length;

            if (this.dice.length === 0) {
                this.gameOver = true;
                this.score = 0;
                this.message = "Cleared all dice! Score: 0 (Perfect!)";
            } else {
                if (!this.canMakeSeven(this.dice)) {
                    this.calculateFinalScore();
                    this.gameOver = true;
                    this.message = `No more 7s possible! Final Score: ${this.score}`;
                } else {
                    this.message = "Select more 7s or remove these and roll?";
                    // Actually usually you remove 7s then you MUST roll remaining? 
                    // Or you clear as many 7s from ONE roll as possible?
                    // "Remove any combination totalling 7. Continue removing until no more 7s. Then Score remaining."
                    // If it's "Roll -> Remove -> Roll", that's different.
                    // Common rule: "Roll 6 dice. Remove sets of 7. Reroll remaining. Repeat until no 7s can be made."
                    // Let's go with "Remove valid set -> Auto Roll remaining or simple state update?"
                    // Let's act like Threes/Farkle: The user removes a set, we verify, then we update state.
                    // Does the user roll again automatically?
                    // Let's assume: You roll. You remove ALL possible 7s from that roll.
                    // If you can't remove any, you are done?
                    // Or: Remove a 7. You can remove multiple 7s from one roll.
                    // Once you are done removing from this roll, you roll remaining dice? 
                    // Let's implement: Select -> Remove. If dice left, User must Roll again.
                }
            }
            return { success: true };
        } else {
            return { success: false, message: `Sum is ${sum}, must be 7!` };
        }
    }

    private calculateFinalScore() {
        this.score = this.dice.reduce((a, b) => a + b, 0);
    }

    // Helper to check if any subset sums to 7
    private canMakeSeven(dice: number[]): boolean {
        // Simple recursive check or power set check. 
        // Max 6 dice, 2^6 = 64 subsets. Fast enough.
        const n = dice.length;
        for (let i = 1; i < (1 << n); i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if ((i >> j) & 1) sum += dice[j];
            }
            if (sum === 7) return true;
        }
        return false;
    }

    getState(): SevensGameState {
        return {
            dice: [...this.dice],
            selectedIndices: [], // Managed by UI mostly, but could be here
            score: this.score,
            gameOver: this.gameOver,
            rollCount: this.rollCount,
            message: this.message
        };
    }
}
