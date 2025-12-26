// ZanzibarGame.ts
// Simplified placeholder implementation for the Zanzibar dice game.
// The game uses 5 dice. Player rolls, can select dice to keep, and re-roll remaining up to 3 times.
// Scoring is minimal: sum of kept dice after final roll.

export class ZanzibarGame {
    private dice: number[] = [];
    private kept: boolean[] = [];
    private rollsLeft: number = 3;
    private finalScore: number = 0;
    private gameOver: boolean = false;
    private message: string = 'Roll to start!';

    constructor() {
        this.reset();
    }

    reset() {
        this.dice = [0, 0, 0, 0, 0];
        this.kept = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.finalScore = 0;
        this.gameOver = false;
        this.message = 'Roll to start!';
    }

    roll(): { dice: number[]; rollsLeft: number; message: string } {
        if (this.gameOver) return { dice: this.dice, rollsLeft: this.rollsLeft, message: this.message };
        for (let i = 0; i < this.dice.length; i++) {
            if (!this.kept[i]) this.dice[i] = Math.floor(Math.random() * 6) + 1;
        }
        this.rollsLeft--;
        if (this.rollsLeft === 0) {
            this.gameOver = true;
            this.finalScore = this.dice.reduce((a, b) => a + b, 0);
            this.message = `Game over! Score: ${this.finalScore}`;
        } else {
            this.message = `Roll again or keep dice.`;
        }
        return { dice: this.dice.slice(), rollsLeft: this.rollsLeft, message: this.message };
    }

    toggleKeep(index: number) {
        if (index < 0 || index >= this.kept.length || this.gameOver) return;
        this.kept[index] = !this.kept[index];
    }

    getState() {
        return {
            dice: this.dice.slice(),
            kept: this.kept.slice(),
            rollsLeft: this.rollsLeft,
            finalScore: this.finalScore,
            gameOver: this.gameOver,
            message: this.message,
        };
    }
}
