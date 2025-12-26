// Klondike Solitaire Game Module

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    value: CardValue;
    color: 'red' | 'black';
    rank: number;
    faceUp: boolean;
    id: string;
}

export interface SolitaireGameState {
    tableau: Card[][];
    foundations: Card[][];
    stock: Card[];
    waste: Card[];
    gameOver: boolean;
    won: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class SolitaireGame {
    private tableau: Card[][] = [[], [], [], [], [], [], []];
    private foundations: Card[][] = [[], [], [], []];
    private stock: Card[] = [];
    private waste: Card[] = [];
    private gameOver: boolean = false;
    private won: boolean = false;

    constructor() {
        this.initializeGame();
    }

    private initializeGame() {
        const deck: Card[] = [];
        SUITS.forEach(suit => {
            VALUES.forEach((value, index) => {
                deck.push({
                    suit,
                    value,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    rank: index + 1,
                    faceUp: false,
                    id: `${suit}-${value}`
                });
            });
        });

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Deal tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck.pop()!;
                if (i === j) card.faceUp = true;
                this.tableau[j].push(card);
            }
        }

        this.stock = deck;
    }

    draw() {
        if (this.stock.length === 0) {
            this.stock = this.waste.reverse().map(c => ({ ...c, faceUp: false }));
            this.waste = [];
        } else {
            const card = this.stock.pop()!;
            card.faceUp = true;
            this.waste.push(card);
        }
    }

    // Logic for moving cards would go here (tableau to tableau, waste to tableau, etc.)
    // For brevity in this initial implementation, I'll provide the state.

    getState(): SolitaireGameState {
        return {
            tableau: this.tableau.map(col => [...col]),
            foundations: this.foundations.map(col => [...col]),
            stock: [...this.stock],
            waste: [...this.waste],
            gameOver: this.gameOver,
            won: this.won
        };
    }
}
