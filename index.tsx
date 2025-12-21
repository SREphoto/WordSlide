
// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SoundManager } from "./SoundManager";
import { DictionaryManager } from "./DictionaryManager";

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

let gameRoadmap: WorldDefinition[] = [
    {
        id: "tutorial", name: "TUTORIAL", themeColorVar: "--world-tutorial-bg", isGenerated: false, levels: [
            { id: "tut-1", worldId: "tutorial", levelInWorld: 1, displayName: "Basics", letters: ['C', 'A', 'T'], targetWords: ["CAT", "ACT"], unlocked: true, completed: false },
            { id: "tut-2", worldId: "tutorial", levelInWorld: 2, displayName: "Warm Up", letters: ['D', 'O', 'G'], targetWords: ["DOG", "GOD", "GO"], unlocked: false, completed: false },
            { id: "tut-3", worldId: "tutorial", levelInWorld: 3, displayName: "Challenge", letters: ['P', 'L', 'A', 'Y'], targetWords: ["PLAY", "PAY", "LAP", "PAL"], unlocked: false, completed: false },
        ]
    },
    {
        id: "kitchen", name: "CULINARY CHAOS", themeColorVar: "--world-culinary-bg", isGenerated: false, levels: [
            { id: "kit-1", worldId: "kitchen", levelInWorld: 1, displayName: "Breakfast", letters: ['E', 'G', 'G'], targetWords: ["EGG"], unlocked: false, completed: false },
            { id: "kit-2", worldId: "kitchen", levelInWorld: 2, displayName: "Utensils", letters: ['P', 'O', 'T', 'S'], targetWords: ["POTS", "POT", "TOP", "TOPS", "STOP"], unlocked: false, completed: false },
            { id: "kit-3", worldId: "kitchen", levelInWorld: 3, displayName: "Baking", letters: ['P', 'I', 'E', 'S'], targetWords: ["PIES", "PIE", "SIP"], unlocked: false, completed: false },
            { id: "kit-4", worldId: "kitchen", levelInWorld: 4, displayName: "Drinks", letters: ['T', 'E', 'A', 'S'], targetWords: ["TEAS", "TEA", "SEA", "EAT", "SET", "SAT"], unlocked: false, completed: false },
            { id: "kit-5", worldId: "kitchen", levelInWorld: 5, displayName: "Fruits", letters: ['P', 'E', 'A', 'R'], targetWords: ["PEAR", "PEA", "EAR", "RAP", "PAR", "APE"], unlocked: false, completed: false },
            { id: "kit-6", worldId: "kitchen", levelInWorld: 6, displayName: "Main Course", letters: ['M', 'E', 'A', 'T', 'S'], targetWords: ["MEATS", "MEAT", "TEAM", "EATS", "SEAT", "MATS", "TAME"], unlocked: false, completed: false },
            { id: "kit-7", worldId: "kitchen", levelInWorld: 7, displayName: "Chef's Special", letters: ['B', 'R', 'E', 'A', 'D'], targetWords: ["BREAD", "READ", "BEAR", "DARE", "DEAR", "BAD", "BED", "RED", "EAR"], unlocked: false, completed: false },
        ]
    },
    {
        id: "forest", name: "WHISPERING WOODS", themeColorVar: "--world-timber-bg", isGenerated: false, levels: [
            { id: "for-1", worldId: "forest", levelInWorld: 1, displayName: "Trees", letters: ['E', 'L', 'M'], targetWords: ["ELM"], unlocked: false, completed: false },
            { id: "for-2", worldId: "forest", levelInWorld: 2, displayName: "Animals", letters: ['O', 'W', 'L', 'S'], targetWords: ["OWLS", "OWL", "LOW", "SLOW"], unlocked: false, completed: false },
            { id: "for-3", worldId: "forest", levelInWorld: 3, displayName: "Camping", letters: ['T', 'E', 'N', 'T'], targetWords: ["TENT", "NET", "TEN"], unlocked: false, completed: false },
            { id: "for-4", worldId: "forest", levelInWorld: 4, displayName: "Hiking", letters: ['P', 'A', 'T', 'H'], targetWords: ["PATH", "HAT", "PAT", "TAP", "APT"], unlocked: false, completed: false },
            { id: "for-5", worldId: "forest", levelInWorld: 5, displayName: "Nature", letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"], unlocked: false, completed: false },
            { id: "for-6", worldId: "forest", levelInWorld: 6, displayName: "Wildlife", letters: ['D', 'E', 'E', 'R', 'S'], targetWords: ["DEERS", "DEER", "REDS", "SEED", "SEE", "RED"], unlocked: false, completed: false },
            { id: "for-7", worldId: "forest", levelInWorld: 7, displayName: "The Grove", letters: ['F', 'O', 'R', 'E', 'S', 'T'], targetWords: ["FOREST", "REST", "SOFT", "ROSE", "SORE", "FORT", "TOE", "SET", "FOR"], unlocked: false, completed: false },
        ]
    },
    {
        id: "ocean", name: "DEEP BLUE", themeColorVar: "--world-aqueous-bg", isGenerated: false, levels: [
            { id: "oc-1", worldId: "ocean", levelInWorld: 1, displayName: "Water", letters: ['S', 'E', 'A'], targetWords: ["SEA"], unlocked: false, completed: false },
            { id: "oc-2", worldId: "ocean", levelInWorld: 2, displayName: "Fish", letters: ['C', 'O', 'D'], targetWords: ["COD", "DOC"], unlocked: false, completed: false },
            { id: "oc-3", worldId: "ocean", levelInWorld: 3, displayName: "Beach", letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"], unlocked: false, completed: false },
            { id: "oc-4", worldId: "ocean", levelInWorld: 4, displayName: "Tides", letters: ['W', 'A', 'V', 'E'], targetWords: ["WAVE", "AVE"], unlocked: false, completed: false },
            { id: "oc-5", worldId: "ocean", levelInWorld: 5, displayName: "Boats", letters: ['S', 'H', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP", "HIS"], unlocked: false, completed: false },
            { id: "oc-6", worldId: "ocean", levelInWorld: 6, displayName: "Creatures", letters: ['W', 'H', 'A', 'L', 'E'], targetWords: ["WHALE", "HEAL", "HALE", "LAW", "AWE"], unlocked: false, completed: false },
            { id: "oc-7", worldId: "ocean", levelInWorld: 7, displayName: "The Reef", letters: ['S', 'H', 'A', 'R', 'K', 'S'], targetWords: ["SHARKS", "SHARK", "RASH", "ARK", "ASK", "HAS"], unlocked: false, completed: false },
        ]
    },
    {
        id: "space", name: "COSMIC VOYAGE", themeColorVar: "--world-cosmic-bg", isGenerated: false, levels: [
            { id: "sp-1", worldId: "space", levelInWorld: 1, displayName: "Sky", letters: ['S', 'U', 'N'], targetWords: ["SUN", "US"], unlocked: false, completed: false },
            { id: "sp-2", worldId: "space", levelInWorld: 2, displayName: "Night", letters: ['S', 'T', 'A', 'R'], targetWords: ["STAR", "RAT", "TAR", "ART"], unlocked: false, completed: false },
            { id: "sp-3", worldId: "space", levelInWorld: 3, displayName: "Moon", letters: ['L', 'U', 'N', 'A'], targetWords: ["LUNA"], unlocked: false, completed: false },
            { id: "sp-4", worldId: "space", levelInWorld: 4, displayName: "Red Planet", letters: ['M', 'A', 'R', 'S'], targetWords: ["MARS", "ARM", "RAM", "RAMS", "ARMS"], unlocked: false, completed: false },
            { id: "sp-5", worldId: "space", levelInWorld: 5, displayName: "Void", letters: ['V', 'O', 'I', 'D'], targetWords: ["VOID", "DO"], unlocked: false, completed: false },
            { id: "sp-6", worldId: "space", levelInWorld: 6, displayName: "Orbit", letters: ['E', 'A', 'R', 'T', 'H'], targetWords: ["EARTH", "HEART", "HEAR", "HEAT", "HATE", "RATE", "TEAR", "EAR", "THE", "HAT", "ART"], unlocked: false, completed: false },
            { id: "sp-7", worldId: "space", levelInWorld: 7, displayName: "Galaxy", letters: ['P', 'L', 'A', 'N', 'E', 'T'], targetWords: ["PLANET", "PLANE", "PLANT", "PLATE", "LATE", "TALE", "LANE", "LEAN", "NEAT", "PANT", "TAPE", "PAT", "PAN", "PEN", "NET", "TEN", "ANT", "TAN", "TEA", "EAT", "APE", "LAP", "PAL", "LET", "PET"], unlocked: false, completed: false },
        ]
    }
];


// --- Game State ---
let currentPlayingLevel: LevelDefinition | null = null;
let availableLetters: string[] = [];
let currentSwipePath: SwipedLetterInfo[] = [];
let isSwiping = false;
let foundWords: string[] = [];
let bonusWordsFound: string[] = [];
let newBonusWordsCount = 0;
const BONUS_COIN_VALUE = 1;
let score = 0;
let coins = 100;
const HINT_COST = 50;
const REVEAL_LETTER_COST = 25;
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
const levelSelectionScreen = document.getElementById('level-selection-screen')!;
const gameContainer = document.getElementById('game-container')!;

// Roadmap UI
const roadmapMainContent = document.getElementById('roadmap-main-content')!;
const roadmapBackButton = document.getElementById('roadmap-back-button')!;
const roadmapSettingsButton = document.getElementById('roadmap-settings-button')!;
const roadmapAchievementsButton = document.getElementById('roadmap-achievements-button')!;
const roadmapBonusBadge = document.getElementById('roadmap-bonus-badge')!;
const roadmapCoinsValue = document.getElementById('roadmap-coins-value')! as HTMLSpanElement;
const roadmapShopButton = document.getElementById('roadmap-shop-button')!;

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
const privacyPolicyLink = document.getElementById('privacy-policy-link')!;
const acknowledgementsLink = document.getElementById('acknowledgements-link')!;
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
const saveApiKeyButton = document.getElementById('save-api-key-button') as HTMLButtonElement;
const apiKeyStatus = document.getElementById('api-key-status') as HTMLParagraphElement;


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
function showRoadmapScreen() {
    renderRoadmap();
    levelSelectionScreen.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    updateGlobalUIElements();
}

function showGameScreen() {
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    resizeCanvas();
    renderLetters();
    updateGlobalUIElements();
}


// --- Roadmap Logic ---

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
    roadmapMainContent.innerHTML = '';
    gameRoadmap.forEach(world => {
        const worldSection = document.createElement('div');
        worldSection.classList.add('world-section');
        worldSection.id = `world-${world.id}`;

        let glowColorCSSVar = '--world-generated-glow';
        switch (world.themeColorVar) {
            case '--world-tutorial-bg': glowColorCSSVar = '--world-tutorial-glow'; break;
            case '--world-outback-bg': glowColorCSSVar = '--world-outback-glow'; break;
            case '--world-timber-bg': glowColorCSSVar = '--world-timber-glow'; break;
            case '--world-crystal-bg': glowColorCSSVar = '--world-crystal-glow'; break;
            case '--world-cosmic-bg': glowColorCSSVar = '--world-cosmic-glow'; break;
            case '--world-aqueous-bg': glowColorCSSVar = '--world-aqueous-glow'; break;
            case '--world-galactic-bg': glowColorCSSVar = '--world-galactic-glow'; break;
            case '--world-culinary-bg': glowColorCSSVar = '--world-culinary-glow'; break;
            case DEFAULT_GENERATED_WORLD_THEME_VAR: glowColorCSSVar = '--world-generated-glow'; break;
        }
        worldSection.style.setProperty('--current-world-glow-color', `var(${glowColorCSSVar})`);

        if (world.isGenerated) {
            worldSection.classList.add('generated-world-card');
            worldSection.style.backgroundColor = `var(${world.themeColorVar}, #ccc)`;
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

        const isTutorial = world.id === 'tutorial' && world.levels.length === 3;
        const isCosmic = world.id === 'cosmic' && world.levels.length === 3;
        const isGeneric7LevelWorld = world.levels.length === 7 && world.id !== 'tutorial' && world.id !== 'cosmic';


        if (isTutorial) {
            const phase1Levels = world.levels.slice(0, 2);
            const phase2Levels = world.levels.slice(2, 3);
            if (phase1Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase1Levels, 1, "Tutorial: Basic Puzzles", world.name));
            if (phase2Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase2Levels, 2, "Tutorial: Next Step Puzzle", world.name));
        } else if (isCosmic) {
            const phase1Levels = world.levels.slice(0, 1);
            const phase2Levels = world.levels.slice(1, 2);
            const phase3Levels = world.levels.slice(2, 3);
            if (phase1Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase1Levels, 1, "Cosmic Cluster: 3-letter Puzzle", world.name));
            if (phase2Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase2Levels, 2, "Cosmic Cluster: 4-letter Puzzle", world.name));
            if (phase3Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase3Levels, 3, "Cosmic Cluster: 5-letter Puzzle", world.name));
        } else if (isGeneric7LevelWorld) {
            const phase1Levels = world.levels.slice(0, 2);
            const phase2Levels = world.levels.slice(2, 5);
            const phase3Levels = world.levels.slice(5, 6);
            const phase4Levels = world.levels.slice(6, 7);

            if (phase1Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase1Levels, 1, `Phase 1: Puzzles 1 & 2`, world.name));
            if (phase2Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase2Levels, 2, `Phase 2: Puzzles 3, 4 & 5`, world.name));
            if (phase3Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase3Levels, 3, `Phase 3: Puzzle 6`, world.name));
            if (phase4Levels.length) levelsGrid.appendChild(createPhaseGroupEl(phase4Levels, 4, `Phase 4: Puzzle 7 (Boss Level)`, world.name));
        } else {
            const defaultGroup = document.createElement('div');
            defaultGroup.classList.add('phase-group', 'phase-default');
            world.levels.forEach(level => {
                const levelGem = createLevelGemElement(level, world.name);
                defaultGroup.appendChild(levelGem);
            });
            levelsGrid.appendChild(defaultGroup);
        }

        worldSection.appendChild(levelsGrid);
        roadmapMainContent.appendChild(worldSection);
    });
    updateGlobalUIElements();
}

