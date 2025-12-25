
// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SoundManager } from "./SoundManager";
import { DictionaryManager } from "./DictionaryManager";
import { WordleGame, type LetterResult } from "./WordleGame";
import { SpellingBeeGame } from "./SpellingBeeGame";
import { ConnectionsGame } from "./ConnectionsGame";
import { StrandsGame } from "./StrandsGame";
import { LetterBoxedGame } from "./LetterBoxedGame";
import { SudokuGame } from "./SudokuGame";
import { TilesGame } from "./TilesGame";
import { PipsGame } from "./PipsGame";

// --- Interfaces ---
interface LevelDefinition {
    id: string; // e.g., "outback-1"
    worldId: string;
    levelInWorld: number; // 1-indexed
    displayName: string; // e.g., "Level 1"
    letters: string[];
    targetWords: string[]; // Words to find for the level
    unlocked: boolean;
    completed: boolean;
}

interface WorldDefinition {
    id: string; // e.g., "outback"
    name: string; // e.g., "OUTBACK"
    themeColorVar: string; // CSS variable for background, e.g., '--world-outback-bg'
    levels: LevelDefinition[];
    isGenerated?: boolean; // Flag for generated worlds
}

interface GeminiLevelResponse {
    letters: string[];
    targetWords: string[];
}
interface GeminiWorldResponse {
    worldName: string;
    levels: GeminiLevelResponse[];
}

interface ShopItem {
    id: string;
    type: 'currency' | 'bundle' | 'special' | 'theme';
    name: string;
    description?: string; // For currency, e.g. "Coins"
    bonus?: string; // e.g., "10% Bonus!"
    image: string; // URL or path to image
    price: number; // USD price
    priceDisplay: string; // e.g., "$0.99"
    coins?: number; // Coins awarded
    items?: { name: string, quantity: number }[]; // For bundles
    action?: () => void; // For special items like "Remove Ads"
    themeId?: string; // For theme items
}

interface GameSettings {
    soundEffectsEnabled: boolean;
    musicEnabled: boolean;
    adsRemoved: boolean;
    purchasedThemes: string[];
    currentThemeId: string;
}


// --- Game Data ---
const ALL_THREE_LETTER_WORDS: readonly string[] = Object.freeze([
    "ACE", "ACT", "ADD", "AGE", "AGO", "AIR", "ALL", "AND", "ANT", "APE", "ARE", "ARM", "ART", "ASK", "ATE",
    "BAD", "BAG", "BAT", "BED", "BEE", "BEG", "BET", "BID", "BIG", "BIT", "BOX", "BOY", "BUN", "BUS", "BUT", "BUY", "BYE",
    "CAB", "CAN", "CAR", "CAT", "COW", "CRY", "CUB", "CUT",
    "DAB", "DAD", "DAM", "DAY", "DEN", "DID", "DIG", "DIP", "DOG", "DOT", "DUG",
    "EAR", "EAT", "EGG", "ELF", "END", "EYE",
    "FAN", "FAR", "FAT", "FEW", "FIN", "FIT", "FIX", "FLY", "FOE", "FOG", "FOR", "FOX", "FRY", "FUN",
    "GAS", "GEL", "GET", "GOD", "GOT", "GUM", "GUN", "GUT",
    "HAD", "HAS", "HAT", "HEN", "HER", "HIM", "HIS", "HIT", "HOP", "HOT", "HOW", "HUG", "HUM", "HUT",
    "ICE", "ILL", "INK",
    "JAB", "JAM", "JAR", "JET", "JOB", "JOG", "JUG",
    "KEY", "KIT",
    "LAY", "LEG", "LET", "LIE", "LIT", "LOG", "LOT",
    "MAD", "MAN", "MAP", "MAT", "MAY", "MEN", "MET", "MIX", "MOM", "MOP", "MUD", "MUG", "MUM",
    "NAB", "NAP", "NET", "NEW", "NOD", "NOT", "NOW", "NUT",
    "OAR", "ODD", "OLD", "ONE", "OUT", "OWL", "OWN",
    "PAN", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PET", "PIG", "PIN", "PIT", "POD", "POP", "POT", "PUP", "PUT",
    "RAG", "RAM", "RAN", "RAP", "RAT", "RED", "RID", "RIG", "RIP", "ROB", "ROD", "ROW", "RUB", "RUG", "RUM", "RUN",
    "SAD", "SAT", "SAW", "SAY", "SEA", "SEE", "SET", "SEW", "SHE", "SHY", "SIN", "SIP", "SIR", "SIT", "SIX", "SKY", "SOB", "SON", "SOW", "SUE", "SUM", "SUN",
    "TAB", "TAG", "TAN", "TAP", "TAX", "TEA", "TEN", "THE", "THY", "TIE", "TIN", "TIP", "TOE", "TON", "TOO", "TOP", "TOW", "TOY", "TRY", "TUG",
    "USE",
    "VAN", "VET", "VIE",
    "WAG", "WAR", "WAS", "WAY", "WEB", "WED", "WET", "WHO", "WHY", "WIG", "WIN", "WIT", "WOE", "WON", "WOW",
    "YAK", "YAP", "YEA", "YEN", "YES", "YET", "YOU",
    "ZAP", "ZIP", "ZOO"
]);

let gameRoadmap: WorldDefinition[] = [];


// --- Game State ---
let currentPlayingLevel: LevelDefinition | null = null;
let availableLetters: string[] = [];
let currentSwipePath: SwipedLetterInfo[] = [];
let isSwiping = false;
let foundWords: string[] = [];
let bonusWordsFound: string[] = [];
let newBonusWordsCount = 0;
const BONUS_COIN_VALUE = 2; // Coins earned for a bonus word
const HINT_COST = 50;
const REVEAL_LETTER_COST = 25;

const WORLD_BACKGROUNDS: Record<string, string> = {
    'tutorial': 'https://images.unsplash.com/photo-1541814120807-6577382d6215?auto=format&fit=crop&w=1200&q=80',
    'kitchen': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    'forest': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    'ocean': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'space': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'desert': 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80',
    'arctic': 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?auto=format&fit=crop&w=1200&q=80',
    'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    'jungle': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
    'city': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    'meadow': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'volcano': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    'sky': 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1200&q=80',
    'crystal': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    'cyber': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    'ruins': 'https://images.unsplash.com/photo-1541013369527-dc20399d985a?auto=format&fit=crop&w=1200&q=80',
    'steam': 'https://images.unsplash.com/photo-1534011613143-6c84c1f618fc?auto=format&fit=crop&w=1200&q=80',
    'enchanted': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
    'ghost': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80',
    'sakura': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    'mars': 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    'viking': 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=1200&q=80',
    'pirate': 'https://images.unsplash.com/photo-1519114056088-b877fe073a5e?auto=format&fit=crop&w=1200&q=80',
    'candy': 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80',
    'underground': 'https://images.unsplash.com/photo-1508197145814-0cc040ca392b?auto=format&fit=crop&w=1200&q=80',
    'safari': 'https://images.unsplash.com/photo-1547471080-7cc2032e3dbe?auto=format&fit=crop&w=1200&q=80',
    'circus': 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?auto=format&fit=crop&w=1200&q=80',
    'medieval': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'future': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    'library': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    'toybox': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=1200&q=80',
    'farm': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    'bamboo': 'https://images.unsplash.com/photo-1516245842810-749e757d5a57?auto=format&fit=crop&w=1200&q=80',
    'station': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80'
};
let score = 0;
let coins = 100;
const SHUFFLE_COST = 10;
let gameSettings: GameSettings = {
    soundEffectsEnabled: true,
    musicEnabled: true,
    adsRemoved: false,
    purchasedThemes: ['default'],
    currentThemeId: 'default'
};

const soundManager = new SoundManager();
const dictionaryManager = new DictionaryManager();

// Gemini API Removed
const DEFAULT_GENERATED_WORLD_THEME_VAR = "--world-generated-bg";

// --- DOM Elements ---
const appContainer = document.getElementById('app-container')!;
const mainMenuScreen = document.getElementById('main-menu-screen')!;
const levelSelectionScreen = document.getElementById('level-selection-screen')!;
const gameContainer = document.getElementById('game-container')!;

// Main Menu UI
const mainSettingsButton = document.getElementById('main-settings-button')!;
const gameModeCards = document.querySelectorAll('.game-mode-card');
const mainMenuCoins = document.getElementById('main-menu-coins')!;

// Roadmap UI
const roadmapMainContent = document.getElementById('roadmap-main-content')!;
const roadmapBackButton = document.getElementById('roadmap-back-button')!;
const roadmapSettingsButton = document.getElementById('roadmap-settings-button')!;
const roadmapAchievementsButton = document.getElementById('roadmap-achievements-button')!;
const roadmapBonusBadge = document.getElementById('roadmap-bonus-badge')!;
const roadmapCoinsValue = document.getElementById('roadmap-coins-value')! as HTMLSpanElement;
const roadmapShopButton = document.getElementById('roadmap-shop-button')!;

// Wordle UI
const wordleContainer = document.getElementById('wordle-container')!;
const wordleBackButton = document.getElementById('wordle-back-button')!;
const wordleSettingsButton = document.getElementById('wordle-settings-button')!;
const wordleGrid = document.getElementById('wordle-grid')!;
const wordleKeyboard = document.getElementById('wordle-keyboard')!;
const currentAttemptSpan = document.getElementById('current-attempt')!;
const wordleMessage = document.getElementById('wordle-message')!;
const wordleCoins = document.getElementById('wordle-coins-value')!;

// Spelling Bee UI
const beeContainer = document.getElementById('spelling-bee-container')!;
const beeBackButton = document.getElementById('bee-back-button')!;
const beeFoundToggle = document.getElementById('bee-found-toggle')!;
const beeRankDisplay = document.getElementById('bee-rank')!;
const beeScoreDisplay = document.getElementById('bee-score')!;
const beeScoreFill = document.getElementById('bee-score-fill')!;
const beeMessageDisplay = document.getElementById('bee-message')!;
const beeCurrentWordDisplay = document.getElementById('bee-current-word')!;
const beeCellCenter = document.getElementById('bee-cell-center')!;
const beeOuterCells = [
    document.getElementById('bee-cell-0')!,
    document.getElementById('bee-cell-1')!,
    document.getElementById('bee-cell-2')!,
    document.getElementById('bee-cell-3')!,
    document.getElementById('bee-cell-4')!,
    document.getElementById('bee-cell-5')!,
];
const beeDeleteBtn = document.getElementById('bee-delete')!;
const beeShuffleBtn = document.getElementById('bee-shuffle')!;
const beeEnterBtn = document.getElementById('bee-enter')!;
const beeFoundModal = document.getElementById('bee-found-words-modal')!;
const beeCloseFoundBtn = document.getElementById('bee-close-found')!;
const beeFoundCount = document.getElementById('bee-found-count')!;
const beeFoundList = document.getElementById('bee-found-list')!;
const beeCoinsValues = document.getElementById('bee-coins-value')!;

// Connections UI
const connContainer = document.getElementById('connections-container')!;
const connBackButton = document.getElementById('conn-back-button')!;
const connHelpButton = document.getElementById('conn-help-button')!;
const connSolvedArea = document.getElementById('conn-found-area')!;
const connGrid = document.getElementById('conn-grid')!;
const mistakeMarkers = document.getElementById('mistake-markers')!;
const connShuffleBtn = document.getElementById('conn-shuffle')!;
const connDeselectBtn = document.getElementById('conn-deselect')!;
const connSubmitBtn = document.getElementById('conn-submit')! as HTMLButtonElement;
const connCoinsValues = document.getElementById('conn-coins-value')!;

// Strands UI
const strandsContainer = document.getElementById('strands-container')!;
const strandsBackButton = document.getElementById('strands-back-button')!;
const strandsThemeText = document.getElementById('strands-theme-text')!;
const strandsGrid = document.getElementById('strands-grid')!;
const strandsCurrentGuess = document.getElementById('strands-current-guess')!;
const strandsFoundList = document.getElementById('strands-found-list')!;
const strandsHintButton = document.getElementById('strands-hint-button')!;
const strandsCoinsValues = document.getElementById('strands-coins-value')!;

// Letter Boxed UI
const boxedContainer = document.getElementById('letter-boxed-container')!;
const boxedBackButton = document.getElementById('boxed-back-button')!;
const boxedFoundList = document.getElementById('boxed-found-list')!;
const boxedCurrentWord = document.getElementById('boxed-current-word')!;
const boxedMessage = document.getElementById('boxed-message')!;
const boxedDeleteBtn = document.getElementById('boxed-delete')!;
const boxedEnterBtn = document.getElementById('boxed-enter')!;
const boxedHelpButton = document.getElementById('boxed-help-button')!;
const boxedCoinsValues = document.getElementById('boxed-coins-value')!;
const boxedSides = [
    document.getElementById('boxed-side-0')!,
    document.getElementById('boxed-side-1')!,
    document.getElementById('boxed-side-2')!,
    document.getElementById('boxed-side-3')!,
];

// Sudoku UI
const sudokuContainer = document.getElementById('sudoku-container')!;
const sudokuBackButton = document.getElementById('sudoku-back-button')!;
const sudokuMistakesDisplay = document.getElementById('sudoku-mistakes')!;
const sudokuDifficultyDisplay = document.getElementById('sudoku-difficulty')!;
const sudokuGrid = document.getElementById('sudoku-grid')!;
const sudokuNumpad = document.getElementById('sudoku-numpad')!;
const sudokuSettingsButton = document.getElementById('sudoku-settings-button')!;
const sudokuCoinsValues = document.getElementById('sudoku-coins-value')!;

// Tiles UI
const tilesContainer = document.getElementById('tiles-container')!;
const tilesBackButton = document.getElementById('tiles-back-button')!;
const tilesScoreDisplay = document.getElementById('tiles-score')!;
const tilesComboDisplay = document.getElementById('tiles-combo')!;
const tilesGrid = document.getElementById('tiles-grid')!;
const tilesCoinsValues = document.getElementById('tiles-coins-value')!;

// Pips UI
const pipsContainer = document.getElementById('pips-container')!;
const pipsBackButton = document.getElementById('pips-back-button')!;
const pipsMovesDisplay = document.getElementById('pips-moves')!;
const pipsGrid = document.getElementById('pips-grid')!;
const pipsCoinsValues = document.getElementById('pips-coins-value')!;

// World Generation UI Removed

// Game UI
const gameBackButton = document.getElementById('game-back-button')!;
const gameSettingsButton = document.getElementById('game-settings-button')!;
const levelNameDisplay = document.getElementById('level-name-display')!;
const wordGridContainerEl = document.getElementById('word-grid-container')!;
const currentWordDisplay = document.getElementById('current-word')!;
const letterWheel = document.getElementById('letter-wheel')!;
const shuffleButton = document.getElementById('shuffle-button')!;
const hintButton = document.getElementById('hint-button')!;
const revealLetterButton = document.getElementById('reveal-letter-button')!;
const micButton = document.getElementById('mic-button')! as HTMLButtonElement;
const hintCostDisplay = document.getElementById('hint-cost')!;
const revealLetterCostDisplay = document.getElementById('reveal-letter-cost')!;
const gameAchievementsButton = document.getElementById('game-achievements-button')!;
const gameBonusBadge = document.getElementById('game-bonus-badge')!;
const gameCoinsValue = document.getElementById('game-coins-value')! as HTMLSpanElement;
const gameShopButton = document.getElementById('game-shop-button')!;
const confettiContainer = document.getElementById('confetti-container')!;

// Wordle Game Instance
let wordleGameInstance: WordleGame | null = null;

// Spelling Bee Game Instance
let beeGameInstance: SpellingBeeGame | null = null;
let beeTypedWord: string = "";

// Connections Game Instance
let connGameInstance: ConnectionsGame | null = null;

