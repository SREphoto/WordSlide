// 3's are Green Dice Game Module

export interface ThreesGameState {
    keptDice: number[];
    currentRoll: number[];
    totalScore: number;
    gameOver: boolean;
    canRoll: boolean;
}

export class ThreesGame {
    private keptDice: number[] = [];
    private currentRoll: number[] = [];
    private gameOver: boolean = false;

    constructor() { }

    roll(): number[] {
        if (this.gameOver || this.keptDice.length === 5) return [];

        const numToRoll = 5 - this.keptDice.length;
        const roll: number[] = [];
        for (let i = 0; i < numToRoll; i++) {
            roll.push(Math.floor(Math.random() * 6) + 1);
        }
        this.currentRoll = roll;
        return roll;
    }

    keepDie(index: number): boolean {
        if (index < 0 || index >= this.currentRoll.length) return false;

        const die = this.currentRoll.splice(index, 1)[0];
        this.keptDice.push(die);

        if (this.keptDice.length === 5) {
            this.gameOver = true;
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
            canRoll: this.currentRoll.length === 0 && this.keptDice.length < 5
        };
    }
}