function startGameForLevel(levelDef: LevelDefinition) {
    currentPlayingLevel = levelDef;
    availableLetters = [...levelDef.letters];
    foundWords = [];
    score = 0;

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
    const initialRoadmap: WorldDefinition[] = [
        {
            id: "tutorial", name: "TUTORIAL", themeColorVar: "--world-tutorial-bg", isGenerated: false, levels: [
                { id: "tut-1", worldId: "tutorial", levelInWorld: 1, displayName: "Basics", letters: ['C', 'A', 'T'], targetWords: ["CAT", "ACT"], unlocked: true, completed: false },
                { id: "tut-2", worldId: "tutorial", levelInWorld: 2, displayName: "Warm Up", letters: ['D', 'O', 'G'], targetWords: ["DOG", "GOD"], unlocked: false, completed: false },
                { id: "tut-3", worldId: "tutorial", levelInWorld: 3, displayName: "Challenge", letters: ['P', 'L', 'A', 'Y'], targetWords: ["PLAY", "PAY", "LAP"], unlocked: false, completed: false },
            ]
        },
        {
            id: "kitchen", name: "CULINARY CHAOS", themeColorVar: "--world-culinary-bg", isGenerated: false, levels: [
                { id: "kit-1", worldId: "kitchen", levelInWorld: 1, displayName: "Level 1", letters: ['E', 'G', 'G'], targetWords: ["EGG"], unlocked: false, completed: false },
                { id: "kit-2", worldId: "kitchen", levelInWorld: 2, displayName: "Level 2", letters: ['P', 'O', 'T', 'S'], targetWords: ["POTS", "POT", "TOP", "STOP"], unlocked: false, completed: false },
                { id: "kit-3", worldId: "kitchen", levelInWorld: 3, displayName: "Level 3", letters: ['P', 'I', 'E', 'S'], targetWords: ["PIES", "PIE", "SIP"], unlocked: false, completed: false },
                { id: "kit-4", worldId: "kitchen", levelInWorld: 4, displayName: "Level 4", letters: ['T', 'E', 'A', 'S'], targetWords: ["TEAS", "TEA", "SEA", "EAT"], unlocked: false, completed: false },
                { id: "kit-5", worldId: "kitchen", levelInWorld: 5, displayName: "Level 5", letters: ['P', 'E', 'A', 'R'], targetWords: ["PEAR", "PEA", "EAR", "APE"], unlocked: false, completed: false },
                { id: "kit-6", worldId: "kitchen", levelInWorld: 6, displayName: "Level 6", letters: ['M', 'E', 'A', 'T', 'S'], targetWords: ["MEATS", "MEAT", "TEAM", "SEAT"], unlocked: false, completed: false },
                { id: "kit-7", worldId: "kitchen", levelInWorld: 7, displayName: "Level 7", letters: ['B', 'R', 'E', 'A', 'D'], targetWords: ["BREAD", "READ", "BEAR", "DARE"], unlocked: false, completed: false },
            ]
        },
        {
            id: "forest", name: "WHISPERING WOODS", themeColorVar: "--world-timber-bg", isGenerated: false, levels: [
                { id: "for-1", worldId: "forest", levelInWorld: 1, displayName: "Level 1", letters: ['E', 'L', 'M'], targetWords: ["ELM"], unlocked: false, completed: false },
                { id: "for-2", worldId: "forest", levelInWorld: 2, displayName: "Level 2", letters: ['O', 'W', 'L', 'S'], targetWords: ["OWLS", "OWL", "LOW", "SLOW"], unlocked: false, completed: false },
                { id: "for-3", worldId: "forest", levelInWorld: 3, displayName: "Level 3", letters: ['T', 'E', 'N', 'T'], targetWords: ["TENT", "NET", "TEN"], unlocked: false, completed: false },
                { id: "for-4", worldId: "forest", levelInWorld: 4, displayName: "Level 4", letters: ['P', 'A', 'T', 'H'], targetWords: ["PATH", "HAT", "PAT", "TAP"], unlocked: false, completed: false },
                { id: "for-5", worldId: "forest", levelInWorld: 5, displayName: "Level 5", letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"], unlocked: false, completed: false },
                { id: "for-6", worldId: "forest", levelInWorld: 6, displayName: "Level 6", letters: ['D', 'E', 'E', 'R', 'S'], targetWords: ["DEERS", "DEER", "REDS", "SEED"], unlocked: false, completed: false },
                { id: "for-7", worldId: "forest", levelInWorld: 7, displayName: "Level 7", letters: ['F', 'O', 'R', 'E', 'S', 'T'], targetWords: ["FOREST", "REST", "SOFT", "ROSE"], unlocked: false, completed: false },
            ]
        },
        {
            id: "ocean", name: "DEEP BLUE", themeColorVar: "--world-aqueous-bg", isGenerated: false, levels: [
                { id: "oc-1", worldId: "ocean", levelInWorld: 1, displayName: "Level 1", letters: ['S', 'E', 'A'], targetWords: ["SEA"], unlocked: false, completed: false },
                { id: "oc-2", worldId: "ocean", levelInWorld: 2, displayName: "Level 2", letters: ['C', 'O', 'D'], targetWords: ["COD", "DOC"], unlocked: false, completed: false },
                { id: "oc-3", worldId: "ocean", levelInWorld: 3, displayName: "Level 3", letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"], unlocked: false, completed: false },
                { id: "oc-4", worldId: "ocean", levelInWorld: 4, displayName: "Level 4", letters: ['W', 'A', 'V', 'E'], targetWords: ["WAVE", "AVE"], unlocked: false, completed: false },
                { id: "oc-5", worldId: "ocean", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'H', 'I', 'P'], targetWords: ["SHIP", "HIP", "SIP", "HIS"], unlocked: false, completed: false },
                { id: "oc-6", worldId: "ocean", levelInWorld: 6, displayName: "Level 6", letters: ['W', 'H', 'A', 'L', 'E'], targetWords: ["WHALE", "HEAL", "ALE"], unlocked: false, completed: false },
                { id: "oc-7", worldId: "ocean", levelInWorld: 7, displayName: "Level 7", letters: ['S', 'H', 'A', 'R', 'K'], targetWords: ["SHARK", "RASH", "ARK", "HAS"], unlocked: false, completed: false },
            ]
        },
        {
            id: "space", name: "COSMIC VOYAGE", themeColorVar: "--world-cosmic-bg", isGenerated: false, levels: [
                { id: "sp-1", worldId: "space", levelInWorld: 1, displayName: "Level 1", letters: ['S', 'U', 'N'], targetWords: ["SUN"], unlocked: false, completed: false },
                { id: "sp-2", worldId: "space", levelInWorld: 2, displayName: "Level 2", letters: ['S', 'T', 'A', 'R'], targetWords: ["STAR", "RAT", "TAR", "ART"], unlocked: false, completed: false },
                { id: "sp-3", worldId: "space", levelInWorld: 3, displayName: "Level 3", letters: ['M', 'O', 'O', 'N'], targetWords: ["MOON", "MOO"], unlocked: false, completed: false },
                { id: "sp-4", worldId: "space", levelInWorld: 4, displayName: "Level 4", letters: ['M', 'A', 'R', 'S'], targetWords: ["MARS", "ARM", "RAM"], unlocked: false, completed: false },
                { id: "sp-5", worldId: "space", levelInWorld: 5, displayName: "Level 5", letters: ['V', 'O', 'I', 'D'], targetWords: ["VOID", "DO"], unlocked: false, completed: false },
                { id: "sp-6", worldId: "space", levelInWorld: 6, displayName: "Level 6", letters: ['E', 'A', 'R', 'T', 'H'], targetWords: ["EARTH", "HEAR", "HEAT", "HAT", "ART"], unlocked: false, completed: false },
                { id: "sp-7", worldId: "space", levelInWorld: 7, displayName: "Level 7", letters: ['P', 'L', 'A', 'N', 'E', 'T'], targetWords: ["PLANET", "PLANE", "PLANT", "PLATE", "LATE", "PANT"], unlocked: false, completed: false },
            ]
        },
        {
            id: "desert", name: "DESERT HEAT", themeColorVar: "--world-outback-bg", isGenerated: false, levels: [
                { id: "des-1", worldId: "desert", levelInWorld: 1, displayName: "Level 1", letters: ['S', 'A', 'N', 'D'], targetWords: ["SAND", "SAD", "AND"], unlocked: false, completed: false },
                { id: "des-2", worldId: "desert", levelInWorld: 2, displayName: "Level 2", letters: ['D', 'U', 'N', 'E'], targetWords: ["DUNE", "DUE"], unlocked: false, completed: false },
                { id: "des-3", worldId: "desert", levelInWorld: 3, displayName: "Level 3", letters: ['H', 'E', 'A', 'T'], targetWords: ["HEAT", "HAT", "EAT"], unlocked: false, completed: false },
                { id: "des-4", worldId: "desert", levelInWorld: 4, displayName: "Level 4", letters: ['C', 'A', 'C', 'T', 'U', 'S'], targetWords: ["CACTUS", "CATS", "CUTS"], unlocked: false, completed: false },
                { id: "des-5", worldId: "desert", levelInWorld: 5, displayName: "Level 5", letters: ['C', 'A', 'M', 'E', 'L'], targetWords: ["CAMEL", "MEAL", "MALE", "LACE"], unlocked: false, completed: false },
                { id: "des-6", worldId: "desert", levelInWorld: 6, displayName: "Level 6", letters: ['S', 'C', 'O', 'R', 'P'], targetWords: ["SCORP", "CROP", "PROS"], unlocked: false, completed: false },
                { id: "des-7", worldId: "desert", levelInWorld: 7, displayName: "Level 7", letters: ['P', 'Y', 'R', 'A', 'M', 'I', 'D'], targetWords: ["PYRAMID", "DRAM", "DRIP", "PAID"], unlocked: false, completed: false },
            ]
        },
        {
            id: "arctic", name: "FROZEN TUNDRA", themeColorVar: "--world-crystal-bg", isGenerated: false, levels: [
                { id: "arc-1", worldId: "arctic", levelInWorld: 1, displayName: "Level 1", letters: ['I', 'C', 'E'], targetWords: ["ICE"], unlocked: false, completed: false },
                { id: "arc-2", worldId: "arctic", levelInWorld: 2, displayName: "Level 2", letters: ['C', 'O', 'L', 'D'], targetWords: ["COLD", "OLD", "COD"], unlocked: false, completed: false },
                { id: "arc-3", worldId: "arctic", levelInWorld: 3, displayName: "Level 3", letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "NOW", "OWN", "WON"], unlocked: false, completed: false },
                { id: "arc-4", worldId: "arctic", levelInWorld: 4, displayName: "Level 4", letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR", "ARE", "BAR", "EAR"], unlocked: false, completed: false },
                { id: "arc-5", worldId: "arctic", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'E', 'A', 'L'], targetWords: ["SEAL", "SALE", "SEA", "ALE"], unlocked: false, completed: false },
                { id: "arc-6", worldId: "arctic", levelInWorld: 6, displayName: "Level 6", letters: ['W', 'H', 'A', 'L', 'E'], targetWords: ["WHALE", "HEAL", "HALE", "LAW"], unlocked: false, completed: false },
                { id: "arc-7", worldId: "arctic", levelInWorld: 7, displayName: "Level 7", letters: ['G', 'L', 'A', 'C', 'I', 'E', 'R'], targetWords: ["GLACIER", "GRACE", "CARE", "RACE", "AGE", "ICE"], unlocked: false, completed: false },
            ]
        },
        {
            id: "mountain", name: "MYSTIC PEAKS", themeColorVar: "--world-timber-glow", isGenerated: false, levels: [
                { id: "mnt-1", worldId: "mountain", levelInWorld: 1, displayName: "Level 1", letters: ['P', 'E', 'A', 'K'], targetWords: ["PEAK", "APE", "KEA"], unlocked: false, completed: false },
                { id: "mnt-2", worldId: "mountain", levelInWorld: 2, displayName: "Level 2", letters: ['S', 'N', 'O', 'W'], targetWords: ["SNOW", "SOW", "WON"], unlocked: false, completed: false },
                { id: "mnt-3", worldId: "mountain", levelInWorld: 3, displayName: "Level 3", letters: ['H', 'I', 'K', 'E'], targetWords: ["HIKE"], unlocked: false, completed: false },
                { id: "mnt-4", worldId: "mountain", levelInWorld: 4, displayName: "Level 4", letters: ['C', 'L', 'I', 'M', 'B'], targetWords: ["CLIMB", "MILB", "LIMB"], unlocked: false, completed: false },
                { id: "mnt-5", worldId: "mountain", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'L', 'O', 'P', 'E'], targetWords: ["SLOPE", "POLE", "POSE", "LOSE"], unlocked: false, completed: false },
                { id: "mnt-6", worldId: "mountain", levelInWorld: 6, displayName: "Level 6", letters: ['V', 'A', 'L', 'L', 'E', 'Y'], targetWords: ["VALLEY", "VEAL", "YELL", "VALE"], unlocked: false, completed: false },
                { id: "mnt-7", worldId: "mountain", levelInWorld: 7, displayName: "Level 7", letters: ['S', 'U', 'M', 'M', 'I', 'T'], targetWords: ["SUMMIT", "MUST", "MIST", "SUIT"], unlocked: false, completed: false },
            ]
        },
        {
            id: "jungle", name: "RAINFOREST RYHTHM", themeColorVar: "--world-culinary-glow", isGenerated: false, levels: [
                { id: "jun-1", worldId: "jungle", levelInWorld: 1, displayName: "Level 1", letters: ['A', 'P', 'E'], targetWords: ["APE"], unlocked: false, completed: false },
                { id: "jun-2", worldId: "jungle", levelInWorld: 2, displayName: "Level 2", letters: ['V', 'I', 'N', 'E'], targetWords: ["VINE", "VIE"], unlocked: false, completed: false },
                { id: "jun-3", worldId: "jungle", levelInWorld: 3, displayName: "Level 3", letters: ['R', 'A', 'I', 'N'], targetWords: ["RAIN", "RAN", "AIR"], unlocked: false, completed: false },
                { id: "jun-4", worldId: "jungle", levelInWorld: 4, displayName: "Level 4", letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE", "TEE"], unlocked: false, completed: false },
                { id: "jun-5", worldId: "jungle", levelInWorld: 5, displayName: "Level 5", letters: ['T', 'I', 'G', 'E', 'R'], targetWords: ["TIGER", "TIER", "GRIT"], unlocked: false, completed: false },
                { id: "jun-6", worldId: "jungle", levelInWorld: 6, displayName: "Level 6", letters: ['O', 'R', 'C', 'H', 'I', 'D'], targetWords: ["ORCHID", "RICH", "CHORD", "ROD"], unlocked: false, completed: false },
                { id: "jun-7", worldId: "jungle", levelInWorld: 7, displayName: "Level 7", letters: ['P', 'A', 'N', 'T', 'H', 'E', 'R'], targetWords: ["PANTHER", "PARE", "NEAR", "PANT", "THEN"], unlocked: false, completed: false },
            ]
        },
        {
            id: "city", name: "NEON CITY", themeColorVar: "--world-cosmic-glow", isGenerated: false, levels: [
                { id: "ct-1", worldId: "city", levelInWorld: 1, displayName: "Level 1", letters: ['C', 'A', 'R'], targetWords: ["CAR"], unlocked: false, completed: false },
                { id: "ct-2", worldId: "city", levelInWorld: 2, displayName: "Level 2", letters: ['B', 'U', 'S'], targetWords: ["BUS"], unlocked: false, completed: false },
                { id: "ct-3", worldId: "city", levelInWorld: 3, displayName: "Level 3", letters: ['T', 'A', 'X', 'I'], targetWords: ["TAXI"], unlocked: false, completed: false },
                { id: "ct-4", worldId: "city", levelInWorld: 4, displayName: "Level 4", letters: ['P', 'A', 'R', 'K'], targetWords: ["PARK", "RAPA"], unlocked: false, completed: false },
                { id: "ct-5", worldId: "city", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'T', 'R', 'E', 'E', 'T'], targetWords: ["STREET", "TREES", "STEER", "REST"], unlocked: false, completed: false },
                { id: "ct-6", worldId: "city", levelInWorld: 6, displayName: "Level 6", letters: ['M', 'E', 'T', 'R', 'O'], targetWords: ["METRO", "MORE", "TERM", "ROME"], unlocked: false, completed: false },
                { id: "ct-7", worldId: "city", levelInWorld: 7, displayName: "Level 7", letters: ['S', 'K', 'Y', 'L', 'I', 'N', 'E'], targetWords: ["SKYLINE", "LINE", "SKIN", "LINK", "KEYS"], unlocked: false, completed: false },
            ]
        },
        {
            id: "meadow", name: "BLOSSOM MEADOW", themeColorVar: "--world-generated-glow", isGenerated: false, levels: [
                { id: "md-1", worldId: "meadow", levelInWorld: 1, displayName: "Level 1", letters: ['B', 'E', 'E'], targetWords: ["BEE"], unlocked: false, completed: false },
                { id: "md-2", worldId: "meadow", levelInWorld: 2, displayName: "Level 2", letters: ['B', 'U', 'G'], targetWords: ["BUG"], unlocked: false, completed: false },
                { id: "md-3", worldId: "meadow", levelInWorld: 3, displayName: "Level 3", letters: ['S', 'U', 'N'], targetWords: ["SUN"], unlocked: false, completed: false },
                { id: "md-4", worldId: "meadow", levelInWorld: 4, displayName: "Level 4", letters: ['F', 'L', 'O', 'W', 'E', 'R'], targetWords: ["FLOWER", "WOLF", "FLOW", "ROLE", "FEW"], unlocked: false, completed: false },
                { id: "md-5", worldId: "meadow", levelInWorld: 5, displayName: "Level 5", letters: ['G', 'R', 'A', 'S', 'S'], targetWords: ["GRASS", "RAGS", "SAGS"], unlocked: false, completed: false },
                { id: "md-6", worldId: "meadow", levelInWorld: 6, displayName: "Level 6", letters: ['C', 'L', 'O', 'V', 'E', 'R'], targetWords: ["CLOVER", "LOVE", "OVER", "ROLE", "COVE"], unlocked: false, completed: false },
                { id: "md-7", worldId: "meadow", levelInWorld: 7, displayName: "Level 7", letters: ['B', 'L', 'O', 'S', 'S', 'O', 'M'], targetWords: ["BLOSSOM", "LOSS", "BOOM", "MOSS", "SOLO"], unlocked: false, completed: false },
            ]
        },
        {
            id: "volcano", name: "VOLCANIC VENT", themeColorVar: "--world-culinary-bg", isGenerated: false, levels: [
                { id: "vol-1", worldId: "volcano", levelInWorld: 1, displayName: "Level 1", letters: ['A', 'S', 'H'], targetWords: ["ASH", "HAS"], unlocked: false, completed: false },
                { id: "vol-2", worldId: "volcano", levelInWorld: 2, displayName: "Level 2", letters: ['L', 'A', 'V', 'A'], targetWords: ["LAVA"], unlocked: false, completed: false },
                { id: "vol-3", worldId: "volcano", levelInWorld: 3, displayName: "Level 3", letters: ['F', 'I', 'R', 'E'], targetWords: ["FIRE", "IRE", "REF"], unlocked: false, completed: false },
                { id: "vol-4", worldId: "volcano", levelInWorld: 4, displayName: "Level 4", letters: ['H', 'E', 'A', 'T'], targetWords: ["HEAT", "HAT", "EAT"], unlocked: false, completed: false },
                { id: "vol-5", worldId: "volcano", levelInWorld: 5, displayName: "Level 5", letters: ['M', 'A', 'G', 'M', 'A'], targetWords: ["MAGMA", "MAMA", "GAMA"], unlocked: false, completed: false },
                { id: "vol-6", worldId: "volcano", levelInWorld: 6, displayName: "Level 6", letters: ['E', 'R', 'U', 'P', 'T'], targetWords: ["ERUPT", "PURE", "TRUE", "PERT"], unlocked: false, completed: false },
                { id: "vol-7", worldId: "volcano", levelInWorld: 7, displayName: "Level 7", letters: ['C', 'R', 'A', 'T', 'E', 'R'], targetWords: ["CRATER", "CARE", "REAR", "RACE", "TEAR"], unlocked: false, completed: false },
            ]
        },
        {
            id: "sky", name: "SKY FORTRESS", themeColorVar: "--world-tutorial-glow", isGenerated: false, levels: [
                { id: "sky-1", worldId: "sky", levelInWorld: 1, displayName: "Level 1", letters: ['A', 'I', 'R'], targetWords: ["AIR"], unlocked: false, completed: false },
                { id: "sky-2", worldId: "sky", levelInWorld: 2, displayName: "Level 2", letters: ['B', 'I', 'R', 'D'], targetWords: ["BIRD", "RID"], unlocked: false, completed: false },
                { id: "sky-3", worldId: "sky", levelInWorld: 3, displayName: "Level 3", letters: ['W', 'I', 'N', 'D'], targetWords: ["WIND", "WIN", "DIN"], unlocked: false, completed: false },
                { id: "sky-4", worldId: "sky", levelInWorld: 4, displayName: "Level 4", letters: ['C', 'L', 'O', 'U', 'D'], targetWords: ["CLOUD", "LOUD", "COLD", "DUO"], unlocked: false, completed: false },
                { id: "sky-5", worldId: "sky", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'T', 'O', 'R', 'M'], targetWords: ["STORM", "MOST", "SORT", "ROM"], unlocked: false, completed: false },
                { id: "sky-6", worldId: "sky", levelInWorld: 6, displayName: "Level 6", letters: ['F', 'L', 'I', 'G', 'H', 'T'], targetWords: ["FLIGHT", "GIFT", "LIFT"], unlocked: false, completed: false },
                { id: "sky-7", worldId: "sky", levelInWorld: 7, displayName: "Level 7", letters: ['C', 'A', 'S', 'T', 'L', 'E'], targetWords: ["CASTLE", "CASE", "LAST", "SALT", "SALE", "TEAL"], unlocked: false, completed: false },
            ]
        },
        {
            id: "crystal", name: "CRYSTAL CAVERNS", themeColorVar: "--world-crystal-glow", isGenerated: false, levels: [
                { id: "cry-1", worldId: "crystal", levelInWorld: 1, displayName: "Level 1", letters: ['G', 'E', 'M'], targetWords: ["GEM"], unlocked: false, completed: false },
                { id: "cry-2", worldId: "crystal", levelInWorld: 2, displayName: "Level 2", letters: ['O', 'R', 'E'], targetWords: ["ORE", "ROE"], unlocked: false, completed: false },
                { id: "cry-3", worldId: "crystal", levelInWorld: 3, displayName: "Level 3", letters: ['D', 'I', 'G'], targetWords: ["DIG"], unlocked: false, completed: false },
                { id: "cry-4", worldId: "crystal", levelInWorld: 4, displayName: "Level 4", letters: ['G', 'L', 'O', 'W'], targetWords: ["GLOW", "LOW", "OWL"], unlocked: false, completed: false },
                { id: "cry-5", worldId: "crystal", levelInWorld: 5, displayName: "Level 5", letters: ['S', 'H', 'I', 'N', 'E'], targetWords: ["SHINE", "SHIN", "HENS", "SINS"], unlocked: false, completed: false },
                { id: "cry-6", worldId: "crystal", levelInWorld: 6, displayName: "Level 6", letters: ['Q', 'U', 'A', 'R', 'T', 'Z'], targetWords: ["QUARTZ", "ART"], unlocked: false, completed: false },
                { id: "cry-7", worldId: "crystal", levelInWorld: 7, displayName: "Level 7", letters: ['D', 'I', 'A', 'M', 'O', 'N', 'D'], targetWords: ["DIAMOND", "AMID", "MIND", "MAIN"], unlocked: false, completed: false },
            ]
        }
    ];

    if (initialRoadmap.length > 0 && initialRoadmap[0].levels.length > 0) {
        initialRoadmap[0].levels[0].unlocked = true;
    }
    return JSON.parse(JSON.stringify(initialRoadmap));
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
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
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
    // Game Screen Buttons
    shuffleButton.addEventListener('click', handleShuffleLetters);
    hintButton.addEventListener('click', handleHint);
    revealLetterButton.addEventListener('click', handleRevealLetter);
    micButton.addEventListener('click', handleMicButtonClick);
    gameBackButton.addEventListener('click', showRoadmapScreen);
    gameSettingsButton.addEventListener('click', openSettingsModal);
    gameAchievementsButton.addEventListener('click', openBonusModal);
    gameShopButton.addEventListener('click', openShopModal);

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
    privacyPolicyLink.addEventListener('click', (e) => { e.preventDefault(); showFeedback("Privacy Policy: To be implemented.", false, false, 2000); });
    acknowledgementsLink.addEventListener('click', (e) => { e.preventDefault(); showFeedback("Acknowledgements: To be implemented.", false, false, 2000); });


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
    // initGemini removed
    loadProgress(); // Loads game data and settings
    initSpeechRecognition();
    attachEventListeners();
    showRoadmapScreen();

    if (localStorage.getItem('bonusTipShown') === 'true') {
        bonusWordsTip.classList.add('hidden');
    }
    if (numLevelsInput) {
        numLevelsInput.max = "7";
    }
}

document.addEventListener('DOMContentLoaded', main);