// Strands Game Instance
let strandsGameInstance: StrandsGame | null = null;
let strandsActiveGuess: { r: number, c: number }[] = [];
let isStrandsDragging: boolean = false;

// Letter Boxed Game Instance
let boxedGameInstance: LetterBoxedGame | null = null;

// Sudoku Game Instance
let sudokuGameInstance: SudokuGame | null = null;

// Tiles Game Instance
let tilesGameInstance: TilesGame | null = null;

// Pips Game Instance
let pipsGameInstance: PipsGame | null = null;

// Shared UI (Modals, Popups)
const feedbackPopup = document.getElementById('feedback-popup')!;
const feedbackMessage = document.getElementById('feedback-message')!;
const feedbackOkButton = document.getElementById('feedback-ok-button')!;
const swipeLineCanvas = document.getElementById('swipe-line-canvas') as HTMLCanvasElement;
const swipeLineCtx = swipeLineCanvas.getContext('2d')!;
const bonusWordsModal = document.getElementById('bonus-words-modal')! as HTMLElement;
const closeBonusModalButton = document.getElementById('close-bonus-modal')!;
const bonusWordsListDiv = document.getElementById('bonus-words-list')!;
const bonusWordsTip = document.getElementById('bonus-words-tip')!;
const bonusTipOkButton = document.getElementById('bonus-tip-ok-button')!;

// Shop Modal UI
const shopModal = document.getElementById('shop-modal')! as HTMLElement;
const closeShopModalButton = document.getElementById('close-shop-modal')!;
const shopTabsContainer = document.getElementById('shop-tabs')!;
const shopTabCurrencyContent = document.getElementById('shop-tab-currency')!;
const shopTabBundlesContent = document.getElementById('shop-tab-bundles')!;
const shopTabThemesContent = document.getElementById('shop-tab-themes')!;
const shopTabSpecialContent = document.getElementById('shop-tab-special')!;
const shopCurrentCoinsDisplay = document.getElementById('shop-current-coins')! as HTMLSpanElement;

// Settings Modal UI
const settingsModal = document.getElementById('settings-modal')! as HTMLElement;
const closeSettingsModalButton = document.getElementById('close-settings-modal')!;
const soundToggle = document.getElementById('sound-toggle') as HTMLInputElement;
const musicToggle = document.getElementById('music-toggle') as HTMLInputElement;
const resetProgressButton = document.getElementById('reset-progress-button')!;


interface SwipedLetterInfo {
    letter: string;
    originalIndex: number;
    element: HTMLButtonElement;
    centerX: number;
    centerY: number;
}

// Speech Recognition
let speechRecognition: any = null;
let isListening = false;

// --- Utility Functions ---
function showFeedback(message: string, isSuccess: boolean, isLevelComplete = false, duration = 0) {
    feedbackMessage.textContent = message;
    feedbackPopup.classList.remove('hidden', 'success', 'level-complete-popup');

    if (isSuccess) feedbackPopup.classList.add('success');
    if (isLevelComplete) feedbackPopup.classList.add('level-complete-popup');

    const successBg = getComputedStyle(document.documentElement).getPropertyValue(isLevelComplete ? '--popup-success-bg' : '--popup-button-bg').trim();
    const errorBg = getComputedStyle(document.documentElement).getPropertyValue('--hint-badge-bg').trim(); // Using hint badge for error for now
    feedbackPopup.style.backgroundColor = isSuccess ? (successBg || 'rgba(76, 175, 80, 0.9)') : (errorBg || 'rgba(244, 67, 54, 0.9)');

    if (isLevelComplete) {
        triggerConfetti();
        const nextLevel = findNextLevel(currentPlayingLevel);
        if (nextLevel && nextLevel.unlocked) {
            feedbackOkButton.textContent = "Next Level";
            (feedbackOkButton as any).nextAction = () => startGameForLevel(nextLevel);
        } else {
            feedbackOkButton.textContent = "Back to Map";
            (feedbackOkButton as any).nextAction = showRoadmapScreen;
        }
    } else {
        feedbackOkButton.textContent = "OK";
        (feedbackOkButton as any).nextAction = null;
    }

    const existingTimeout = (feedbackPopup as any).timeoutId;
    if (existingTimeout) clearTimeout(existingTimeout);
    if (duration > 0) {
        (feedbackPopup as any).timeoutId = setTimeout(() => {
            if (!feedbackPopup.classList.contains('hidden')) feedbackPopup.classList.add('hidden');
        }, duration);
    } else {
        (feedbackOkButton as any).nextAction = (feedbackOkButton as any).nextAction || (() => feedbackPopup.classList.add('hidden'));
    }
}

function triggerConfetti() {
    confettiContainer.innerHTML = ''; // Clear previous confetti
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        const size = Math.random() * 8 + 5;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confettiContainer.appendChild(confetti);
    }
    setTimeout(() => confettiContainer.innerHTML = '', 3500); // Clear confetti after animation
}

function triggerHapticFeedback(pattern: 'light' | 'success' | 'error') {
    if (gameSettings.soundEffectsEnabled) {
        if ('vibrate' in navigator) {
            switch (pattern) {
                case 'light': navigator.vibrate(20); break;
                case 'success': navigator.vibrate([100, 50, 100]); break;
                case 'error': navigator.vibrate(200); break;
            }
        }
        switch (pattern) {
            case 'light': soundManager.playClick(); break;
            case 'success': soundManager.playSuccess(); break;
            case 'error': soundManager.playError(); break;
        }
    }
}




// --- Screen Navigation ---
function showMainMenu() {
    mainMenuScreen.classList.remove('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    updateGlobalUIElements();
}

function showRoadmapScreen() {
    console.log('showRoadmapScreen called. gameRoadmap length:', gameRoadmap.length);
    renderRoadmap();
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    updateGlobalUIElements();
}

function showGameScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    resizeCanvas();
    renderLetters();
    updateGlobalUIElements();
}


// --- Wordle Game Functions ---

function showWordleScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.remove('hidden');

    if (!wordleGameInstance) {
        const validWords = dictionaryManager.getAllWords();
        wordleGameInstance = new WordleGame(validWords);
    }

    renderWordleGrid();
    updateGlobalUIElements();
}

function renderWordleGrid() {
    if (!wordleGameInstance) return;

    wordleGrid.innerHTML = '';
    const state = wordleGameInstance.getState();

    for (let row = 0; row < 6; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('wordle-row');
        rowDiv.dataset.row = row.toString();

        for (let col = 0; col < 5; col++) {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('wordle-tile');
            tileDiv.dataset.col = col.toString();

            if (row < state.guesses.length) {
                const guess = state.guesses[row];
                tileDiv.textContent = guess[col];
                tileDiv.classList.add('filled');
            } else if (row === state.currentRow && col < state.currentGuess.length) {
                tileDiv.textContent = state.currentGuess[col];
                tileDiv.classList.add('filled');
            }

            rowDiv.appendChild(tileDiv);
        }
        wordleGrid.appendChild(rowDiv);
    }

    currentAttemptSpan.textContent = (state.currentRow + 1).toString();
    applyWordleColors();
}

function applyWordleColors() {
    if (!wordleGameInstance) return;

    const state = wordleGameInstance.getState();
    const keyStates = new Map<string, 'correct' | 'present' | 'absent'>();

    state.guesses.forEach((guess, rowIndex) => {
        const result = evaluateWordleGuess(guess, state.targetWord);
        const rowDiv = wordleGrid.querySelector(`[data-row="${rowIndex}"]`);
        if (!rowDiv) return;

        result.forEach((letterResult, colIndex) => {
            const tile = rowDiv.querySelector(`[data-col="${colIndex}"]`) as HTMLElement;
            if (tile) {
                tile.classList.add(letterResult.state);
                const existing = keyStates.get(letterResult.letter);
                if (!existing || letterResult.state === 'correct' || (letterResult.state === 'present' && existing !== 'correct')) {
                    keyStates.set(letterResult.letter, letterResult.state);
                }
            }
        });
    });

    updateWordleKeyboard(keyStates);
}

function evaluateWordleGuess(guess: string, target: string): LetterResult[] {
    const result: LetterResult[] = [];
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    const used: boolean[] = new Array(5).fill(false);

    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = { letter: guessLetters[i], state: 'correct' };
            used[i] = true;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (result[i]) continue;
        const foundIndex = targetLetters.findIndex((letter, idx) => letter === guessLetters[i] && !used[idx]);
        if (foundIndex !== -1) {
            result[i] = { letter: guessLetters[i], state: 'present' };
            used[foundIndex] = true;
        } else {
            result[i] = { letter: guessLetters[i], state: 'absent' };
        }
    }

    return result;
}

function updateWordleKeyboard(keyStates: Map<string, 'correct' | 'present' | 'absent'>) {
    const keys = wordleKeyboard.querySelectorAll('.key-button:not(.key-special)');
    keys.forEach(key => {
        const letter = key.getAttribute('data-key');
        if (letter && keyStates.has(letter)) {
            const state = keyStates.get(letter)!;
            key.classList.remove('correct', 'present', 'absent');
            key.classList.add(state);
        }
    });
}

function handleWordleKeyPress(key: string) {
    if (!wordleGameInstance) return;

    const state = wordleGameInstance.getState();
    if (state.gameOver) return;

    if (key === 'ENTER') {
        const result = wordleGameInstance.submitGuess();
        if (result.success) {
            renderWordleGrid();
            if (result.message) {
                wordleMessage.textContent = result.message;
                if (state.won) {
                    coins += 50;
                    updateGlobalUIElements();
                    setTimeout(() => showFeedback('You won! +50 coins', true, false, 3000), 1000);
                } else if (state.gameOver) {
                    setTimeout(() => showFeedback(result.message!, false, false, 3000), 1000);
                }
            }
        } else {
            wordleMessage.textContent = result.message || '';
            setTimeout(() => { wordleMessage.textContent = ''; }, 2000);
        }
    } else if (key === 'BACKSPACE') {
        wordleGameInstance.deleteLetter();
        renderWordleGrid();
        wordleMessage.textContent = '';
    } else {
        wordleGameInstance.addLetter(key);
        renderWordleGrid();
        wordleMessage.textContent = '';
    }
}

function resetWordle() {
    if (wordleGameInstance) {
        wordleGameInstance.reset();
        renderWordleGrid();
        wordleMessage.textContent = '';
        const keys = wordleKeyboard.querySelectorAll('.key-button');
        keys.forEach(key => key.classList.remove('correct', 'present', 'absent'));
    }
}

// --- Spelling Bee Game Functions ---

function showSpellingBeeScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.remove('hidden');

    if (!beeGameInstance) {
        beeGameInstance = new SpellingBeeGame(dictionaryManager.getAllWords());
    }

    renderHoneyComb();
    updateBeeUI();
}

function renderHoneyComb() {
    if (!beeGameInstance) return;
    const state = beeGameInstance.getState();

    // Set center letter
    beeCellCenter.querySelector('.cell-content')!.textContent = state.centerLetter;

    // Set outer letters
    state.outerLetters.forEach((letter, i) => {
        if (beeOuterCells[i]) {
            beeOuterCells[i].querySelector('.cell-content')!.textContent = letter;
        }
    });
}

function updateBeeUI() {
    if (!beeGameInstance) return;
    const state = beeGameInstance.getState();

    beeRankDisplay.textContent = state.rank;
    beeScoreDisplay.textContent = state.currentScore.toString();

    const progress = (state.currentScore / state.maxScore) * 100;
    beeScoreFill.style.width = `${Math.min(100, progress)}%`;

    beeCurrentWordDisplay.textContent = beeTypedWord;

    updateGlobalUIElements();
}

function handleBeeLetterClick(letter: string) {
    beeTypedWord += letter.toUpperCase();
    updateBeeUI();
}

function handleBeeDelete() {
    beeTypedWord = beeTypedWord.slice(0, -1);
    updateBeeUI();
}

function handleBeeShuffle() {
    if (!beeGameInstance) return;
    beeGameInstance.shuffleOuterLetters();
    renderHoneyComb();
}

function handleBeeEnter() {
    if (!beeGameInstance || beeTypedWord.length === 0) return;

    const result = beeGameInstance.submitWord(beeTypedWord);

    if (result.success) {
        beeMessageDisplay.textContent = result.message;
        beeTypedWord = "";

        // Award coins
        if (result.score) {
            coins += result.score;
        }

        updateBeeUI();

        // Feedback animation/temporary message
        setTimeout(() => {
            beeMessageDisplay.textContent = "";
        }, 2000);
    } else {
        beeMessageDisplay.textContent = result.message;
        // Shake animation for input display?
        beeCurrentWordDisplay.parentElement?.classList.add('shake');
        setTimeout(() => {
            beeMessageDisplay.textContent = "";
            beeCurrentWordDisplay.parentElement?.classList.remove('shake');
        }, 2000);
    }
}

function openBeeFoundWords() {
    if (!beeGameInstance) return;
    const state = beeGameInstance.getState();

    beeFoundCount.textContent = state.foundWords.length.toString();
    beeFoundList.innerHTML = "";

    state.foundWords.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.classList.add('found-word');
        wordEl.textContent = word;
        beeFoundList.appendChild(wordEl);
    });

    beeFoundModal.classList.remove('hidden');
}

function closeBeeFoundWords() {
    beeFoundModal.classList.add('hidden');
}


// --- Connections Game Functions ---

function showConnectionsScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.remove('hidden');

    if (!connGameInstance) {
        connGameInstance = new ConnectionsGame();
    }

    renderConnGrid();
    updateConnUI();
}

function renderConnGrid() {
    if (!connGameInstance) return;
    const state = connGameInstance.getState();

    // Clear and render solved categories
    connSolvedArea.innerHTML = '';
    state.foundCategories.forEach(cat => {
        const row = document.createElement('div');
        row.className = `conn-category-row level-${cat.level}`;
        row.innerHTML = `
            <div class="conn-category-title">${cat.description}</div>
            <div class="conn-category-words">${cat.words.join(', ')}</div>
        `;
        connSolvedArea.appendChild(row);
    });

    // Clear and render active grid
    connGrid.innerHTML = '';
    state.grid.forEach(word => {
        const item = document.createElement('div');
        item.className = 'conn-item';
        if (state.selectedWords.includes(word)) {
            item.classList.add('selected');
        }
        item.textContent = word;
        item.onclick = () => handleConnWordClick(word);
        connGrid.appendChild(item);
    });
}

function updateConnUI() {
    if (!connGameInstance) return;
    const state = connGameInstance.getState();

    // Update mistake markers
    const dots = mistakeMarkers.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        if (i < state.mistakesRemaining) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });

    // Disable submit if not 4 selected
    connSubmitBtn.disabled = state.selectedWords.length !== 4;
}

function handleConnWordClick(word: string) {
    if (!connGameInstance) return;
    connGameInstance.toggleWord(word);
    renderConnGrid();
    updateConnUI();
}

function handleConnShuffle() {
    if (!connGameInstance) return;
    // Simple UI-only shuffle for the remaining grid
    const state = connGameInstance.getState();
    state.grid.sort(() => Math.random() - 0.5);
    renderConnGrid();
}

function handleConnDeselect() {
    if (!connGameInstance) return;
    const state = connGameInstance.getState();
    state.selectedWords = [];
    renderConnGrid();
    updateConnUI();
}

function handleConnSubmit() {
    if (!connGameInstance) return;
    const result = connGameInstance.submitSelection();

    if (result.success) {
        showFeedback(result.message, true);
        coins += 25; // Award for each category
        renderConnGrid();
        updateConnUI();

        const state = connGameInstance.getState();
        if (state.gameOver && state.won) {
            setTimeout(() => {
                showFeedback("Game Complete! 🎉", true);
                coins += 100; // Big bonus
                showMainMenu();
            }, 1000);
        }
    } else {
        showFeedback(result.message, false);
        updateConnUI();

        const state = connGameInstance.getState();
        if (state.gameOver) {
            setTimeout(() => {
                const solution = connGameInstance!.getSolution();
                showFeedback(`Game Over!`, false);
                // Maybe reveal solution here or just return to menu
                showMainMenu();
            }, 2000);
        }
    }
}


