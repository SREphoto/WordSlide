// Left Right Center (LRC) Dice Game Module

export type LRCSide = 'L' | 'R' | 'C' | 'DOT';

export interface Player {
    id: number;
    name: string;
    chips: number;
    isComputer: boolean;
    isEliminated: boolean;
}

export interface LRCGameState {
    players: Player[];
    currentPlayerIndex: number;
    pot: number;
    lastRoll: LRCSide[];
    gameOver: boolean;
    winner: Player | null;
    log: string[];
}

export class LRCGame {
    private players: Player[];
    private currentPlayerIndex: number = 0;
    private pot: number = 0;
    private lastRoll: LRCSide[] = [];
    private gameOver: boolean = false;
    private winner: Player | null = null;
    private log: string[] = [];

    constructor(numPlayers: number = 4) {
        this.players = [];
        for (let i = 0; i < numPlayers; i++) {
            this.players.push({
                id: i,
                name: i === 0 ? "You" : `Computer ${i}`,
                chips: 3,
                isComputer: i !== 0,
                isEliminated: false
            });
        }
    }

    roll(): { sides: LRCSide[], message: string } {
        if (this.gameOver) return { sides: [], message: "Game Over" };

        const player = this.players[this.currentPlayerIndex];
        const numDice = Math.min(player.chips, 3);
        const sides: LRCSide[] = [];
        const rollMap: Record<number, LRCSide> = {
            1: 'L',
            2: 'C',
            3: 'R',
            4: 'DOT',
            5: 'DOT',
            6: 'DOT'
        };

        for (let i = 0; i < numDice; i++) {
            const val = Math.floor(Math.random() * 6) + 1;
            sides.push(rollMap[val]);
        }

        this.lastRoll = sides;
        this.processRoll(sides);

        const msg = `${player.name} rolled: ${sides.join(', ')}`;
        this.log.unshift(msg);

        this.checkWinCondition();
        if (!this.gameOver) {
            this.nextTurn();
        }

        return { sides, message: msg };
    }

    private processRoll(sides: LRCSide[]) {
        const player = this.players[this.currentPlayerIndex];
        const leftPlayerIndex = (this.currentPlayerIndex + this.players.length - 1) % this.players.length;
        const rightPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        sides.forEach(side => {
            if (side === 'L') {
                player.chips--;
                this.players[leftPlayerIndex].chips++;
            } else if (side === 'R') {
                player.chips--;
                this.players[rightPlayerIndex].chips++;
            } else if (side === 'C') {
                player.chips--;
                this.pot++;
            }
        });
    }

    private nextTurn() {
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].chips === 0 && this.countPlayersWithChips() > 1);
    }

    private countPlayersWithChips(): number {
        return this.players.filter(p => p.chips > 0).length;
    }

    private checkWinCondition() {
        const activePlayers = this.players.filter(p => p.chips > 0);
        if (activePlayers.length === 1 && this.players.every(p => p.chips > 0 || p.chips === 0)) {
            // If only one player has chips, but they might need to finish their turn?
            // Actually in LRC, if only one player has chips, they win the pot.
            // But wait, players with 0 chips stay in the game because they can receive chips.
            // The game ends when only one person has chips LEFT.
            if (activePlayers.length === 1) {
                this.gameOver = true;
                this.winner = activePlayers[0];
                this.winner.chips += this.pot;
                this.pot = 0;
                this.log.unshift(`${this.winner.name} wins the game!`);
            }
        }
    }

    getState(): LRCGameState {
        return {
            players: this.players.map(p => ({ ...p })),
            currentPlayerIndex: this.currentPlayerIndex,
            pot: this.pot,
            lastRoll: [...this.lastRoll],
            gameOver: this.gameOver,
            winner: this.winner ? { ...this.winner } : null,
            log: [...this.log].slice(0, 10)
        };
    }
}
