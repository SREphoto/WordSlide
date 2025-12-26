// LockInGame.ts
// Simplified Lock‑In dice game implementation.
// The game uses 5 dice. Player rolls, then may "lock" any dice (keep them) and re‑roll the rest up to 3 times.
// After the final roll the score is the sum of the dice.

export class LockInGame {
    private dice: number[] = [];
    private locked: boolean[] = [];
    private rollsLeft: number = 3;
    private finalScore: number = 0;
    private gameOver: boolean = false;
    private message: string = 'Roll to start!';

    constructor() {
        this.reset();
    }

    reset() {
        this.dice = [0, 0, 0, 0, 0];
        this.locked = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.finalScore = 0;
        this.gameOver = false;
        this.message = 'Roll to start!';
    }

    roll(): { dice: number[]; rollsLeft: number; message: string } {
        if (this.gameOver) return { dice: this.dice, rollsLeft: this.rollsLeft, message: this.message };
        for (let i = 0; i < this.dice.length; i++) {
            if (!this.locked[i]) this.dice[i] = Math.floor(Math.random() * 6) + 1;
        }
        this.rollsLeft--;
        if (this.rollsLeft === 0) {
            this.gameOver = true;
            this.finalScore = this.dice.reduce((a, b) => a + b, 0);
            this.message = `Game over! Score: ${this.finalScore}`;
        } else {
            this.message = `Roll again or lock dice.`;
        }
        return { dice: this.dice.slice(), rollsLeft: this.rollsLeft, message: this.message };
    }

    toggleLock(index: number) {
        if (index < 0 || index >= this.locked.length || this.gameOver) return;
        this.locked[index] = !this.locked[index];
    }

    getState() {
        return {
            dice: this.dice.slice(),
            locked: this.locked.slice(),
            rollsLeft: this.rollsLeft,
            finalScore: this.finalScore,
            gameOver: this.gameOver,
            message: this.message,
        };
    }
}