// --- Strands Game Functions ---

function showStrandsScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.add('hidden');
    strandsContainer.classList.remove('hidden');

    if (!strandsGameInstance) {
        strandsGameInstance = new StrandsGame();
    }

    renderStrandsGrid();
    updateStrandsUI();
}

function renderStrandsGrid() {
    if (!strandsGameInstance) return;
    const state = strandsGameInstance.getState();

    strandsGrid.innerHTML = '';
    state.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'strands-cell';
            cellEl.textContent = cell.letter;
            cellEl.dataset.row = r.toString();
            cellEl.dataset.col = c.toString();

            if (cell.found) {
                cellEl.classList.add(cell.isSpangram ? 'found-spangram' : 'found-theme');
            }

            // Mouse Events
            cellEl.onmousedown = () => handleStrandsStart(r, c);
            cellEl.onmouseenter = () => handleStrandsMove(r, c);

            // Touch Events
            cellEl.ontouchstart = (e) => {
                e.preventDefault();
                handleStrandsStart(r, c);
            };

            strandsGrid.appendChild(cellEl);
        });
    });

    strandsThemeText.textContent = state.theme;
}

function updateStrandsUI() {
    if (!strandsGameInstance) return;
    const state = strandsGameInstance.getState();

    strandsFoundList.innerHTML = '';
    state.foundWords.forEach(word => {
        const chip = document.createElement('div');
        chip.className = 'strands-word-chip';
        // Check if this word was the spangram (simplification)
        if (word.length > 8) chip.classList.add('spangram'); // Rough check
        chip.textContent = word;
        strandsFoundList.appendChild(chip);
    });

    updateGlobalUIElements();
}

function handleStrandsStart(r: number, c: number) {
    if (!strandsGameInstance) return;
    isStrandsDragging = true;
    strandsActiveGuess = [{ r, c }];
    updateActiveStrandsView();
}

function handleStrandsMove(r: number, c: number) {
    if (!isStrandsDragging || !strandsGameInstance) return;

    // Check if cell is adjacent to last cell
    const last = strandsActiveGuess[strandsActiveGuess.length - 1];
    if (Math.abs(last.r - r) <= 1 && Math.abs(last.c - c) <= 1) {
        // Don't add if already in guess
        if (!strandsActiveGuess.some(pos => pos.r === r && pos.c === c)) {
            strandsActiveGuess.push({ r, c });
            updateActiveStrandsView();
        }
    }
}

function handleStrandsEnd() {
    if (!isStrandsDragging || !strandsGameInstance) return;
    isStrandsDragging = false;

    const result = strandsGameInstance.checkWord(strandsActiveGuess.map(p => [p.r, p.c]));

    if (result.success) {
        showFeedback(result.isSpangram ? "SPANGRAM! ✨" : "Found!", true);
        coins += result.isSpangram ? 100 : 25;
        renderStrandsGrid();
        updateStrandsUI();

        const state = strandsGameInstance.getState();
        if (state.gameOver) {
            setTimeout(() => {
                showFeedback("Strands Complete! 🧶", true);
                showMainMenu();
            }, 1000);
        }
    }

    strandsActiveGuess = [];
    updateActiveStrandsView();
}

function updateActiveStrandsView() {
    // Highlight cells in current guess
    const cells = strandsGrid.querySelectorAll('.strands-cell');
    cells.forEach(cell => cell.classList.remove('selected'));

    strandsActiveGuess.forEach(pos => {
        const cell = strandsGrid.querySelector(`[data-row="${pos.r}"][data-col="${pos.c}"]`);
        cell?.classList.add('selected');
    });

    if (strandsActiveGuess.length > 0) {
        strandsCurrentGuess.textContent = strandsActiveGuess.map(pos => {
            const state = strandsGameInstance!.getState();
            return state.grid[pos.r][pos.c].letter;
        }).join('');
    } else {
        strandsCurrentGuess.textContent = '';
    }
}

// Global mouseup to catch end of drag anywhere
document.addEventListener('mouseup', handleStrandsEnd);
document.addEventListener('touchend', handleStrandsEnd);
// Touch move needs coordinate-based lookups
document.addEventListener('touchmove', (e) => {
    if (!isStrandsDragging) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element?.classList.contains('strands-cell')) {
        const r = parseInt((element as HTMLElement).dataset.row!);
        const c = parseInt((element as HTMLElement).dataset.col!);
        handleStrandsMove(r, c);
    }
}, { passive: false });
// --- Letter Boxed Game Functions ---

function showLetterBoxedScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.add('hidden');
    strandsContainer.classList.add('hidden');
    boxedContainer.classList.remove('hidden');

    if (!boxedGameInstance) {
        boxedGameInstance = new LetterBoxedGame(dictionaryManager.getAllWords());
    }

    renderBoxedUI();
}

function renderBoxedUI() {
    if (!boxedGameInstance) return;
    const state = boxedGameInstance.getState();

    // Render sides
    state.sides.forEach((side, i) => {
        const sideEl = boxedSides[i];
        const texts = sideEl.querySelectorAll('.boxed-letter');
        const dots = sideEl.querySelectorAll('.boxed-dot');

        side.forEach((letter, j) => {
            texts[j].textContent = letter;
            const dot = dots[j] as SVGCircleElement;

            if (state.usedLetters.has(letter)) {
                dot.classList.add('used');
            } else {
                dot.classList.remove('used');
            }

            dot.onclick = () => {
                const result = boxedGameInstance!.addLetter(letter);
                if (result.success) {
                    renderBoxedUI();
                } else {
                    showFeedback(result.message!, false);
                }
            };
        });
    });

    boxedCurrentWord.textContent = state.currentWord;

    // Render found list
    boxedFoundList.innerHTML = '';
    state.foundWords.forEach(word => {
        const chip = document.createElement('div');
        chip.className = 'strands-word-chip'; // Reuse style
        chip.textContent = word;
        boxedFoundList.appendChild(chip);
    });

    updateGlobalUIElements();
}

function handleBoxedEnter() {
    if (!boxedGameInstance) return;
    const result = boxedGameInstance.submitWord();

    if (result.success) {
        showFeedback(result.message, true);
        coins += 50;
        renderBoxedUI();

        const state = boxedGameInstance.getState();
        if (state.gameOver) {
            setTimeout(() => {
                showFeedback("Box Completed! 📦", true);
                showMainMenu();
            }, 1000);
        }
    } else {
        showFeedback(result.message, false);
    }
}

function handleBoxedDelete() {
    if (boxedGameInstance) {
        boxedGameInstance.deleteLetter();
        renderBoxedUI();
    }
}
// --- Sudoku Game Functions ---

function showSudokuScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.add('hidden');
    strandsContainer.classList.add('hidden');
    boxedContainer.classList.add('hidden');
    sudokuContainer.classList.remove('hidden');

    if (!sudokuGameInstance) {
        sudokuGameInstance = new SudokuGame('easy');
    }

    renderSudokuGrid();
    updateSudokuUI();
}

function renderSudokuGrid() {
    if (!sudokuGameInstance) return;
    const state = sudokuGameInstance.getState();

    sudokuGrid.innerHTML = '';
    state.grid.forEach((row, r) => {
        row.forEach((val, c) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'sudoku-cell';
            if (state.initialGrid[r][c]) cellEl.classList.add('initial');
            if (state.selectedCell?.r === r && state.selectedCell?.c === c) cellEl.classList.add('selected');

            cellEl.textContent = val !== 0 ? val.toString() : '';

            cellEl.onclick = () => {
                sudokuGameInstance!.selectCell(r, c);
                renderSudokuGrid();
            };

            sudokuGrid.appendChild(cellEl);
        });
    });
}

function updateSudokuUI() {
    if (!sudokuGameInstance) return;
    const state = sudokuGameInstance.getState();
    sudokuMistakesDisplay.textContent = `Mistakes: ${state.mistakes}/3`;
    updateGlobalUIElements();
}

function handleSudokuInput(num: number) {
    if (!sudokuGameInstance) return;
    const result = sudokuGameInstance.setCellValue(num);

    if (result.success) {
        renderSudokuGrid();
        if (result.won) {
            showFeedback("Sudoku Solved! 🧩", true);
            coins += 200;
            setTimeout(showMainMenu, 2000);
        }
    } else if (result.mistake) {
        showFeedback("Mistake!", false);
        updateSudokuUI();
        if (result.gameOver) {
            showFeedback("Game Over! Too many mistakes.", false);
            setTimeout(showMainMenu, 2000);
        }
    }
}
// --- Tiles Game Functions ---

function showTilesScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.add('hidden');
    strandsContainer.classList.add('hidden');
    boxedContainer.classList.add('hidden');
    sudokuContainer.classList.add('hidden');
    tilesContainer.classList.remove('hidden');

    if (!tilesGameInstance) {
        tilesGameInstance = new TilesGame();
    }

    renderTilesGrid();
    updateTilesUI();
}

function renderTilesGrid() {
    if (!tilesGameInstance) return;
    const state = tilesGameInstance.getState();

    tilesGrid.innerHTML = '';
    state.grid.forEach((row, r) => {
        row.forEach((tile, c) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'tile-cell';
            if (state.selectedTile?.r === r && state.selectedTile?.c === c) cellEl.classList.add('selected');

            if (tile) {
                const icon = document.createElement('div');
                icon.className = `tile-icon ${tile.shape} ${tile.color}`;
                cellEl.appendChild(icon);
            }

            cellEl.onclick = () => {
                const result = tilesGameInstance!.selectTile(r, c);
                if (result.match) {
                    showFeedback("Match! ✨", true);
                    coins += 5;
                }
                renderTilesGrid();
                updateTilesUI();
            };

            tilesGrid.appendChild(cellEl);
        });
    });
}

function updateTilesUI() {
    if (!tilesGameInstance) return;
    const state = tilesGameInstance.getState();
    tilesScoreDisplay.textContent = state.score.toString();
    tilesComboDisplay.textContent = `Combo: ${state.combo}x`;
    updateGlobalUIElements();
}

// --- Pips Game Functions ---

function showPipsScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.add('hidden');
    beeContainer.classList.add('hidden');
    connContainer.classList.add('hidden');
    strandsContainer.classList.add('hidden');
    boxedContainer.classList.add('hidden');
    sudokuContainer.classList.add('hidden');
    tilesContainer.classList.add('hidden');
    pipsContainer.classList.remove('hidden');

    if (!pipsGameInstance) {
        pipsGameInstance = new PipsGame();
    }

    renderPipsGrid();
    updatePipsUI();
}

function renderPipsGrid() {
    if (!pipsGameInstance) return;
    const state = pipsGameInstance.getState();

    pipsGrid.innerHTML = '';
    state.grid.forEach((row, r) => {
        row.forEach((die, c) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'die-cell';
            if (die?.removed) cellEl.classList.add('removed');
            if (state.selectedDie?.r === r && state.selectedDie?.c === c) cellEl.classList.add('selected');

            if (die && !die.removed) {
                cellEl.classList.add(`val-${die.val}`);
                const face = document.createElement('div');
                face.className = 'die-face';
                // Add 9 pips, CSS logic will show/hide them
                for (let i = 0; i < 9; i++) {
                    const pip = document.createElement('div');
                    pip.className = 'die-pip';
                    face.appendChild(pip);
                }
                cellEl.appendChild(face);
            }

            cellEl.onclick = () => {
                const result = pipsGameInstance!.selectDie(r, c);
                if (result.match) {
                    showFeedback("7! 🎲", true);
                    coins += 10;
                    if (result.won) {
                        showFeedback("All Cleared! 🏆", true);
                        coins += 100;
                        setTimeout(showMainMenu, 2000);
                    }
                }
                renderPipsGrid();
                updatePipsUI();
            };

            pipsGrid.appendChild(cellEl);
        });
    });
}

function updatePipsUI() {
    if (!pipsGameInstance) return;
    const state = pipsGameInstance.getState();
    pipsMovesDisplay.textContent = `Moves: ${state.moves}`;
    updateGlobalUIElements();
}



function createLevelGemElement(level: LevelDefinition, worldName: string): HTMLButtonElement {
    const levelGem = document.createElement('button');
    levelGem.classList.add('level-gem');

    let phaseDescription = "";
    levelGem.setAttribute('aria-label', `${worldName} - ${level.displayName}${phaseDescription}${level.completed ? ' (Completed)' : (level.unlocked ? ' (Unlocked)' : ' (Locked)')}`);

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('material-symbols-outlined', 'level-gem-icon');

    const numberSpan = document.createElement('span');
    numberSpan.classList.add('level-gem-number');
    numberSpan.textContent = String(level.levelInWorld);

    if (level.completed) {
        levelGem.classList.add('completed');
        iconSpan.textContent = 'check_circle';
        levelGem.appendChild(iconSpan);
    } else if (level.unlocked) {
        levelGem.classList.add('unlocked');
        levelGem.appendChild(numberSpan);
        levelGem.addEventListener('click', () => startGameForLevel(level));
    } else {
        levelGem.classList.add('locked');
        iconSpan.textContent = 'lock';
        levelGem.appendChild(iconSpan);
        levelGem.disabled = true;
    }
    return levelGem;
}

function createPhaseGroupEl(levels: LevelDefinition[], phaseNumber: number, phaseTitle: string, worldName: string): HTMLElement {
    const group = document.createElement('div');
    group.classList.add('phase-group', `phase-${phaseNumber}`);
    group.setAttribute('aria-label', phaseTitle);
    levels.forEach(level => {
        const levelGem = createLevelGemElement(level, worldName);
        group.appendChild(levelGem);
    });
    return group;
}

