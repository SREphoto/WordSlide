// Farkle (10,000) Dice Game Module

export interface FarkleGameState {
    totalScore: number;
    turnScore: number;
    heldDice: number[];
    remainingDiceCount: number;
    lastRoll: number[];
    canStop: boolean;
    gameOver: boolean;
    farkled: boolean;
}

export class FarkleGame {
    private totalScore: number = 0;
    private turnScore: number = 0;
    private remainingDiceCount: number = 6;
    private lastRoll: number[] = [];
    private gameOver: boolean = false;
    private farkled: boolean = false;

    constructor() { }

    roll(): { dice: number[], farkle: boolean } {
        if (this.gameOver) return { dice: [], farkle: false };

        const dice: number[] = [];
        for (let i = 0; i < this.remainingDiceCount; i++) {
            dice.push(Math.floor(Math.random() * 6) + 1);
        }

        this.lastRoll = dice;
        const scoreInfo = this.calculatePotentialScore(dice);

        if (scoreInfo.score === 0) {
            this.farkle();
            return { dice, farkle: true };
        }

        this.farkled = false;
        return { dice, farkle: false };
    }

    private farkle() {
        this.turnScore = 0;
        this.remainingDiceCount = 6;
        this.farkled = true;
    }

    holdDice(indices: number[]): { score: number, valid: boolean } {
        const selected = indices.map(i => this.lastRoll[i]);
        const scoreInfo = this.calculatePotentialScore(selected);

        if (scoreInfo.score > 0 && scoreInfo.usedAll) {
            this.turnScore += scoreInfo.score;
            this.remainingDiceCount -= selected.length;
            if (this.remainingDiceCount === 0) this.remainingDiceCount = 6; // Hot dice
            return { score: scoreInfo.score, valid: true };
        }
        return { score: 0, valid: false };
    }

    stop(): number {
        this.totalScore += this.turnScore;
        const finalTurnScore = this.turnScore;
        this.turnScore = 0;
        this.remainingDiceCount = 6;
        if (this.totalScore >= 10000) {
            this.gameOver = true;
        }
        return finalTurnScore;
    }

    public calculatePotentialScore(dice: number[]): { score: number, usedAll: boolean } {
        const counts: Record<number, number> = {};
        dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

        let score = 0;
        let usedCount = 0;

        // Straights
        if (Object.keys(counts).length === 6) return { score: 1500, usedAll: true };

        // 3 pairs
        const pairs = Object.values(counts).filter(c => c === 2).length;
        if (pairs === 3) return { score: 750, usedAll: true };

        // Triplets and individual 1s/5s
        for (let d = 1; d <= 6; d++) {
            const count = counts[d] || 0;
            if (count >= 3) {
                if (d === 1) score += 1000 * Math.pow(2, count - 3);
                else score += d * 100 * Math.pow(2, count - 3);
                usedCount += count;
            } else {
                if (d === 1) { score += count * 100; usedCount += count; }
                if (d === 5) { score += count * 50; usedCount += count; }
            }
        }

        return { score, usedAll: usedCount === dice.length };
    }

    getState(): FarkleGameState {
        return {
            totalScore: this.totalScore,
            turnScore: this.turnScore,
            heldDice: [], // Not fully implemented in state yet
            remainingDiceCount: this.remainingDiceCount,
            lastRoll: this.lastRoll,
            canStop: this.turnScore >= 300 || (this.totalScore > 0 && this.turnScore > 0),
            gameOver: this.gameOver,
            farkled: this.farkled
        };
    }
}
