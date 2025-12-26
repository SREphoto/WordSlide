// LiarDiceGame.ts
// Simplified Liar's Dice implementation.
// Two players (user vs computer). Each has 5 dice hidden.
// Player can bid (quantity, face) or call "liar".
// This is a minimal version for UI integration.

type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

type Bid = { count: number; face: DieFace };

export class LiarDiceGame {
    private playerDice: DieFace[] = [];
    private computerDice: DieFace[] = [];
    private currentBid: Bid | null = null;
    private playerTurn: boolean = true; // true = player, false = computer
    private gameOver: boolean = false;
    private message: string = '';

    constructor() {
        this.reset();
    }

    reset() {
        this.playerDice = this.rollDiceSet();
        this.computerDice = this.rollDiceSet();
        this.currentBid = null;
        this.playerTurn = true;
        this.gameOver = false;
        this.message = 'Your turn – place a bid.';
    }

    private rollDiceSet(): DieFace[] {
        const dice: DieFace[] = [];
        for (let i = 0; i < 5; i++) {
            dice.push((Math.floor(Math.random() * 6) + 1) as DieFace);
        }
        return dice;
    }

    // Player makes a bid.
    playerBid(bid: Bid): boolean {
        if (!this.playerTurn || this.gameOver) return false;
        if (this.isValidBid(bid)) {
            this.currentBid = bid;
            this.message = `You bid ${bid.count} x ${bid.face}. Computer's turn.`;
            this.playerTurn = false;
            // Computer will respond automatically via computerTurn()
            return true;
        }
        return false;
    }

    // Player calls liar.
    playerCallLiar(): { result: string; playerWon: boolean } | null {
        if (!this.playerTurn || this.gameOver) return null;
        const result = this.resolveLiarCall();
        this.gameOver = true;
        return result;
    }

    // Simple computer AI: either raise the bid or call liar.
    computerTurn(): void {
        if (this.playerTurn || this.gameOver) return;
        // Simple heuristic: if current bid is low, raise; else call liar.
        if (!this.currentBid) {
            // Start with a random bid.
            const bid: Bid = { count: 1, face: (Math.floor(Math.random() * 6) + 1) as DieFace };
            this.currentBid = bid;
            this.message = `Computer bids ${bid.count} x ${bid.face}. Your turn.`;
            this.playerTurn = true;
            return;
        }
        const { count, face } = this.currentBid;
        // Count of dice that could support the bid (including hidden dice)
        const possible = this.computerDice.filter(d => d === face).length + 1; // +1 for unknown player dice
        if (count < possible) {
            // Raise count
            const newBid: Bid = { count: count + 1, face };
            this.currentBid = newBid;
            this.message = `Computer raises to ${newBid.count} x ${newBid.face}. Your turn.`;
            this.playerTurn = true;
        } else {
            // Call liar
            const result = this.resolveLiarCall();
            this.gameOver = true;
            this.message = result.result;
        }
    }

    private isValidBid(bid: Bid): boolean {
        if (bid.count < 1 || bid.count > 10) return false;
        if (bid.face < 1 || bid.face > 6) return false;
        if (!this.currentBid) return true; // any first bid is ok
        // New bid must be higher: either higher count, or same count with higher face.
        if (bid.count > this.currentBid.count) return true;
        if (bid.count === this.currentBid.count && bid.face > this.currentBid.face) return true;
        return false;
    }

    private resolveLiarCall(): { result: string; playerWon: boolean } {
        // Count total dice showing the face of the last bid.
        if (!this.currentBid) {
            return { result: 'No bid to challenge.', playerWon: false };
        }
        const total = this.playerDice.filter(d => d === this.currentBid!.face).length +
            this.computerDice.filter(d => d === this.currentBid!.face).length;
        const liar = total < this.currentBid!.count;
        const playerWon = liar ? this.playerTurn : !this.playerTurn; // if liar called correctly, caller wins.
        const winner = playerWon ? 'You' : 'Computer';
        const detail = `Bid was ${this.currentBid!.count} x ${this.currentBid!.face}. Actual count: ${total}.`;
        return { result: `${winner} win! ${detail}`, playerWon };
    }

    getState() {
        return {
            playerDice: this.playerDice.slice(),
            computerDice: this.computerDice.slice(),
            currentBid: this.currentBid ? { ...this.currentBid } : null,
            playerTurn: this.playerTurn,
            gameOver: this.gameOver,
            message: this.message,
        };
    }
}