function renderRoadmap() {
    console.log('renderRoadmap called. gameRoadmap length:', gameRoadmap.length);
    roadmapMainContent.innerHTML = '';
    gameRoadmap.forEach(world => {
        const worldSection = document.createElement('div');
        worldSection.classList.add('world-section');
        worldSection.id = `world-${world.id}`;

        const bgColor = getComputedStyle(document.documentElement).getPropertyValue(`--world-${world.id}-bg`).trim() || 'var(--primary)';
        worldSection.style.setProperty('--world-color', bgColor);

        if (WORLD_BACKGROUNDS[world.id]) {
            worldSection.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url(${WORLD_BACKGROUNDS[world.id]})`;
            worldSection.style.backgroundSize = 'cover';
        }

        const worldInfo = document.createElement('div');
        worldInfo.classList.add('world-info');

        const worldNameEl = document.createElement('h2');
        worldNameEl.classList.add('world-name-vertical');
        worldNameEl.textContent = world.name;
        worldInfo.appendChild(worldNameEl);

        const completedInWorld = world.levels.filter(l => l.completed).length;
        const worldProgressEl = document.createElement('p');
        worldProgressEl.classList.add('world-progress');
        worldProgressEl.textContent = `${completedInWorld}/${world.levels.length}`;
        worldInfo.appendChild(worldProgressEl);

        worldSection.appendChild(worldInfo);

        const levelsGrid = document.createElement('div');
        levelsGrid.classList.add('levels-grid');

        world.levels.forEach(level => {
            const levelGem = createLevelGemElement(level, world.name);
            levelsGrid.appendChild(levelGem);
        });

        worldSection.appendChild(levelsGrid);
        roadmapMainContent.appendChild(worldSection);
    });
    console.log('renderRoadmap complete. Worlds rendered:', gameRoadmap.length);
    updateGlobalUIElements();
}

function startGameForLevel(levelDef: LevelDefinition) {
    currentPlayingLevel = levelDef;
    availableLetters = [...levelDef.letters];
    foundWords = [];
    score = 0;

    // Set world background
    const appContainer = document.getElementById('app-container');
    if (appContainer && WORLD_BACKGROUNDS[levelDef.worldId]) {
        appContainer.style.setProperty('--bg-image', `url(${WORLD_BACKGROUNDS[levelDef.worldId]})`);
    }

    showGameScreen();
    initGameLogicForLevel();
}

// --- Game Logic Initialization for a Level ---
function initGameLogicForLevel() {
    if (!currentPlayingLevel) return;

    levelNameDisplay.textContent = `${currentPlayingLevel.worldId.toUpperCase().replace('GEN-WORLD-', 'GEN ').replace(/-/g, ' ')} ${currentPlayingLevel.levelInWorld}`;

    resizeCanvas();
    renderLetters();
    renderWordGrid();
    updateScoreboardAndCoins();
    clearSwipeState();
    currentWordDisplay.textContent = '';
    hintCostDisplay.textContent = String(HINT_COST);
    revealLetterCostDisplay.textContent = String(REVEAL_LETTER_COST);
}


// --- Core Game Functions (modified for dynamic levels) ---
function resizeCanvas() {
    const container = document.getElementById('letter-input-container')!;
    if (container && container.offsetParent !== null) {
        swipeLineCanvas.width = container.offsetWidth;
        swipeLineCanvas.height = container.offsetHeight;
    }
}

function renderLetters() {
    if (!gameContainer.classList.contains('hidden')) {
        letterWheel.innerHTML = '';
        const wheelRect = letterWheel.getBoundingClientRect();
        if (wheelRect.width === 0 || wheelRect.height === 0) return;

        const radius = wheelRect.width / 2 * 0.75;
        const centerX = wheelRect.width / 2;
        const centerY = wheelRect.height / 2;

        availableLetters.forEach((letter, index) => {
            const angle = (index / availableLetters.length) * 2 * Math.PI - (Math.PI / 2);
            const button = document.createElement('button');
            button.classList.add('letter-button');
            button.textContent = letter;
            button.dataset.letter = letter;
            button.dataset.originalIndex = String(index);
            button.setAttribute('aria-label', `Letter ${letter}`);
            letterWheel.appendChild(button);

            const btnWidth = parseFloat(getComputedStyle(button).width);
            const btnHeight = parseFloat(getComputedStyle(button).height);

            const finalX = centerX + radius * Math.cos(angle) - btnWidth / 2;
            const finalY = centerY + radius * Math.sin(angle) - btnHeight / 2;
            button.style.left = `${finalX}px`;
            button.style.top = `${finalY}px`;

            const swipeLineCanvasRect = swipeLineCanvas.getBoundingClientRect();
            (button as any).canvasCenterX = (button.getBoundingClientRect().left + button.getBoundingClientRect().right) / 2 - swipeLineCanvasRect.left;
            (button as any).canvasCenterY = (button.getBoundingClientRect().top + button.getBoundingClientRect().bottom) / 2 - swipeLineCanvasRect.top;

            button.addEventListener('pointerdown', (e) => handlePointerDown(e, letter, index, button));
        });
    }
}

function renderWordGrid() {
    if (!currentPlayingLevel) return;
    wordGridContainerEl.innerHTML = '';
    const wordsToDisplay = [...currentPlayingLevel.targetWords].sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    });

    wordsToDisplay.forEach(word => {
        const wordRow = document.createElement('div');
        wordRow.classList.add('word-row');
        wordRow.setAttribute('aria-label', `Word to find: ${word.length} letters`);

        for (let i = 0; i < word.length; i++) {
            const letterTile = document.createElement('div');
            letterTile.classList.add('letter-tile');
            if (foundWords.includes(word)) {
                letterTile.textContent = word[i];
                letterTile.classList.add('filled');
                letterTile.setAttribute('aria-label', `Letter ${word[i]}, part of found word ${word}`);
            } else {
                letterTile.classList.add('empty');
                letterTile.setAttribute('aria-label', `Empty letter tile, position ${i + 1} of ${word.length}`);
            }
            wordRow.appendChild(letterTile);
        }
        wordGridContainerEl.appendChild(wordRow);
    });
}

function updateCurrentSwipedWordDisplay() {
    currentWordDisplay.textContent = currentSwipePath.map(item => item.letter).join('');
}

function updateScoreboardAndCoins() {
    const coinStr = String(coins);
    gameCoinsValue.textContent = coinStr;
    roadmapCoinsValue.textContent = coinStr;
    shopCurrentCoinsDisplay.textContent = coinStr; // Update shop coins too
}

function updateGlobalUIElements() {
    updateScoreboardAndCoins();
    updateBonusBadgeOnAllScreens(newBonusWordsCount > 0 && !bonusWordsModal.classList.contains('hidden') ? 0 : newBonusWordsCount);
    renderBonusWordsList();
}

function handlePointerDown(event: PointerEvent, letter: string, originalIndex: number, buttonElement: HTMLButtonElement) {
    event.preventDefault();
    if (isSwiping || isListening) return;
    isSwiping = true;
    buttonElement.classList.add('swiped');
    currentSwipePath = [{ letter, originalIndex, element: buttonElement, centerX: (buttonElement as any).canvasCenterX, centerY: (buttonElement as any).canvasCenterY }];
    updateCurrentSwipedWordDisplay();
    drawSwipeLines();
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerMove(event: PointerEvent) {
    if (!isSwiping) return;
    event.preventDefault();
    const targetElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLButtonElement;
    if (targetElement && targetElement.classList.contains('letter-button') && !targetElement.classList.contains('swiped')) {
        const letter = targetElement.dataset.letter!;
        const originalIndex = parseInt(targetElement.dataset.originalIndex!, 10);
        targetElement.classList.add('swiped');
        currentSwipePath.push({ letter, originalIndex, element: targetElement, centerX: (targetElement as any).canvasCenterX, centerY: (targetElement as any).canvasCenterY });
        triggerHapticFeedback('light');
        soundManager.playConnect();
        updateCurrentSwipedWordDisplay();
        drawSwipeLines();
    } else if (targetElement && targetElement.classList.contains('letter-button') && targetElement.classList.contains('swiped')) {
        if (currentSwipePath.length > 1 && currentSwipePath[currentSwipePath.length - 2].element === targetElement) {
            const removed = currentSwipePath.pop();
            if (removed) removed.element.classList.remove('swiped');
            updateCurrentSwipedWordDisplay();
            drawSwipeLines();
        }
    }
}

function handlePointerUp(event: PointerEvent) {
    if (!isSwiping) return;
    event.preventDefault();
    isSwiping = false;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
    const wordToCheck = currentSwipePath.map(item => item.letter).join('');
    processSubmittedWord(wordToCheck);
    clearSwipeState();
}


function drawSwipeLines() {
    swipeLineCtx.clearRect(0, 0, swipeLineCanvas.width, swipeLineCanvas.height);
    if (currentSwipePath.length < 2) return;
    swipeLineCtx.beginPath();
    swipeLineCtx.moveTo(currentSwipePath[0].centerX, currentSwipePath[0].centerY);
    for (let i = 1; i < currentSwipePath.length; i++) swipeLineCtx.lineTo(currentSwipePath[i].centerX, currentSwipePath[i].centerY);
    swipeLineCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--letter-button-swiped-bg') || 'rgba(255, 160, 0, 0.7)';
    swipeLineCtx.lineWidth = 10;
    swipeLineCtx.lineCap = 'round';
    swipeLineCtx.lineJoin = 'round';
    swipeLineCtx.stroke();
}

function clearSwipeState() {
    currentSwipePath.forEach(item => item.element.classList.remove('swiped'));
    currentSwipePath = [];
    updateCurrentSwipedWordDisplay();
    swipeLineCtx.clearRect(0, 0, swipeLineCanvas.width, swipeLineCanvas.height);
}

function isWordFormable(word: string, letters: string[]): boolean {
    const tempLetters = [...letters];
    for (const char of word) {
        const index = tempLetters.indexOf(char);
        if (index === -1) return false;
        tempLetters.splice(index, 1);
    }
    return true;
}

function processSubmittedWord(word: string) {
    if (!currentPlayingLevel) return;
    const wordToCheck = word.toUpperCase();

    if (wordToCheck.length < (currentPlayingLevel.letters.length >= 3 ? 2 : 3) && wordToCheck.length > 0 && currentPlayingLevel.letters.length >= 3) {
        if (wordToCheck.length < 2 && currentPlayingLevel.letters.length >= 2) {
            // Allow 2 letter words if level has 2 letters for example.
        } else if (wordToCheck.length < 3) {
            showFeedback(`Word too short (min 3 letters for most puzzles).`, false, false, 1500);
            triggerScreenShake();
            clearSwipeState();
            currentWordDisplay.textContent = '';
            return;
        }
    }
    if (wordToCheck.length === 0) {
        clearSwipeState();
        currentWordDisplay.textContent = '';
        return;
    }

    if (!isWordFormable(wordToCheck, availableLetters)) {
        if (wordToCheck.length >= (currentPlayingLevel.letters.length >= 3 ? 2 : 3)) {
            showFeedback(`"${wordToCheck}" uses letters not on the wheel.`, false, false, 1500);
            triggerScreenShake();
        }
        clearSwipeState();
        currentWordDisplay.textContent = '';
        return;
    }


    if (currentPlayingLevel.targetWords.includes(wordToCheck) && !foundWords.includes(wordToCheck)) {
        foundWords.push(wordToCheck);
        score += wordToCheck.length * 10;
        coins += wordToCheck.length;
        showFeedback(`Correct! "${wordToCheck}" added.`, true);
        triggerHapticFeedback('success');
        renderWordGrid();
        updateScoreboardAndCoins();
        saveProgress(); // Save after coin update

        const allRequiredWordsFound = currentPlayingLevel.targetWords.every(w => foundWords.includes(w));
        if (allRequiredWordsFound) {
            currentPlayingLevel.completed = true;
            unlockNextLevel(currentPlayingLevel);
            saveProgress(); // Save after level completion and unlock
            showFeedback(`Level Complete! All words found.`, true, true);
            soundManager.playLevelComplete();
        }

    } else if (foundWords.includes(wordToCheck)) {
        showFeedback(`"${wordToCheck}" already found.`, false, false, 1500);
        triggerScreenShake();
    } else if (isWordFormable(wordToCheck, availableLetters) &&
        !bonusWordsFound.includes(wordToCheck) &&
        !currentPlayingLevel.targetWords.includes(wordToCheck) &&
        wordToCheck.length >= (currentPlayingLevel.letters.length >= 4 ? 3 : 2)) {

        if (!dictionaryManager.isValid(wordToCheck)) {
            showFeedback(`"${wordToCheck}" is not a valid word.`, false, false, 1500);
            triggerScreenShake();
            clearSwipeState();
            currentWordDisplay.textContent = '';
            return;
        }

        bonusWordsFound.push(wordToCheck);
        coins += BONUS_COIN_VALUE;
        updateScoreboardAndCoins();
        renderBonusWordsList();
        updateBonusBadgeOnAllScreens(newBonusWordsCount + 1);
        showFeedback(`Bonus word: "${wordToCheck}"! +${BONUS_COIN_VALUE} coin.`, true, false, 2000);
        triggerHapticFeedback('success');
        soundManager.playBonus();

        if (bonusWordsFound.length === 1 && localStorage.getItem('bonusTipShown') !== 'true') {
            showBonusTip();
        }
        saveProgress();
    } else if (bonusWordsFound.includes(wordToCheck)) {
        showFeedback(`Bonus "${wordToCheck}" already found.`, false, false, 1500);
        triggerScreenShake();
    } else {
        if (wordToCheck.length >= (currentPlayingLevel.letters.length >= 4 ? 3 : 2)) {
            showFeedback(`"${wordToCheck}" is not a target word.`, false, false, 1500);
            triggerScreenShake();
        }
    }
    currentWordDisplay.textContent = '';
    clearSwipeState();
}

function triggerScreenShake() {
    gameContainer.classList.add('screen-shake');
    triggerHapticFeedback('error');
    setTimeout(() => gameContainer.classList.remove('screen-shake'), 300);
}

function handleShuffleLetters() {
    if (coins < SHUFFLE_COST) {
        showFeedback("Not enough coins to shuffle!", false);
        triggerScreenShake();
        return;
    }

    coins -= SHUFFLE_COST;
    updateScoreboardAndCoins();
    saveProgress();
    soundManager.playSelect();

    // Fisher-Yates shuffle algorithm
    for (let i = availableLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableLetters[i], availableLetters[j]] = [availableLetters[j], availableLetters[i]];
    }

    clearSwipeState();
    renderLetters(); // Re-render the letter wheel with new positions
    showFeedback("Letters shuffled!", true, false, 1000);
    triggerHapticFeedback('light');
}

function handleHint() {
    if (!currentPlayingLevel) return;
    if (coins < HINT_COST) {
        showFeedback("Not enough coins for a hint!", false);
        return;
    }

    const unfoundWordsInLevel = currentPlayingLevel.targetWords.filter(w => !foundWords.includes(w));
    if (unfoundWordsInLevel.length === 0) {
        showFeedback("No more hints available for this level.", false, false, 2000);
        return;
    }
    unfoundWordsInLevel.sort((a, b) => (a.length - b.length) || a.localeCompare(b));
    const hintWord = unfoundWordsInLevel[0];

    if (!isWordFormable(hintWord, availableLetters)) {
        showFeedback(`Cannot provide hint for "${hintWord}" - letters unavailable. (Data issue)`, false, false, 3000);
        console.error(`Hint failed: Word "${hintWord}" from targetWords is not formable with letters: ${availableLetters.join(',')}`);
        return;
    }

    coins -= HINT_COST;
    updateScoreboardAndCoins();

    foundWords.push(hintWord);
    renderWordGrid(); // Re-render to show the hinted word

    // Highlight the hinted word tiles
    const wordRows = wordGridContainerEl.querySelectorAll('.word-row');
    wordRows.forEach(row => {
        const tiles = Array.from(row.querySelectorAll('.letter-tile'));
        const wordOnRow = tiles.map(tile => (tile as HTMLElement).dataset.letterContent || '').join(''); // Assuming you might store original letter if needed
        if (tiles.length === hintWord.length) { // Basic check, refine if multiple words of same length
            let potentialMatch = true;
            for (let i = 0; i < tiles.length; i++) {
                if (!tiles[i].classList.contains('empty') && tiles[i].textContent !== hintWord[i]) {
                    potentialMatch = false;
                    break;
                }
            }
            // This logic for finding the correct row is simplistic.
            // A robust way: give each .word-row an ID or data-word attribute
            // For now, we assume the first empty row of correct length is it, or update the one that becomes filled
            if (potentialMatch && foundWords.includes(hintWord)) { // Check if it's the one we just added
                tiles.forEach((tile, i) => {
                    if (tile.textContent === hintWord[i]) { // Check if tile now displays the correct letter
                        tile.classList.add('hinted-reveal');
                        setTimeout(() => tile.classList.remove('hinted-reveal'), 600);
                    }
                });
            }
        }
    });


    showFeedback(`Hint: "${hintWord}" added!`, true, false, 2500);
    saveProgress(); // Save after hint processed and coins updated


    const allRequiredWordsFound = currentPlayingLevel.targetWords.every(w => foundWords.includes(w));
    if (allRequiredWordsFound) {
        currentPlayingLevel.completed = true;
        unlockNextLevel(currentPlayingLevel);
        saveProgress();
        showFeedback(`Level Complete! All words found.`, true, true);
    }
}

function handleRevealLetter() {
    if (!currentPlayingLevel) return;
    if (coins < REVEAL_LETTER_COST) {
        showFeedback("Not enough coins to reveal a letter!", false);
        return;
    }

    const unfoundWords = currentPlayingLevel.targetWords.filter(w => !foundWords.includes(w));
    if (unfoundWords.length === 0) {
        showFeedback("All words found, no letters to reveal.", false, false, 2000);
        return;
    }

    // Find all possible tiles to reveal
    const revealableTiles: { tile: HTMLElement, letter: string }[] = [];
    const wordRows = wordGridContainerEl.querySelectorAll('.word-row');

    // This is a bit tricky; we need to associate rows with unfound words.
    // Let's create a map of word length to unfound words.
    const unfoundWordsByLength: { [key: number]: string[] } = {};
    unfoundWords.forEach(word => {
        if (!unfoundWordsByLength[word.length]) {
            unfoundWordsByLength[word.length] = [];
        }
        unfoundWordsByLength[word.length].push(word);
    });

    wordRows.forEach(row => {
        const tiles = Array.from(row.querySelectorAll('.letter-tile'));
        if (unfoundWordsByLength[tiles.length]) {
            // This row corresponds to unfound words of this length.
            // Check if it's one of the unfound words by seeing if its filled letters match.
            const potentialWords = unfoundWordsByLength[tiles.length];

            potentialWords.forEach(potentialWord => {
                let isMatch = true;
                for (let i = 0; i < tiles.length; i++) {
                    if (!tiles[i].classList.contains('empty') && tiles[i].textContent !== potentialWord[i]) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    // This row could be this potentialWord. Add its empty tiles.
                    tiles.forEach((tile, i) => {
                        if (tile.classList.contains('empty')) {
                            revealableTiles.push({ tile: tile as HTMLElement, letter: potentialWord[i] });
                        }
                    });
                }
            });
        }
    });

    if (revealableTiles.length === 0) {
        showFeedback("No more letters to reveal in the current words.", false, false, 2000);
        return;
    }

    const randomTileInfo = revealableTiles[Math.floor(Math.random() * revealableTiles.length)];

    coins -= REVEAL_LETTER_COST;
    updateScoreboardAndCoins();
    saveProgress();

    randomTileInfo.tile.textContent = randomTileInfo.letter;
    randomTileInfo.tile.classList.remove('empty');
    randomTileInfo.tile.classList.add('filled', 'hinted-reveal'); // Re-use hint animation
    setTimeout(() => randomTileInfo.tile.classList.remove('hinted-reveal'), 600);


    showFeedback("A letter has been revealed!", true, false, 2000);
}


// --- Speech Recognition Logic ---
function initSpeechRecognition() {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
        speechRecognition = new SpeechRecognitionAPI();
        speechRecognition.continuous = false;
        speechRecognition.lang = 'en-US';
        speechRecognition.interimResults = false;
        speechRecognition.maxAlternatives = 1;

        speechRecognition.onresult = (event: any) => {
            const spokenWord = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
            currentWordDisplay.textContent = spokenWord;
            processSubmittedWord(spokenWord);
        };
        speechRecognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
                showFeedback(`Mic error: ${event.error}. Please try again or check permissions.`, false);
            } else {
                showFeedback(`Mic error: ${event.error}`, false);
            }
            stopListening();
        };
        speechRecognition.onend = () => {
            if (isListening) stopListening();
        };
    } else {
        showFeedback("Speech recognition not supported in this browser.", false);
        micButton.disabled = true;
    }
}

function handleMicButtonClick() {
    if (!speechRecognition) {
        showFeedback("Speech recognition not initialized.", false);
        return;
    }
    if (isListening) stopListening(); else startListening();
}

function startListening() {
    if (isSwiping) return;
    try {
        speechRecognition.start();
        isListening = true;
        micButton.classList.add('mic-listening');
        micButton.disabled = true;
        showFeedback("Listening...", true, false, 2000);
    } catch (e) {
        console.error("Error starting speech recognition:", e);
        stopListening();
        showFeedback("Mic busy. Try again.", false);
    }
}

function stopListening() {
    if (speechRecognition && isListening) speechRecognition.stop();
    isListening = false;
    micButton.classList.remove('mic-listening');
    micButton.disabled = false;
}

// --- Bonus Words Functions ---
function renderBonusWordsList() {
    bonusWordsListDiv.innerHTML = '';
    const sortedBonusWords = [...bonusWordsFound].sort();
    sortedBonusWords.forEach(word => {
        const entry = document.createElement('div');
        entry.classList.add('bonus-word-entry');
        entry.innerHTML = `<span class="material-symbols-outlined">paid</span> ${word}`;
        bonusWordsListDiv.appendChild(entry);
    });
}

function openBonusModal() {
    renderBonusWordsList();
    bonusWordsModal.classList.remove('hidden');
    updateBonusBadgeOnAllScreens(0);
}

function closeBonusModal() {
    bonusWordsModal.classList.add('hidden');
}

function updateBonusBadgeOnAllScreens(count: number) {
    if (count > 0) newBonusWordsCount = count; else newBonusWordsCount = 0;

    const badges = [gameBonusBadge, roadmapBonusBadge];
    badges.forEach(badge => {
        if (newBonusWordsCount > 0) {
            badge.textContent = String(newBonusWordsCount);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}


function showBonusTip() {
    if (localStorage.getItem('bonusTipShown') !== 'true') {
        bonusWordsTip.classList.remove('hidden');
    }
}

function hideBonusTip() {
    bonusWordsTip.classList.add('hidden');
    localStorage.setItem('bonusTipShown', 'true');
}

// --- Progress & Level Unlocking ---
function findNextLevel(currentLevel: LevelDefinition | null): LevelDefinition | null {
    if (!currentLevel) return null;
    const currentWorld = gameRoadmap.find(w => w.id === currentLevel.worldId);
    if (!currentWorld) return null;

    const currentLevelIndexInWorld = currentWorld.levels.findIndex(l => l.id === currentLevel.id);
    if (currentLevelIndexInWorld !== -1 && currentLevelIndexInWorld < currentWorld.levels.length - 1) {
        return currentWorld.levels[currentLevelIndexInWorld + 1];
    } else {
        const currentWorldIndex = gameRoadmap.findIndex(w => w.id === currentWorld.id);
        if (currentWorldIndex !== -1 && currentWorldIndex < gameRoadmap.length - 1) {
            const nextWorld = gameRoadmap[currentWorldIndex + 1];
            if (nextWorld.levels.length > 0) return nextWorld.levels[0];
        }
    }
    return null;
}

function unlockNextLevel(completedLevel: LevelDefinition) {
    const nextLevel = findNextLevel(completedLevel);
    if (nextLevel) {
        nextLevel.unlocked = true;
    }
}

function isWorldCompleted(worldId: string): boolean {
    const world = gameRoadmap.find(w => w.id === worldId);
    if (!world) return false;
    return world.levels.every(l => l.completed);
}

function saveProgress() {
    const progress = {
        coins: coins,
        bonusWordsFound: bonusWordsFound,
        gameRoadmap: gameRoadmap,
        settings: gameSettings
    };
    localStorage.setItem('wordFinderDeluxeProgress', JSON.stringify(progress));
}


function getInitialDefaultRoadmap(): WorldDefinition[] {
    const rawData = [
        {
            id: "tutorial", name: "Tutorial", levels: [
                { letters: ['A', 'T'], targetWords: ["AT"] },
                { letters: ['C', 'A', 'T'], targetWords: ["CAT", "ACT"] },
                { letters: ['D', 'O', 'G'], targetWords: ["DOG", "GOD"] },
                { letters: ['S', 'U', 'N'], targetWords: ["SUN"] },
                { letters: ['P', 'E', 'N'], targetWords: ["PEN"] }
            ]
        },
        {
            id: "kitchen", name: "Culinary Chaos", levels: [
                { letters: ['E', 'G', 'G', 'S'], targetWords: ["EGGS", "EGG"] },
                { letters: ['P', 'A', 'N', 'S'], targetWords: ["PANS", "PAN", "NAP", "SNAP"] },
                { letters: ['C', 'O', 'O', 'K'], targetWords: ["COOK"] },
                { letters: ['F', 'O', 'R', 'K'], targetWords: ["FORK"] },
                { letters: ['D', 'I', 'S', 'H'], targetWords: ["DISH"] },
                { letters: ['M', 'E', 'A', 'L'], targetWords: ["MEAL", "MALE"] },
                { letters: ['B', 'A', 'K', 'E'], targetWords: ["BAKE"] },
                { letters: ['S', 'O', 'U', 'P'], targetWords: ["SOUP"] }
            ]
        },
        {
            id: "forest", name: "Whispering Woods", levels: [
                { letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE", "TEE"] },
                { letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"] },
                { letters: ['W', 'O', 'O', 'D'], targetWords: ["WOOD"] },
                { letters: ['B', 'I', 'R', 'D'], targetWords: ["BIRD", "RID"] },
                { letters: ['D', 'E', 'E', 'R'], targetWords: ["DEER", "REED"] },
                { letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR", "ARE", "BAR"] },
                { letters: ['L', 'A', 'K', 'E'], targetWords: ["LAKE"] },
                { letters: ['F', 'R', 'O', 'G'], targetWords: ["FROG"] }
            ]
        },
        {
            id: "ocean", name: "Deep Blue", levels: [
                { letters: ['F', 'I', 'S', 'H'], targetWords: ["FISH"] },
                { letters: ['W', 'A', 'V', 'E'], targetWords: ["WAVE", "AVE"] },
                { letters: ['B', 'O', 'A', 'T'], targetWords: ["BOAT"] },
                { letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"] },
                { letters: ['S', 'H', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP"] },
                { letters: ['S', 'E', 'A', 'L'], targetWords: ["SEAL", "SEA", "ALE"] },
                { letters: ['D', 'I', 'V', 'E'], targetWords: ["DIVE"] },
                { letters: ['S', 'W', 'I', 'M'], targetWords: ["SWIM"] }
            ]
        },
        {
            id: "space", name: "Cosmic Voyage", levels: [
                { letters: ['S', 'T', 'A', 'R'], targetWords: ["STAR", "RAT", "ART", "TAR"] },
                { letters: ['M', 'O', 'O', 'N'], targetWords: ["MOON", "MOO"] },
                { letters: ['M', 'A', 'R', 'S'], targetWords: ["MARS", "ARM", "RAM"] },
                { letters: ['S', 'U', 'N', 'S'], targetWords: ["SUNS", "SUN"] },
                { letters: ['V', 'O', 'I', 'D'], targetWords: ["VOID"] },
                { letters: ['N', 'O', 'V', 'A'], targetWords: ["NOVA"] },
                { letters: ['A', 'T', 'O', 'M'], targetWords: ["ATOM"] },
                { letters: ['G', 'L', 'O', 'W'], targetWords: ["GLOW", "LOW", "OWL"] }
            ]
        },
        {
            id: "desert", name: "Desert Heat", levels: [
                { letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"] },
                { letters: ['D', 'U', 'N', 'E'], targetWords: ["DUNE", "DUE"] },
                { letters: ['H', 'E', 'A', 'T'], targetWords: ["HEAT", "HAT", "EAT"] },
                { letters: ['C', 'A', 'M', 'E', 'L'], targetWords: ["CAMEL", "MEAL", "MALE"] },
                { letters: ['O', 'A', 'S', 'I', 'S'], targetWords: ["OASIS"] },
                { letters: ['P', 'A', 'L', 'M'], targetWords: ["PALM", "MAP", "LAP"] },
                { letters: ['D', 'U', 'S', 'T'], targetWords: ["DUST"] },
                { letters: ['W', 'A', 'N', 'D'], targetWords: ["WAND"] }
            ]
        },
        {
            id: "arctic", name: "Frozen Tundra", levels: [
                { letters: ['I', 'C', 'E', 'S'], targetWords: ["ICES", "ICE"] },
                { letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "NOW", "OWN", "WON"] },
                { letters: ['C', 'O', 'L', 'D'], targetWords: ["COLD", "OLD", "COD"] },
                { letters: ['S', 'E', 'A', 'L'], targetWords: ["SEAL", "SEA", "ALE"] },
                { letters: ['P', 'O', 'L', 'E'], targetWords: ["POLE"] },
                { letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR", "ARE", "BAR"] },
                { letters: ['F', 'R', 'O', 'S', 'T'], targetWords: ["FROST", "SOFT", "ROTS"] },
                { letters: ['H', 'A', 'I', 'L'], targetWords: ["HAIL"] }
            ]
        },
        {
            id: "mountain", name: "Mystic Peaks", levels: [
                { letters: ['P', 'E', 'A', 'K'], targetWords: ["PEAK", "APE", "KEA"] },
                { letters: ['H', 'I', 'K', 'E'], targetWords: ["HIKE"] },
                { letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "SOW", "WON"] },
                { letters: ['C', 'L', 'I', 'M', 'B'], targetWords: ["CLIMB", "LIMB"] },
                { letters: ['M', 'O', 'S', 'S'], targetWords: ["MOSS"] },
                { letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK"] },
                { letters: ['C', 'O', 'L', 'D'], targetWords: ["COLD", "OLD"] },
                { letters: ['V', 'I', 'E', 'W'], targetWords: ["VIEW"] }
            ]
        },
        {
            id: "jungle", name: "Rainforest", levels: [
                { letters: ['A', 'P', 'E', 'S'], targetWords: ["APES", "APE", "SEA"] },
                { letters: ['V', 'I', 'N', 'E'], targetWords: ["VINE", "VIE"] },
                { letters: ['R', 'A', 'I', 'N'], targetWords: ["RAIN", "RAN", "AIR"] },
                { letters: ['F', 'R', 'O', 'G'], targetWords: ["FROG"] },
                { letters: ['T', 'I', 'G', 'E', 'R'], targetWords: ["TIGER", "TIER", "GRIT"] },
                { letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE"] },
                { letters: ['W', 'I', 'L', 'D'], targetWords: ["WILD"] },
                { letters: ['F', 'E', 'L', 'L'], targetWords: ["FELL"] }
            ]
        },
        {
            id: "city", name: "Neon City", levels: [
                { letters: ['C', 'A', 'R', 'S'], targetWords: ["CARS", "CAR", "ARC"] },
                { letters: ['B', 'I', 'K', 'E'], targetWords: ["BIKE"] },
                { letters: ['T', 'A', 'X', 'I'], targetWords: ["TAXI"] },
                { letters: ['R', 'O', 'A', 'D'], targetWords: ["ROAD"] },
                { letters: ['P', 'A', 'R', 'K'], targetWords: ["PARK", "RAPA"] },
                { letters: ['W', 'A', 'L', 'K'], targetWords: ["WALK"] },
                { letters: ['S', 'T', 'O', 'P'], targetWords: ["STOP", "TOP", "POT"] },
                { letters: ['M', 'E', 'T', 'R', 'O'], targetWords: ["METRO", "MORE", "ROME"] }
            ]
        },
        {
            id: "meadow", name: "Blossom Meadow", levels: [
                { letters: ['B', 'E', 'E', 'S'], targetWords: ["BEES", "BEE", "SEE"] },
                { letters: ['F', 'L', 'O', 'W'], targetWords: ["FLOW", "LOW", "OWL"] },
                { letters: ['L', 'I', 'L', 'Y'], targetWords: ["LILY"] },
                { letters: ['P', 'I', 'N', 'K'], targetWords: ["PINK"] },
                { letters: ['R', 'O', 'S', 'E'], targetWords: ["ROSE", "SORE"] },
                { letters: ['L', 'A', 'W', 'N'], targetWords: ["LAWN"] },
                { letters: ['W', 'E', 'E', 'D'], targetWords: ["WEED"] },
                { letters: ['F', 'L', 'U', 'S', 'H'], targetWords: ["FLUSH"] }
            ]
        },
        {
            id: "volcano", name: "Volcanic Vent", levels: [
                { letters: ['A', 'S', 'H'], targetWords: ["ASH", "HAS"] },
                { letters: ['L', 'A', 'V', 'A'], targetWords: ["LAVA"] },
                { letters: ['F', 'I', 'R', 'E'], targetWords: ["FIRE", "IRE"] },
                { letters: ['H', 'E', 'A', 'T'], targetWords: ["HEAT", "HAT", "EAT"] },
                { letters: ['L', 'A', 'V', 'A', 'S'], targetWords: ["LAVAS", "LAVA"] },
                { letters: ['C', 'O', 'R', 'E'], targetWords: ["CORE"] },
                { letters: ['R', 'O', 'K', 'S'], targetWords: ["ROKS"] },
                { letters: ['F', 'L', 'A', 'M', 'E'], targetWords: ["FLAME", "MEAL", "MALE", "LAME"] }
            ]
        },
        {
            id: "sky", name: "Sky Fortress", levels: [
                { letters: ['A', 'I', 'R'], targetWords: ["AIR"] },
                { letters: ['B', 'I', 'R', 'D'], targetWords: ["BIRD", "RID"] },
                { letters: ['W', 'I', 'N', 'D'], targetWords: ["WIND", "WIN", "DIN"] },
                { letters: ['C', 'L', 'O', 'U', 'D'], targetWords: ["CLOUD", "LOUD", "COLD"] },
                { letters: ['S', 'T', 'O', 'R', 'M'], targetWords: ["STORM", "MOST", "SORT"] },
                { letters: ['H', 'I', 'G', 'H'], targetWords: ["HIGH"] },
                { letters: ['B', 'L', 'U', 'E'], targetWords: ["BLUE"] },
                { letters: ['W', 'I', 'N', 'G'], targetWords: ["WING"] }
            ]
        },
        {
            id: "crystal", name: "Crystal Caverns", levels: [
                { letters: ['G', 'E', 'M', 'S'], targetWords: ["GEMS", "GEM"] },
                { letters: ['G', 'O', 'L', 'D'], targetWords: ["GOLD", "OLD", "GOD"] },
                { letters: ['M', 'I', 'N', 'E'], targetWords: ["MINE"] },
                { letters: ['O', 'R', 'E'], targetWords: ["ORE", "ROE"] },
                { letters: ['C', 'A', 'V', 'E'], targetWords: ["CAVE"] },
                { letters: ['G', 'L', 'O', 'W', 'S'], targetWords: ["GLOWS", "GLOW", "LOWS", "SLOW"] },
                { letters: ['P', 'R', 'I', 'Z', 'E'], targetWords: ["PRIZE"] },
                { letters: ['R', 'A', 'R', 'E'], targetWords: ["RARE", "REAR", "ERA"] },
                { letters: ['R', 'O', 'C', 'K', 'S'], targetWords: ["ROCKS", "ROCK", "CORK"] }
            ]
        },
        {
            id: "cyber", name: "Cyber City", levels: [
                { letters: ['D', 'A', 'T', 'A'], targetWords: ["DATA"] },
                { letters: ['B', 'I', 'T', 'S'], targetWords: ["BITS", "BIT", "ITS"] },
                { letters: ['C', 'O', 'D', 'E'], targetWords: ["CODE", "DOC", "DOE"] },
                { letters: ['H', 'A', 'C', 'K'], targetWords: ["HACK"] },
                { letters: ['C', 'H', 'I', 'P'], targetWords: ["CHIP", "HIP", "SIP", "PIC"] },
                { letters: ['B', 'Y', 'T', 'E'], targetWords: ["BYTE", "YEB"] },
                { letters: ['S', 'C', 'A', 'N'], targetWords: ["SCAN", "CAN", "SAN"] },
                { letters: ['U', 'S', 'E', 'R'], targetWords: ["USER", "SUE", "USE"] },
                { letters: ['L', 'I', 'N', 'K'], targetWords: ["LINK", "NIL", "KIN"] },
                { letters: ['W', 'A', 'T', 'C', 'H'], targetWords: ["WATCH", "HAT", "CAT"] }
            ]
        },
        {
            id: "ruins", name: "Ancient Ruins", levels: [
                { letters: ['O', 'L', 'D'], targetWords: ["OLD"] },
                { letters: ['D', 'U', 'S', 'T'], targetWords: ["DUST"] },
                { letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK"] },
                { letters: ['G', 'O', 'L', 'D'], targetWords: ["GOLD", "OLD", "GOD"] },
                { letters: ['L', 'O', 'S', 'T'], targetWords: ["LOST", "SLOT", "LOT"] },
                { letters: ['P', 'A', 'T', 'H'], targetWords: ["PATH", "HAT", "PAT"] },
                { letters: ['G', 'A', 'T', 'E'], targetWords: ["GATE", "ATE", "TEA"] },
                { letters: ['T', 'O', 'M', 'B'], targetWords: ["TOMB"] },
                { letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"] },
                { letters: ['S', 'T', 'O', 'N', 'E'], targetWords: ["STONE", "TONE", "NET", "TEN"] }
            ]
        },
        {
            id: "steam", name: "Steam Haven", levels: [
                { letters: ['G', 'E', 'A', 'R'], targetWords: ["GEAR", "ARE", "AGE"] },
                { letters: ['C', 'O', 'G', 'S'], targetWords: ["COGS", "COG"] },
                { letters: ['I', 'R', 'O', 'N'], targetWords: ["IRON", "NOR", "ION"] },
                { letters: ['P', 'I', 'P', 'E'], targetWords: ["PIPE"] },
                { letters: ['R', 'U', 'S', 'T'], targetWords: ["RUST", "RUT"] },
                { letters: ['V', 'A', 'L', 'V', 'E'], targetWords: ["VALVE"] },
                { letters: ['S', 'T', 'E', 'A', 'M'], targetWords: ["STEAM", "TEAM", "MET", "EAT"] },
                { letters: ['B', 'E', 'L', 'T'], targetWords: ["BELT", "LET", "BET"] },
                { letters: ['W', 'H', 'E', 'E', 'L'], targetWords: ["WHEEL", "HEL", "LEE"] },
                { letters: ['S', 'M', 'O', 'K', 'E'], targetWords: ["SMOKE", "SOME"] }
            ]
        },
        {
            id: "enchanted", name: "Enchanted Garden", levels: [
                { letters: ['F', 'A', 'E'], targetWords: ["FAE"] },
                { letters: ['W', 'I', 'S', 'P'], targetWords: ["WISP"] },
                { letters: ['L', 'U', 'M', 'A'], targetWords: ["LUMA"] },
                { letters: ['M', 'A', 'G', 'I', 'C'], targetWords: ["MAGIC", "MIG", "AIM"] },
                { letters: ['P', 'E', 'T', 'A', 'L'], targetWords: ["PETAL", "PLATE", "PALE", "TEAL"] },
                { letters: ['F', 'L', 'O', 'R', 'A'], targetWords: ["FLORA", "OAR", "FOR"] },
                { letters: ['V', 'I', 'N', 'E'], targetWords: ["VINE", "VIE"] },
                { letters: ['W', 'A', 'N', 'D'], targetWords: ["WAND"] },
                { letters: ['G', 'L', 'O', 'W'], targetWords: ["GLOW", "LOW", "OWL"] },
                { letters: ['M', 'O', 'O', 'N'], targetWords: ["MOON", "MOO"] }
            ]
        },
        {
            id: "ghost", name: "Ghostly Grotto", levels: [
                { letters: ['B', 'O', 'O'], targetWords: ["BOO"] },
                { letters: ['F', 'O', 'G'], targetWords: ["FOG"] },
                { letters: ['D', 'A', 'R', 'K'], targetWords: ["DARK", "ARK", "RAD"] },
                { letters: ['G', 'H', 'O', 'S', 'T'], targetWords: ["GHOST", "HOS", "GOT"] },
                { letters: ['B', 'O', 'N', 'E'], targetWords: ["BONE", "ONE", "BEN"] },
                { letters: ['S', 'C', 'A', 'R', 'Y'], targetWords: ["SCARY", "SAY", "RAY", "CAR"] },
                { letters: ['M', 'I', 'S', 'T'], targetWords: ["MIST", "ITS", "SIT"] },
                { letters: ['H', 'A', 'U', 'N', 'T'], targetWords: ["HAUNT", "AUT", "TAN"] },
                { letters: ['C', 'O', 'L', 'D'], targetWords: ["COLD", "OLD"] },
                { letters: ['N', 'I', 'G', 'H', 'T'], targetWords: ["NIGHT", "GIN", "HIT", "TIN"] }
            ]
        },
        {
            id: "sakura", name: "Sakura Peak", levels: [
                { letters: ['Z', 'E', 'N'], targetWords: ["ZEN"] },
                { letters: ['S', 'U', 'N'], targetWords: ["SUN"] },
                { letters: ['M', 'O', 'U', 'N', 'T'], targetWords: ["MOUNT", "NUT", "OUT", "NOT"] },
                { letters: ['P', 'E', 'A', 'K'], targetWords: ["PEAK", "KEA", "APE"] },
                { letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"] },
                { letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE", "TEE"] },
                { letters: ['C', 'O', 'L', 'D'], targetWords: ["COLD", "OLD", "COD"] },
                { letters: ['V', 'I', 'E', 'W'], targetWords: ["VIEW"] },
                { letters: ['R', 'I', 'C', 'E'], targetWords: ["RICE", "ICE"] },
                { letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "NOW", "OWN", "WON"] }
            ]
        },
        {
            id: "mars", name: "Mars Colony", levels: [
                { letters: ['R', 'E', 'D'], targetWords: ["RED"] },
                { letters: ['M', 'A', 'R', 'S'], targetWords: ["MARS", "ARM", "RAM"] },
                { letters: ['D', 'U', 'S', 'T'], targetWords: ["DUST", "RUT"] },
                { letters: ['B', 'A', 'S', 'E'], targetWords: ["BASE", "SEA", "ABS"] },
                { letters: ['R', 'O', 'V', 'E', 'R'], targetWords: ["ROVER", "OVER", "ROE"] },
                { letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK", "CORK"] },
                { letters: ['L', 'I', 'F', 'E'], targetWords: ["LIFE", "LIE", "FIL"] },
                { letters: ['V', 'O', 'I', 'D'], targetWords: ["VOID"] },
                { letters: ['O', 'X', 'Y', 'G', 'E', 'N'], targetWords: ["OXYGEN", "YEN", "ONE", "EGO"] },
                { letters: ['S', 'P', 'R', 'I', 'N', 'T'], targetWords: ["SPRINT", "PIN", "TIN", "SIN"] }
            ]
        },
        {
            id: "viking", name: "Viking Fjord", levels: [
                { letters: ['S', 'E', 'A'], targetWords: ["SEA"] },
                { letters: ['I', 'C', 'E'], targetWords: ["ICE"] },
                { letters: ['A', 'X', 'E'], targetWords: ["AXE"] },
                { letters: ['S', 'H', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP"] },
                { letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "NOW", "OWN"] },
                { letters: ['F', 'J', 'O', 'R', 'D'], targetWords: ["FJORD", "FOR", "ROD"] },
                { letters: ['K', 'I', 'N', 'G'], targetWords: ["KING", "GIN", "INK"] },
                { letters: ['H', 'O', 'L', 'D'], targetWords: ["HOLD", "OLD", "LOD"] },
                { letters: ['W', 'A', 'R'], targetWords: ["WAR", "RAW"] },
                { letters: ['N', 'O', 'R', 'S', 'E'], targetWords: ["NORSE", "ROSE", "ROE", "ONE", "SON"] }
            ]
        },
        {
            id: "pirate", name: "Pirate Cove", levels: [
                { letters: ['B', 'A', 'Y'], targetWords: ["BAY"] },
                { letters: ['S', 'E', 'A'], targetWords: ["SEA", "AES"] },
                { letters: ['G', 'O', 'L', 'D'], targetWords: ["GOLD", "OLD", "GOD"] },
                { letters: ['S', 'H', 'I', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP"] },
                { letters: ['C', 'R', 'E', 'W'], targetWords: ["CREW", "ARE", "EWE"] },
                { letters: ['M', 'A', 'P', 'S'], targetWords: ["MAPS", "MAP", "ASP", "PAM"] },
                { letters: ['I', 'S', 'L', 'E'], targetWords: ["ISLE", "LIE", "LES"] },
                { letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"] },
                { letters: ['C', 'A', 'V', 'E'], targetWords: ["CAVE"] },
                { letters: ['C', 'O', 'I', 'N'], targetWords: ["COIN", "ION", "CON"] }
            ]
        },
        {
            id: "candy", name: "Candy Kingdom", levels: [
                { letters: ['G', 'U', 'M'], targetWords: ["GUM"] },
                { letters: ['P', 'O', 'P'], targetWords: ["POP"] },
                { letters: ['S', 'W', 'E', 'E', 'T'], targetWords: ["SWEET", "TEE", "SET", "WET"] },
                { letters: ['L', 'O', 'L', 'L', 'Y'], targetWords: ["LOLLY"] },
                { letters: ['C', 'A', 'K', 'E'], targetWords: ["CAKE"] },
                { letters: ['M', 'I', 'L', 'K'], targetWords: ["MILK"] },
                { letters: ['P', 'I', 'N', 'K'], targetWords: ["PINK"] },
                { letters: ['S', 'O', 'F', 'T'], targetWords: ["SOFT"] },
                { letters: ['M', 'I', 'N', 'T'], targetWords: ["MINT", "TIN", "NIT"] },
                { letters: ['S', 'U', 'G', 'A', 'R'], targetWords: ["SUGAR", "RAG", "GAS", "SUE"] }
            ]
        },
        {
            id: "underground", name: "The Deep", levels: [
                { letters: ['D', 'I', 'G'], targetWords: ["DIG"] },
                { letters: ['D', 'I', 'R', 'T'], targetWords: ["DIRT", "RID"] },
                { letters: ['M', 'U', 'D'], targetWords: ["MUD"] },
                { letters: ['C', 'A', 'V', 'E'], targetWords: ["CAVE"] },
                { letters: ['S', 'O', 'I', 'L'], targetWords: ["SOIL", "OIL"] },
                { letters: ['M', 'I', 'N', 'E'], targetWords: ["MINE"] },
                { letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK"] },
                { letters: ['D', 'E', 'E', 'P'], targetWords: ["DEEP"] },
                { letters: ['W', 'O', 'R', 'M'], targetWords: ["WORM"] },
                { letters: ['D', 'A', 'R', 'K'], targetWords: ["DARK"] }
            ]
        },
        {
            id: "safari", name: "Wild Safari", levels: [
                { letters: ['L', 'I', 'O', 'N'], targetWords: ["LION", "NIL", "ION"] },
                { letters: ['W', 'I', 'L', 'D'], targetWords: ["WILD", "LID"] },
                { letters: ['P', 'L', 'A', 'I', 'N'], targetWords: ["PLAIN", "PLAN", "NAP", "PAN", "PIN"] },
                { letters: ['Z', 'E', 'B', 'R', 'A'], targetWords: ["ZEBRA", "ARE", "BAR"] },
                { letters: ['C', 'A', 'M', 'P'], targetWords: ["CAMP", "MAP", "CAP"] },
                { letters: ['B', 'I', 'R', 'D'], targetWords: ["BIRD"] },
                { letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE"] },
                { letters: ['H', 'U', 'N', 'T'], targetWords: ["HUNT"] },
                { letters: ['R', 'O', 'A', 'R'], targetWords: ["ROAR"] },
                { letters: ['S', 'A', 'V', 'A', 'N', 'A'], targetWords: ["SAVANA", "VAN", "SAN"] }
            ]
        },
        {
            id: "circus", name: "Grand Circus", levels: [
                { letters: ['F', 'U', 'N'], targetWords: ["FUN"] },
                { letters: ['T', 'E', 'N', 'T'], targetWords: ["TENT", "TEN", "NET"] },
                { letters: ['L', 'I', 'O', 'N'], targetWords: ["LION"] },
                { letters: ['B', 'A', 'L', 'L'], targetWords: ["BALL", "ALL"] },
                { letters: ['S', 'H', 'O', 'W'], targetWords: ["SHOW", "WHO", "SOW"] },
                { letters: ['R', 'I', 'N', 'G'], targetWords: ["RING"] },
                { letters: ['H', 'O', 'O', 'P'], targetWords: ["HOOP"] },
                { letters: ['A', 'C', 'R', 'O'], targetWords: ["ACRO", "ARC", "CAR"] },
                { letters: ['J', 'U', 'M', 'P'], targetWords: ["JUMP"] },
                { letters: ['C', 'L', 'O', 'W', 'N'], targetWords: ["CLOWN", "LOW", "OWN"] }
            ]
        },
        {
            id: "medieval", name: "Knight's Tale", levels: [
                { letters: ['S', 'W', 'O', 'R', 'D'], targetWords: ["SWORD", "WORD", "ROD"] },
                { letters: ['K', 'I', 'N', 'G'], targetWords: ["KING"] },
                { letters: ['C', 'A', 'S', 'T', 'L', 'E'], targetWords: ["CASTLE", "LAST", "SALT", "SALE"] },
                { letters: ['F', 'O', 'R', 'T'], targetWords: ["FORT"] },
                { letters: ['H', 'E', 'R', 'O'], targetWords: ["HERO", "ROE"] },
                { letters: ['L', 'A', 'N', 'D'], targetWords: ["LAND", "AND"] },
                { letters: ['R', 'U', 'L', 'E'], targetWords: ["RULE"] },
                { letters: ['N', 'O', 'B', 'L', 'E'], targetWords: ["NOBLE", "ONE", "BEL"] },
                { letters: ['G', 'U', 'A', 'R', 'D'], targetWords: ["GUARD", "RAD", "RAG"] },
                { letters: ['K', 'N', 'I', 'G', 'H', 'T'], targetWords: ["KNIGHT", "THIN", "NIGHT", "TIN", "GIN"] }
            ]
        },
        {
            id: "future", name: "Neo Era", levels: [
                { letters: ['T', 'E', 'C', 'H'], targetWords: ["TECH"] },
                { letters: ['B', 'O', 'T'], targetWords: ["BOT"] },
                { letters: ['W', 'O', 'R', 'L', 'D'], targetWords: ["WORLD", "ROD", "OLD"] },
                { letters: ['C', 'I', 'T', 'Y'], targetWords: ["CITY"] },
                { letters: ['S', 'P', 'A', 'C', 'E'], targetWords: ["SPACE", "ACE", "SEA", "APE"] },
                { letters: ['S', 'T', 'A', 'R'], targetWords: ["STAR"] },
                { letters: ['G', 'L', 'O', 'W'], targetWords: ["GLOW"] },
                { letters: ['B', 'E', 'A', 'M'], targetWords: ["BEAM"] },
                { letters: ['V', 'I', 'E', 'W'], targetWords: ["VIEW"] },
                { letters: ['C', 'Y', 'B', 'E', 'R'], targetWords: ["CYBER", "BYE", "BEER"] }
            ]
        },
        {
            id: "library", name: "Ancient Library", levels: [
                { letters: ['B', 'O', 'O', 'K'], targetWords: ["BOOK"] },
                { letters: ['R', 'E', 'A', 'D'], targetWords: ["READ", "ERA", "RED"] },
                { letters: ['P', 'A', 'P', 'E', 'R'], targetWords: ["PAPER", "APE", "PER", "ARE"] },
                { letters: ['I', 'N', 'K'], targetWords: ["INK"] },
                { letters: ['P', 'E', 'N'], targetWords: ["PEN"] },
                { letters: ['S', 'H', 'E', 'L', 'F'], targetWords: ["SHELF", "SELF", "SHE"] },
                { letters: ['P', 'A', 'G', 'E'], targetWords: ["PAGE", "AGE"] },
                { letters: ['T', 'A', 'L', 'E'], targetWords: ["TALE", "ATE", "LET"] },
                { letters: ['K', 'N', 'O', 'W'], targetWords: ["KNOW", "NOW", "OWN"] },
                { letters: ['L', 'E', 'A', 'R', 'N'], targetWords: ["LEARN", "NEAR", "REAL", "EAR", "ERA"] }
            ]
        },
        {
            id: "toybox", name: "Block Land", levels: [
                { letters: ['B', 'L', 'O', 'C', 'K'], targetWords: ["BLOCK"] },
                { letters: ['T', 'O', 'Y'], targetWords: ["TOY"] },
                { letters: ['P', 'L', 'A', 'Y'], targetWords: ["PLAY", "PAY", "LAP"] },
                { letters: ['C', 'A', 'R'], targetWords: ["CAR"] },
                { letters: ['B', 'A', 'B', 'Y'], targetWords: ["BABY", "BAY"] },
                { letters: ['D', 'O', 'L', 'L'], targetWords: ["DOLL"] },
                { letters: ['K', 'I', 'T', 'E'], targetWords: ["KITE"] },
                { letters: ['G', 'A', 'M', 'E'], targetWords: ["GAME", "AGE", "GEM"] },
                { letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR"] },
                { letters: ['F', 'L', 'A', 'G'], targetWords: ["FLAG", "LAG", "GAL"] }
            ]
        },
        {
            id: "farm", name: "Quiet Farm", levels: [
                { letters: ['C', 'O', 'W'], targetWords: ["COW"] },
                { letters: ['P', 'I', 'G'], targetWords: ["PIG"] },
                { letters: ['H', 'E', 'N'], targetWords: ["HEN"] },
                { letters: ['D', 'O', 'G'], targetWords: ["DOG"] },
                { letters: ['C', 'A', 'T'], targetWords: ["CAT"] },
                { letters: ['C', 'O', 'R', 'N'], targetWords: ["CORN", "NOR", "CON"] },
                { letters: ['B', 'A', 'R', 'N'], targetWords: ["BARN", "BAN", "RAN"] },
                { letters: ['P', 'L', 'O', 'W'], targetWords: ["PLOW", "LOW", "OWL"] },
                { letters: ['S', 'E', 'E', 'D'], targetWords: ["SEED", "SEE"] },
                { letters: ['F', 'I', 'E', 'L', 'D'], targetWords: ["FIELD", "FILE", "DIE", "ELD"] }
            ]
        },
        {
            id: "bamboo", name: "Bamboo Forest", levels: [
                { letters: ['Z', 'E', 'N'], targetWords: ["ZEN"] },
                { letters: ['P', 'A', 'N', 'D', 'A'], targetWords: ["PANDA", "AND", "NAP", "PAN"] },
                { letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"] },
                { letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE"] },
                { letters: ['B', 'A', 'M', 'B', 'O', 'O'], targetWords: ["BAMBOO", "BOO", "MOB"] },
                { letters: ['G', 'L', 'O', 'W'], targetWords: ["GLOW"] },
                { letters: ['M', 'I', 'S', 'T'], targetWords: ["MIST"] },
                { letters: ['W', 'I', 'L', 'D'], targetWords: ["WILD"] },
                { letters: ['F', 'E', 'E', 'D'], targetWords: ["FEED"] },
                { letters: ['S', 'I', 'L', 'E', 'N', 'T'], targetWords: ["SILENT", "LINE", "LENT", "SENT", "TEN"] }
            ]
        },
        {
            id: "station", name: "Star Station", levels: [
                { letters: ['S', 'T', 'A', 'R'], targetWords: ["STAR", "RAT", "ART"] },
                { letters: ['S', 'H', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP"] },
                { letters: ['M', 'O', 'O', 'N'], targetWords: ["MOON", "MOO"] },
                { letters: ['V', 'O', 'I', 'D'], targetWords: ["VOID"] },
                { letters: ['A', 'T', 'O', 'M'], targetWords: ["ATOM"] },
                { letters: ['C', 'O', 'M', 'E', 'T'], targetWords: ["COMET", "MET", "COT"] },
                { letters: ['S', 'O', 'L', 'A', 'R'], targetWords: ["SOLAR", "OAR"] },
                { letters: ['P', 'L', 'A', 'N', 'E', 'T'], targetWords: ["PLANET", "PLANE", "PANT", "TEN"] },
                { letters: ['O', 'R', 'B', 'I', 'T'], targetWords: ["ORBIT", "BIT", "ROT"] },
                { letters: ['G', 'A', 'L', 'A', 'X', 'Y'], targetWords: ["GALAXY", "GAY", "LAY"] }
            ]
        }
    ];

    const initialRoadmap: WorldDefinition[] = rawData.map(world => ({
        id: world.id,
        name: world.name,
        themeColorVar: `--world-${world.id}-bg`,
        isGenerated: false,
        levels: world.levels.map((l, idx) => ({
            id: `${world.id}-${idx + 1}`,
            worldId: world.id,
            levelInWorld: idx + 1,
            displayName: `Level ${idx + 1}`,
            letters: l.letters,
            targetWords: l.targetWords,
            unlocked: false,
            completed: false
        }))
    }));

    if (initialRoadmap.length > 0 && initialRoadmap[0].levels.length > 0) {
        initialRoadmap[0].levels[0].unlocked = true;
    }
    return initialRoadmap;
}


function loadProgress() {
    const savedProgress = localStorage.getItem('wordFinderDeluxeProgress');
    let initialDefaultRoadmap = getInitialDefaultRoadmap();

    const defaultSettings: GameSettings = {
        soundEffectsEnabled: true,
        musicEnabled: true,
        adsRemoved: false,
        purchasedThemes: ['default'],
        currentThemeId: 'default'
    };

    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            coins = progress.coins || 100;
            bonusWordsFound = progress.bonusWordsFound || [];
            gameSettings = { ...defaultSettings, ...(progress.settings || {}) };

            if (progress.gameRoadmap && Array.isArray(progress.gameRoadmap)) {
                const savedRoadmap = progress.gameRoadmap as WorldDefinition[];
                const savedLevelsMap = new Map<string, { unlocked: boolean, completed: boolean }>();
                savedRoadmap.forEach(w => w.levels.forEach(l => savedLevelsMap.set(l.id, { unlocked: l.unlocked, completed: l.completed })));

                initialDefaultRoadmap.forEach(world => {
                    world.levels.forEach(level => {
                        const savedStatus = savedLevelsMap.get(level.id);
                        if (savedStatus) {
                            level.unlocked = savedStatus.unlocked;
                            level.completed = savedStatus.completed;
                        }
                    });
                });
            }
            gameRoadmap = initialDefaultRoadmap;
        } catch (e) {
            gameRoadmap = initialDefaultRoadmap;
        }
    } else {
        gameRoadmap = initialDefaultRoadmap;
        gameSettings = defaultSettings;
    }

    // Ensure at least the first level is unlocked
    if (gameRoadmap.length > 0 && gameRoadmap[0].levels.length > 0) {
        if (!gameRoadmap.some(w => w.levels.some(l => l.unlocked))) {
            gameRoadmap[0].levels[0].unlocked = true;
        }
    }

    console.log('loadProgress complete. gameRoadmap length:', gameRoadmap.length);
    console.log('First world:', gameRoadmap[0]?.name);

    updateGlobalUIElements();
    applySettings();
    applyTheme(gameSettings.currentThemeId);
}

// Gemini API functions removed
// Gemini handlers removed


// Gemini API logic removed


// --- Shop Logic ---
const SHOP_ITEMS: ShopItem[] = [
    // Currency
    { id: "coins_240", type: "currency", name: "Small Coin Pack", description: "A handful of coins", coins: 240, price: 0.99, priceDisplay: "$0.99", image: "https://api.iconify.design/solar:coins-bold-duotone.svg?color=%23f39c12" },
    { id: "coins_720", type: "currency", name: "Medium Coin Pack", description: "A good stack of coins", coins: 720, price: 2.99, priceDisplay: "$2.99", image: "https://api.iconify.design/solar:banknote-2-bold-duotone.svg?color=%23f39c12" },
    { id: "coins_1340", type: "currency", name: "Large Coin Pack", bonus: "10% Bonus!", coins: 1340, price: 4.99, priceDisplay: "$4.99", image: "https://api.iconify.design/solar:safe-2-bold-duotone.svg?color=%23f39c12" },
    { id: "coins_2940", type: "currency", name: "Huge Coin Pack", bonus: "20% Bonus!", coins: 2940, price: 9.99, priceDisplay: "$9.99", image: "https://api.iconify.design/solar:treasure-chest-bold-duotone.svg?color=%23f39c12" },
    // { id: "coins_6240", type: "currency", name: "Massive Coin Pack", bonus: "30% Bonus!", coins: 6240, price: 19.99, priceDisplay: "$19.99", image: "..." },
    // { id: "coins_13440", type: "currency", name: "Colossal Coin Pack", bonus: "40% Bonus!", coins: 13440, price: 39.99, priceDisplay: "$39.99", image: "..." },
    // Bundles
    { id: "bundle_super", type: "bundle", name: "Super Bundle", items: [{ name: "Coins", quantity: 1340 }, { name: "Hints", quantity: 2 }, { name: "Shuffles", quantity: 2 }], price: 5.99, priceDisplay: "$5.99", image: "https://api.iconify.design/fluent-emoji-flat:wrapped-gift.svg" },
    { id: "bundle_mega", type: "bundle", name: "Mega Bundle", items: [{ name: "Coins", quantity: 2940 }, { name: "Hints", quantity: 5 }, { name: "Shuffles", quantity: 5 }], price: 12.99, priceDisplay: "$12.99", image: "https://api.iconify.design/fluent-emoji-flat:party-popper.svg" },
    // Special
    { id: "remove_ads", type: "special", name: "Remove Ads", description: "Enjoy an ad-free experience!", price: 5.99, priceDisplay: "$5.99", image: "https://api.iconify.design/solar:videocamera-record-bold-duotone.svg?color=%23e74c3c&rotate=15deg&flip=horizontal", action: () => { gameSettings.adsRemoved = true; saveProgress(); showFeedback("Ads Removed! Enjoy the game.", true); } },
    // Themes
    { id: "theme_dark", type: "theme", name: "Midnight Mode", description: "Sleek dark theme", price: 1.99, priceDisplay: "$1.99", image: "https://api.iconify.design/solar:moon-bold-duotone.svg?color=%239b59b6", themeId: "dark" },
    { id: "theme_nature", type: "theme", name: "Forest Vibes", description: "Relaxing green theme", price: 1.99, priceDisplay: "$1.99", image: "https://api.iconify.design/solar:leaf-bold-duotone.svg?color=%232ecc71", themeId: "nature" },
    { id: "theme_ocean", type: "theme", name: "Deep Ocean", description: "Calming blue theme", price: 1.99, priceDisplay: "$1.99", image: "https://api.iconify.design/solar:waterdrops-bold-duotone.svg?color=%233498db", themeId: "ocean" },
];

function renderShopItems() {
    shopTabCurrencyContent.innerHTML = '';
    shopTabBundlesContent.innerHTML = '';
    shopTabThemesContent.innerHTML = '';
    shopTabSpecialContent.innerHTML = '';

    const currencyGrid = document.createElement('div');
    currencyGrid.className = 'shop-item-grid';
    shopTabCurrencyContent.appendChild(currencyGrid);

    const bundleGrid = document.createElement('div');
    bundleGrid.className = 'shop-item-grid';
    shopTabBundlesContent.appendChild(bundleGrid);

    const specialGrid = document.createElement('div');
    specialGrid.className = 'shop-item-grid';
    shopTabSpecialContent.appendChild(specialGrid);

    const themesGrid = document.createElement('div');
    themesGrid.className = 'shop-item-grid';
    shopTabThemesContent.appendChild(themesGrid);


    SHOP_ITEMS.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';
        itemEl.innerHTML = `
            <div class="shop-item-image-container">
                <img src="${item.image}" alt="${item.name}" class="shop-item-image">
            </div>
            <div class="shop-item-details">
                <h4 class="shop-item-name">${item.name}</h4>
                ${item.description ? `<p class="shop-item-description">${item.description}</p>` : ''}
                ${item.bonus ? `<p class="shop-item-bonus">${item.bonus}</p>` : ''}
                ${item.items ? `<div class="shop-item-bundle-contents">${item.items.map(i => `<span>${i.quantity} ${i.name}</span>`).join('')}</div>` : ''}
            </div>
            <div class="shop-item-action">
                ${item.type === 'theme' && gameSettings.purchasedThemes.includes(item.themeId!)
                ? (gameSettings.currentThemeId === item.themeId
                    ? `<button class="shop-price-button" disabled>Active</button>`
                    : `<button class="shop-price-button apply-theme-btn" data-theme-id="${item.themeId}">Apply</button>`)
                : `<button class="shop-price-button" data-item-id="${item.id}">${item.priceDisplay}</button>`
            }
            </div>
        `;
        const purchaseButton = itemEl.querySelector('.shop-price-button') as HTMLButtonElement;
        if (purchaseButton.classList.contains('apply-theme-btn')) {
            purchaseButton.addEventListener('click', () => {
                applyTheme(item.themeId!);
                saveProgress();
                renderShopItems(); // Re-render to update button states
            });
        } else if (!purchaseButton.disabled) {
            purchaseButton.addEventListener('click', () => handlePurchase(item));
        }

        if (item.type === 'currency') currencyGrid.appendChild(itemEl);
        else if (item.type === 'bundle') bundleGrid.appendChild(itemEl);
        else if (item.type === 'theme') themesGrid.appendChild(itemEl);
        else if (item.type === 'special') specialGrid.appendChild(itemEl);
    });
}

function handlePurchase(item: ShopItem) {
    // Simulate purchase - In a real app, this would involve IAP SDK
    if (item.coins) {
        coins += item.coins;
        showFeedback(`${item.coins} coins added!`, true, false, 2000);
    }
    if (item.items) { // For bundles
        item.items.forEach(bundleItem => {
            if (bundleItem.name.toLowerCase() === 'coins' && bundleItem.quantity) {
                coins += bundleItem.quantity;
            }
            // Could add hints/shuffles to player inventory here if implemented
        });
        showFeedback(`${item.name} purchased! Items added.`, true, false, 2000);
    }
    if (item.action) {
        item.action(); // For "Remove Ads"
    }
    if (item.type === 'theme' && item.themeId) {
        if (!gameSettings.purchasedThemes.includes(item.themeId)) {
            gameSettings.purchasedThemes.push(item.themeId);
            showFeedback(`${item.name} Unlocked!`, true);
            applyTheme(item.themeId);
        }
    }
    updateScoreboardAndCoins();
    saveProgress();
    renderShopItems(); // Update UI
}

function applyTheme(themeId: string) {
    gameSettings.currentThemeId = themeId;
    const root = document.documentElement;

    // Reset to defaults first if needed, or just overwrite
    if (themeId === 'default') {
        root.style.setProperty('--background-gradient-start', '#72c2ff');
        root.style.setProperty('--background-gradient-end', '#3a7bd5');
        root.style.setProperty('--letter-button-bg', '#f39c12');
        root.style.setProperty('--letter-button-border', '#e67e22');
        document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')";
    } else if (themeId === 'dark') {
        root.style.setProperty('--background-gradient-start', '#2c3e50');
        root.style.setProperty('--background-gradient-end', '#000000');
        root.style.setProperty('--letter-button-bg', '#8e44ad');
        root.style.setProperty('--letter-button-border', '#5b2c6f');
        document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1200&q=80')";
    } else if (themeId === 'nature') {
        root.style.setProperty('--background-gradient-start', '#2ecc71');
        root.style.setProperty('--background-gradient-end', '#27ae60');
        root.style.setProperty('--letter-button-bg', '#d35400');
        root.style.setProperty('--letter-button-border', '#a04000');
        document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1448375240586-dfd8f3793371?auto=format&fit=crop&w=1200&q=80')";
    } else if (themeId === 'ocean') {
        root.style.setProperty('--background-gradient-start', '#3498db');
        root.style.setProperty('--background-gradient-end', '#2980b9');
        root.style.setProperty('--letter-button-bg', '#e74c3c');
        root.style.setProperty('--letter-button-border', '#c0392b');
        document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80')";
    }
}

function openShopModal() {
    renderShopItems();
    updateScoreboardAndCoins(); // Ensure coin display in shop is up-to-date
    shopModal.classList.remove('hidden');
    // Default to first tab
    const firstTabButton = shopTabsContainer.querySelector('.shop-tab-button') as HTMLElement;
    if (firstTabButton) setActiveShopTab(firstTabButton.dataset.tab || 'currency');
}

function closeShopModal() {
    shopModal.classList.add('hidden');
}

function setActiveShopTab(tabId: string) {
    shopTabsContainer.querySelectorAll('.shop-tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.shop-tab-content').forEach(content => (content as HTMLElement).classList.remove('active'));

    shopTabsContainer.querySelector(`.shop-tab-button[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(`shop-tab-${tabId}`)?.classList.add('active');
}


// --- Settings Logic ---
function openSettingsModal() {
    applySettingsToUI(); // Ensure UI reflects current settings
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function applySettingsToUI() {
    soundToggle.checked = gameSettings.soundEffectsEnabled;
    musicToggle.checked = gameSettings.musicEnabled;
    // Add logic here to mute/unmute actual game sounds/music if implemented
}

function applySettings() { // Called on load and after changes
    applySettingsToUI();
    // Potentially global actions based on settings, e.g.
    // if (gameSettings.adsRemoved) { hideAdElements(); }
    soundManager.setEnabled(gameSettings.soundEffectsEnabled);
}

function handleSettingsChange() {
    gameSettings.soundEffectsEnabled = soundToggle.checked;
    gameSettings.musicEnabled = musicToggle.checked;
    // Logic for sound/music objects would go here
    soundManager.setEnabled(gameSettings.soundEffectsEnabled);
    console.log("Settings saved:", gameSettings);
    saveProgress();
    applySettings();
}

// handleSaveApiKey removed

function handleResetProgress() {
    if (confirm("Are you sure you want to reset all your progress? This cannot be undone!")) {
        localStorage.removeItem('wordFinderDeluxeProgress');
        // Reset in-memory state to defaults
        coins = 100;
        bonusWordsFound = [];
        gameRoadmap = getInitialDefaultRoadmap(); // Get a fresh copy
        gameSettings = {
            soundEffectsEnabled: true,
            musicEnabled: true,
            adsRemoved: false,
            purchasedThemes: ['default'],
            currentThemeId: 'default'
        };
        newBonusWordsCount = 0;

        // Re-initialize parts of the game state
        loadProgress(); // This will now load the defaults correctly
        showRoadmapScreen(); // Go back to roadmap
        closeSettingsModal();
        showFeedback("Progress has been reset.", true, false, 2500);
    }
}

// --- Event Listeners ---
function attachEventListeners() {
    // Main Menu Game Cards
    gameModeCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameMode = card.getAttribute('data-game');
            if (gameMode === 'wordslide') {
                showRoadmapScreen();
            } else if (gameMode === 'wordle') {
                showWordleScreen();
            } else if (gameMode === 'spelling-bee') {
                showSpellingBeeScreen();
            } else if (gameMode === 'connections') {
                showConnectionsScreen();
            } else if (gameMode === 'strands') {
                showStrandsScreen();
            } else if (gameMode === 'letter-boxed') {
                showLetterBoxedScreen();
            } else if (gameMode === 'sudoku') {
                showSudokuScreen();
            } else if (gameMode === 'tiles') {
                showTilesScreen();
            } else if (gameMode === 'pips') {
                showPipsScreen();
            } else {
                showFeedback(`${card.querySelector('.game-title')?.textContent} - Coming Soon!`, false, false, 2000);
            }
        });
    });

    // Game Screen Buttons
    shuffleButton.addEventListener('click', handleShuffleLetters);
    hintButton.addEventListener('click', handleHint);
    revealLetterButton.addEventListener('click', handleRevealLetter);
    micButton.addEventListener('click', handleMicButtonClick);
    gameBackButton.addEventListener('click', showRoadmapScreen);
    gameSettingsButton.addEventListener('click', openSettingsModal);
    gameAchievementsButton.addEventListener('click', openBonusModal);
    gameShopButton.addEventListener('click', openShopModal);

    // Wordle Screen Buttons
    wordleBackButton.addEventListener('click', showMainMenu);
    wordleSettingsButton.addEventListener('click', openSettingsModal);

    // Spelling Bee Screen Buttons
    beeBackButton.addEventListener('click', showMainMenu);
    beeFoundToggle.addEventListener('click', openBeeFoundWords);
    beeCloseFoundBtn.addEventListener('click', closeBeeFoundWords);
    beeDeleteBtn.addEventListener('click', handleBeeDelete);
    beeShuffleBtn.addEventListener('click', handleBeeShuffle);
    beeEnterBtn.addEventListener('click', handleBeeEnter);

    // Connections Screen Buttons
    connBackButton.addEventListener('click', showMainMenu);
    connShuffleBtn.addEventListener('click', handleConnShuffle);
    connDeselectBtn.addEventListener('click', handleConnDeselect);
    connSubmitBtn.addEventListener('click', handleConnSubmit);
    connHelpButton.addEventListener('click', () => showFeedback("Select 4 related words and press Submit!", true));

    // Strands Screen Buttons
    strandsBackButton.addEventListener('click', showMainMenu);
    strandsHintButton.addEventListener('click', () => {
        if (coins >= 50) {
            coins -= 50;
            updateGlobalUIElements();
            showFeedback("Hint: Focus on the theme!", true);
        } else {
            showFeedback("Not enough coins! (50 required)", false);
        }
    });

    // Letter Boxed Screen Buttons
    boxedBackButton.addEventListener('click', showMainMenu);
    boxedDeleteBtn.addEventListener('click', handleBoxedDelete);
    boxedEnterBtn.addEventListener('click', handleBoxedEnter);
    boxedHelpButton.addEventListener('click', () => showFeedback("Connect letters on different sides to make words! Use all letters to win.", true));

    // Sudoku Screen Buttons
    sudokuBackButton.addEventListener('click', showMainMenu);
    sudokuSettingsButton.addEventListener('click', openSettingsModal);

    // Tiles Screen Buttons
    tilesBackButton.addEventListener('click', showMainMenu);

    // Pips Screen Buttons
    pipsBackButton.addEventListener('click', showMainMenu);

    // Sudoku Numpad
    const numButtons = sudokuNumpad.querySelectorAll('.numpad-btn');
    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.getAttribute('data-val')!);
            handleSudokuInput(val);
        });
    });

    // Bee Cell Clicks
    beeCellCenter.addEventListener('click', () => handleBeeLetterClick(beeCellCenter.querySelector('.cell-content')!.textContent!));
    beeOuterCells.forEach(cell => {
        cell.addEventListener('click', () => handleBeeLetterClick(cell.querySelector('.cell-content')!.textContent!));
    });

    // Wordle Keyboard
    const wordleKeys = wordleKeyboard.querySelectorAll('.key-button');
    wordleKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            if (keyValue) {
                handleWordleKeyPress(keyValue);
            }
        });
    });

    // Physical Keyboard for Wordle & Spelling Bee
    document.addEventListener('keydown', (e) => {
        if (!wordleContainer.classList.contains('hidden')) {
            if (e.key === 'Enter') handleWordleKeyPress('ENTER');
            else if (e.key === 'Backspace') handleWordleKeyPress('BACKSPACE');
            else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) handleWordleKeyPress(e.key.toUpperCase());
        }
        else if (!beeContainer.classList.contains('hidden')) {
            if (e.key === 'Enter') handleBeeEnter();
            else if (e.key === 'Backspace') handleBeeDelete();
            else if (e.key === ' ') handleBeeShuffle();
            else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) handleBeeLetterClick(e.key);
        }
    });

    // Roadmap Screen Buttons
    roadmapBackButton.addEventListener('click', () => {/* Could implement multi-level back if needed */ showFeedback("Welcome to the Roadmap!", true, false, 1500) });
    roadmapSettingsButton.addEventListener('click', openSettingsModal);
    roadmapAchievementsButton.addEventListener('click', openBonusModal);
    roadmapShopButton.addEventListener('click', openShopModal);

    // Shared UI
    feedbackOkButton.addEventListener('click', () => {
        const existingTimeout = (feedbackPopup as any).timeoutId;
        if (existingTimeout) clearTimeout(existingTimeout);
        feedbackPopup.classList.add('hidden');
        if ((feedbackOkButton as any).nextAction) {
            (feedbackOkButton as any).nextAction();
            (feedbackOkButton as any).nextAction = null;
        }
    });

    closeBonusModalButton.addEventListener('click', closeBonusModal);
    bonusWordsModal.addEventListener('click', (event) => {
        if (event.target === bonusWordsModal) closeBonusModal();
    });
    bonusTipOkButton.addEventListener('click', hideBonusTip);

    // Shop Modal Listeners
    closeShopModalButton.addEventListener('click', closeShopModal);
    shopModal.addEventListener('click', (event) => {
        if (event.target === shopModal) closeShopModal();
    });
    shopTabsContainer.querySelectorAll('.shop-tab-button').forEach(button => {
        button.addEventListener('click', (e) => setActiveShopTab((e.currentTarget as HTMLElement).dataset.tab!));
    });


    // Settings Modal Listeners
    closeSettingsModalButton.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) closeSettingsModal();
    });
    soundToggle.addEventListener('change', handleSettingsChange);
    musicToggle.addEventListener('change', handleSettingsChange);
    resetProgressButton.addEventListener('click', handleResetProgress);


    window.addEventListener('resize', () => {
        if (!gameContainer.classList.contains('hidden')) {
            resizeCanvas();
            renderLetters();
            renderWordGrid();
        }
    });
}

