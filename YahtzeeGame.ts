// YahtzeeGame.ts
// Simplified Yahtzee implementation for WordSlide.
// This class manages dice rolls, holds, and scoring categories.
// It is intentionally minimal; UI integration will handle detailed scoring UI.

export type YahtzeeCategory =
    | 'ones'
    | 'twos'
    | 'threes'
    | 'fours'
    | 'fives'
    | 'sixes'
    | 'threeOfKind'
    | 'fourOfKind'
    | 'fullHouse'
    | 'smallStraight'
    | 'largeStraight'
    | 'yahtzee'
    | 'chance';

interface ScoreCard {
    [key in YahtzeeCategory]?: number;
}

export class YahtzeeGame {
    private dice: number[] = [];
    private held: boolean[] = [];
    private rollsLeft: number = 3;
    private scoreCard: ScoreCard = {};
    private turnOver: boolean = false;

    constructor() {
        this.reset();
    }

    reset() {
        this.dice = [0, 0, 0, 0, 0];
        this.held = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.scoreCard = {};
        this.turnOver = false;
    }

    // Roll dice that are not held.
    roll(): { dice: number[]; rollsLeft: number } {
        if (this.turnOver) return { dice: this.dice, rollsLeft: this.rollsLeft };
        if (this.rollsLeft <= 0) return { dice: this.dice, rollsLeft: this.rollsLeft };
        for (let i = 0; i < this.dice.length; i++) {
            if (!this.held[i]) {
                this.dice[i] = Math.floor(Math.random() * 6) + 1;
            }
        }
        this.rollsLeft--;
        if (this.rollsLeft === 0) this.turnOver = true;
        return { dice: this.dice.slice(), rollsLeft: this.rollsLeft };
    }

    // Toggle hold on a die index (0‑based).
    toggleHold(index: number) {
        if (index < 0 || index >= this.held.length) return;
        if (this.turnOver) return;
        this.held[index] = !this.held[index];
    }

    // Score a category with the current dice.
    // Returns points earned or null if category already used.
    score(category: YahtzeeCategory): number | null {
        if (this.scoreCard[category] !== undefined) return null; // already scored
        const points = this.calculateCategoryPoints(category);
        this.scoreCard[category] = points;
        // End turn
        this.turnOver = true;
        return points;
    }

    // Helper to compute points for a category.
    private calculateCategoryPoints(category: YahtzeeCategory): number {
        const counts = new Array(7).fill(0); // index 1‑6
        for (const d of this.dice) counts[d]++;
        switch (category) {
            case 'ones': return counts[1] * 1;
            case 'twos': return counts[2] * 2;
            case 'threes': return counts[3] * 3;
            case 'fours': return counts[4] * 4;
            case 'fives': return counts[5] * 5;
            case 'sixes': return counts[6] * 6;
            case 'threeOfKind':
                return counts.some(c => c >= 3) ? this.dice.reduce((a, b) => a + b, 0) : 0;
            case 'fourOfKind':
                return counts.some(c => c >= 4) ? this.dice.reduce((a, b) => a + b, 0) : 0;
            case 'fullHouse':
                return counts.includes(3) && counts.includes(2) ? 25 : 0;
            case 'smallStraight':
                return (counts[1] && counts[2] && counts[3] && counts[4]) ||
                    (counts[2] && counts[3] && counts[4] && counts[5]) ||
                    (counts[3] && counts[4] && counts[5] && counts[6]) ? 30 : 0;
            case 'largeStraight':
                return (counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) ||
                    (counts[2] && counts[3] && counts[4] && counts[5] && counts[6]) ? 40 : 0;
            case 'yahtzee':
                return counts.some(c => c === 5) ? 50 : 0;
            case 'chance':
                return this.dice.reduce((a, b) => a + b, 0);
            default:
                return 0;
        }
    }

    getState() {
        return {
            dice: this.dice.slice(),
            held: this.held.slice(),
            rollsLeft: this.rollsLeft,
            scoreCard: { ...this.scoreCard },
            turnOver: this.turnOver,
        };
    }
}