// --- Application Initialization ---
function main() {
    try {
        console.log('Main function starting...');
        console.log('levelSelectionScreen:', levelSelectionScreen);
        console.log('settingsModal:', settingsModal);

        // Force settings modal to be hidden
        settingsModal.classList.add('hidden');
        bonusWordsModal.classList.add('hidden');
        shopModal.classList.add('hidden');
        console.log('Modals hidden');

        console.log('Loading progress...');
        loadProgress(); // Loads game data and settings

        // Speech recognition removed - not needed
        // initSpeechRecognition();

        console.log('Attaching event listeners...');
        attachEventListeners();

        console.log('Showing roadmap screen...');
        showMainMenu(); // Start at main menu instead of roadmap

        if (localStorage.getItem('bonusTipShown') === 'true') {
            bonusWordsTip.classList.add('hidden');
        }

        console.log('Main function complete!');
        console.log('levelSelectionScreen classes:', levelSelectionScreen.className);
        console.log('settingsModal classes:', settingsModal.className);
        console.log('gameRoadmap length:', gameRoadmap.length);

        // Add visual debug info
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.8);color:lime;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
        debugDiv.innerHTML = `
            <div>Roadmap Length: ${gameRoadmap.length}</div>
            <div>Level Screen Hidden: ${levelSelectionScreen.classList.contains('hidden')}</div>
            <div>Settings Hidden: ${settingsModal.classList.contains('hidden')}</div>
        `;
        document.body.appendChild(debugDiv);

    } catch (error) {
        console.error('Error in main():', error);
        // Show error to user
        document.body.innerHTML = `<div style="color: white; padding: 2rem; text-align: center;">
            <h1>Error Loading Game</h1>
            <p>${error}</p>
            <p>Please check the console for details.</p>
        </div>`;
    }
}

document.addEventListener('DOMContentLoaded', main);
