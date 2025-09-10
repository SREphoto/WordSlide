
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

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
    type: 'currency' | 'bundle' | 'special';
    name: string;
    description?: string; // For currency, e.g. "Coins"
    bonus?: string; // e.g., "10% Bonus!"
    image: string; // URL or path to image
    price: number; // USD price
    priceDisplay: string; // e.g., "$0.99"
    coins?: number; // Coins awarded
    items?: { name: string, quantity: number }[]; // For bundles
    action?: () => void; // For special items like "Remove Ads"
}

interface GameSettings {
    soundEffectsEnabled: boolean;
    musicEnabled: boolean;
    adsRemoved: boolean;
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
    // ... (existing roadmap data remains the same) ...
      {
        id: "tutorial", name: "WELCOME TUTOR", themeColorVar: "--world-tutorial-bg", isGenerated: false, levels: [
            { id: "tut-1", worldId: "tutorial", levelInWorld: 1, displayName: "Level 1", letters: ['C', 'A', 'T'], targetWords: ["CAT", "ACT"], unlocked: true, completed: false },
            { id: "tut-2", worldId: "tutorial", levelInWorld: 2, displayName: "Level 2", letters: ['D', 'O', 'G'], targetWords: ["DOG", "GOD"], unlocked: false, completed: false },
            { id: "tut-3", worldId: "tutorial", levelInWorld: 3, displayName: "Level 3", letters: ['P', 'L', 'A', 'Y'], targetWords: ["PLAY", "PAY", "LAP"], unlocked: false, completed: false },
        ]
    },
    {
        id: "outback", name: "OUTBACK", themeColorVar: "--world-outback-bg", isGenerated: false, levels: [
            { id: "ob-1", worldId: "outback", levelInWorld: 1, displayName: "Level 1", letters: ['S', 'U', 'N'], targetWords: ["SUN"], unlocked: false, completed: false },
            { id: "ob-2", worldId: "outback", levelInWorld: 2, displayName: "Level 2", letters: ['P', 'E', 'T', 'N'], targetWords: ["PET", "PEN", "TEN", "NET"], unlocked: false, completed: false },
            { id: "ob-3", worldId: "outback", levelInWorld: 3, displayName: "Level 3", letters: ['L', 'A', 'K', 'E'], targetWords: ["LAKE", "ALE"], unlocked: false, completed: false },
            { id: "ob-4", worldId: "outback", levelInWorld: 4, displayName: "Level 4", letters: ['R', 'O', 'A', 'D'], targetWords: ["ROAD", "ROD", "RAD"], unlocked: false, completed: false },
            { id: "ob-5", worldId: "outback", levelInWorld: 5, displayName: "Level 5", letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR", "ARE", "BAR", "EAR", "ERA"], unlocked: false, completed: false },
            { id: "ob-6", worldId: "outback", levelInWorld: 6, displayName: "Level 6", letters: ['S', 'T', 'O', 'N', 'E'], targetWords: ["STONE", "TONES", "NOTES", "NETS", "SENT", "NEST", "ONE", "TEN"], unlocked: false, completed: false },
            { id: "ob-7", worldId: "outback", levelInWorld: 7, displayName: "Level 7", letters: ['C', 'A', 'M', 'P', 'E', 'R'], targetWords: ["CAMPER", "REAM", "RAMP", "CAMP", "CAPE", "MARE", "EARP"], unlocked: false, completed: false },
        ]
    },
    {
        id: "timber", name: "TIMBER", themeColorVar: "--world-timber-bg", isGenerated: false, levels: [
            { id: "tm-1", worldId: "timber", levelInWorld: 1, displayName: "Level 1", letters: ['L', 'O', 'G'], targetWords: ["LOG", "GO"], unlocked: false, completed: false },
            { id: "tm-2", worldId: "timber", levelInWorld: 2, displayName: "Level 2", letters: ['A', 'X', 'E'], targetWords: ["AXE", "AX"], unlocked: false, completed: false },
            { id: "tm-3", worldId: "timber", levelInWorld: 3, displayName: "Level 3", letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE", "TEE", "ERE"], unlocked: false, completed: false },
            { id: "tm-4", worldId: "timber", levelInWorld: 4, displayName: "Level 4", letters: ['W', 'O', 'O', 'D'], targetWords: ["WOOD", "WOO", "DO"], unlocked: false, completed: false },
            { id: "tm-5", worldId: "timber", levelInWorld: 5, displayName: "Level 5", letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"], unlocked: false, completed: false },
            { id: "tm-6", worldId: "timber", levelInWorld: 6, displayName: "Level 6", letters: ['B', 'R', 'A', 'N', 'C', 'H'], targetWords: ["BRANCH", "BARN", "ARCH", "CARB", "RAN", "CAN"], unlocked: false, completed: false },
            { id: "tm-7", worldId: "timber", levelInWorld: 7, displayName: "Level 7", letters: ['F', 'O', 'R', 'E', 'S', 'T'], targetWords: ["FOREST", "FORTE", "REST", "STORE", "FORTS", "SOFT", "SET"], unlocked: false, completed: false },
        ]
    },
    {
        id: "valley", name: "HIDDEN VALLEY", themeColorVar: "--world-crystal-bg", isGenerated: false, levels: [ 
            { id: "hv-1", worldId: "valley", levelInWorld: 1, displayName: "Level 1", letters: ['C', 'U', 'P'], targetWords: ["CUP", "UP"], unlocked: false, completed: false },
            { id: "hv-2", worldId: "valley", levelInWorld: 2, displayName: "Level 2", letters: ['H', 'A', 'T'], targetWords: ["HAT", "AT", "AH"], unlocked: false, completed: false },
            { id: "hv-3", worldId: "valley", levelInWorld: 3, displayName: "Level 3", letters: ['P', 'A', 'T', 'H'], targetWords: ["PATH", "APT", "HAT", "PAT", "TAP"], unlocked: false, completed: false },
            { id: "hv-4", worldId: "valley", levelInWorld: 4, displayName: "Level 4", letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK", "CORK", "ORC"], unlocked: false, completed: false },
            { id: "hv-5", worldId: "valley", levelInWorld: 5, displayName: "Level 5", letters: ['C', 'A', 'V', 'E'], targetWords: ["CAVE", "ACE", "AVE"], unlocked: false, completed: false },
            { id: "hv-6", worldId: "valley", levelInWorld: 6, displayName: "Level 6", letters: ['S', 'T', 'R', 'E', 'A', 'M'], targetWords: ["STREAM", "STEAM", "MARE", "RATE", "STAR", "TEAM", "RAM"], unlocked: false, completed: false },
            { id: "hv-7", worldId: "valley", levelInWorld: 7, displayName: "Level 7", letters: ['P', 'L', 'A', 'T', 'E', 'U'], targetWords: ["PLEAT", "PLATE", "LATE", "TALE", "PEAT", "TAP"], unlocked: false, completed: false },
        ]
    },
    {
        id: "cosmic", name: "COSMIC CLUSTERS", themeColorVar: "--world-cosmic-bg", isGenerated: false, levels: [
            { id: "cs-1", worldId: "cosmic", levelInWorld: 1, displayName: "Level 1", letters: ['B', 'A', 'T'], targetWords: ["BAT", "TAB", "AT"], unlocked: false, completed: false },
            { id: "cs-2", worldId: "cosmic", levelInWorld: 2, displayName: "Level 2", letters: ['P', 'L', 'A', 'N'], targetWords: ["PLAN", "LAP", "PAN", "NAP"], unlocked: false, completed: false },
            { id: "cs-3", worldId: "cosmic", levelInWorld: 3, displayName: "Level 3", letters: ['S', 'P', 'A', 'C', 'E'], targetWords: ["SPACE", "CAPE", "PACE", "ACES", "APE"], unlocked: false, completed: false },
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
let gameSettings: GameSettings = {
    soundEffectsEnabled: true,
    musicEnabled: true,
    adsRemoved: false,
};

// Gemini API
let genAI: GoogleGenAI | null = null;
const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
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

// World Generation UI
const worldThemeInput = document.getElementById('world-theme-input') as HTMLInputElement;
const numLevelsInput = document.getElementById('num-levels-input') as HTMLInputElement;
const generateWorldButton = document.getElementById('generate-world-button') as HTMLButtonElement;
const generationLoadingIndicator = document.getElementById('generation-loading-indicator')!;
const generationStatusMessage = document.getElementById('generation-status-message')!;

// Game UI
const gameBackButton = document.getElementById('game-back-button')!;
const gameSettingsButton = document.getElementById('game-settings-button')!;
const levelNameDisplay = document.getElementById('level-name-display')!;
const wordGridContainerEl = document.getElementById('word-grid-container')!;
const currentWordDisplay = document.getElementById('current-word')!;
const letterWheel = document.getElementById('letter-wheel')!;
const shuffleButton = document.getElementById('shuffle-button')!;
const hintButton = document.getElementById('hint-button')!;
const micButton = document.getElementById('mic-button')! as HTMLButtonElement;
const hintCostDisplay = document.getElementById('hint-cost')!;
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

    if (wordToCheck.length < (currentPlayingLevel.letters.length >= 3 ? 2 : 3) && wordToCheck.length > 0 && currentPlayingLevel.letters.length >=3 ) { 
      if (wordToCheck.length < 2 && currentPlayingLevel.letters.length >=2 ) {
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
        if (wordToCheck.length >= (currentPlayingLevel.letters.length >=3 ? 2 : 3)) { 
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
        renderWordGrid();
        updateScoreboardAndCoins();
        saveProgress(); // Save after coin update
        
        const allRequiredWordsFound = currentPlayingLevel.targetWords.every(w => foundWords.includes(w));
        if (allRequiredWordsFound) {
            currentPlayingLevel.completed = true;
            unlockNextLevel(currentPlayingLevel);
            saveProgress(); // Save after level completion and unlock
            showFeedback(`Level Complete! All words found.`, true, true);
        }

    } else if (foundWords.includes(wordToCheck)) {
        showFeedback(`"${wordToCheck}" already found.`, false, false, 1500);
        triggerScreenShake();
    } else if (isWordFormable(wordToCheck, availableLetters) && 
               !bonusWordsFound.includes(wordToCheck) &&
               !currentPlayingLevel.targetWords.includes(wordToCheck) &&
               wordToCheck.length >= (currentPlayingLevel.letters.length >= 4 ? 3 : 2) ) { 
        bonusWordsFound.push(wordToCheck);
        coins += BONUS_COIN_VALUE;
        updateScoreboardAndCoins();
        renderBonusWordsList();
        updateBonusBadgeOnAllScreens(newBonusWordsCount + 1);
        showFeedback(`Bonus word: "${wordToCheck}"! +${BONUS_COIN_VALUE} coin.`, true, false, 2000);
        
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
    setTimeout(() => gameContainer.classList.remove('screen-shake'), 300);
}

function handleShuffleLetters() {
    for (let i = availableLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableLetters[i], availableLetters[j]] = [availableLetters[j], availableLetters[i]];
    }
    clearSwipeState();
    renderLetters();
    showFeedback("Letters shuffled!", true, false, 1000);
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
            for(let i=0; i<tiles.length; i++) {
                 if (!tiles[i].classList.contains('empty') && tiles[i].textContent !== hintWord[i]) {
                    potentialMatch = false;
                    break;
                 }
            }
            // This logic for finding the correct row is simplistic.
            // A robust way: give each .word-row an ID or data-word attribute
            // For now, we assume the first empty row of correct length is it, or update the one that becomes filled
            if(potentialMatch && foundWords.includes(hintWord)) { // Check if it's the one we just added
                tiles.forEach((tile, i) => {
                    if(tile.textContent === hintWord[i]) { // Check if tile now displays the correct letter
                         tile.classList.add('hinted-reveal');
                         setTimeout(()=> tile.classList.remove('hinted-reveal'), 600);
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
            id: "tutorial", name: "WELCOME TUTOR", themeColorVar: "--world-tutorial-bg", isGenerated: false, levels: [
                { id: "tut-1", worldId: "tutorial", levelInWorld: 1, displayName: "Level 1", letters: ['C', 'A', 'T'], targetWords: ["CAT", "ACT"], unlocked: true, completed: false },
                { id: "tut-2", worldId: "tutorial", levelInWorld: 2, displayName: "Level 2", letters: ['D', 'O', 'G'], targetWords: ["DOG", "GOD"], unlocked: false, completed: false },
                { id: "tut-3", worldId: "tutorial", levelInWorld: 3, displayName: "Level 3", letters: ['P', 'L', 'A', 'Y'], targetWords: ["PLAY", "PAY", "LAP"], unlocked: false, completed: false },
            ]
        },
        {
            id: "outback", name: "OUTBACK", themeColorVar: "--world-outback-bg", isGenerated: false, levels: [
                { id: "ob-1", worldId: "outback", levelInWorld: 1, displayName: "Level 1", letters: ['S', 'U', 'N'], targetWords: ["SUN"], unlocked: false, completed: false },
                { id: "ob-2", worldId: "outback", levelInWorld: 2, displayName: "Level 2", letters: ['P', 'E', 'T', 'N'], targetWords: ["PET", "PEN", "TEN", "NET"], unlocked: false, completed: false },
                { id: "ob-3", worldId: "outback", levelInWorld: 3, displayName: "Level 3", letters: ['L', 'A', 'K', 'E'], targetWords: ["LAKE", "ALE"], unlocked: false, completed: false },
                { id: "ob-4", worldId: "outback", levelInWorld: 4, displayName: "Level 4", letters: ['R', 'O', 'A', 'D'], targetWords: ["ROAD", "ROD", "RAD"], unlocked: false, completed: false },
                { id: "ob-5", worldId: "outback", levelInWorld: 5, displayName: "Level 5", letters: ['B', 'E', 'A', 'R'], targetWords: ["BEAR", "ARE", "BAR", "EAR", "ERA"], unlocked: false, completed: false },
                { id: "ob-6", worldId: "outback", levelInWorld: 6, displayName: "Level 6", letters: ['S', 'T', 'O', 'N', 'E'], targetWords: ["STONE", "TONES", "NOTES", "NETS", "SENT", "NEST", "ONE", "TEN"], unlocked: false, completed: false },
                { id: "ob-7", worldId: "outback", levelInWorld: 7, displayName: "Level 7", letters: ['C', 'A', 'M', 'P', 'E', 'R'], targetWords: ["CAMPER", "REAM", "RAMP", "CAMP", "CAPE", "MARE", "EARP"], unlocked: false, completed: false },
            ]
        },
         {
            id: "timber", name: "TIMBER", themeColorVar: "--world-timber-bg", isGenerated: false, levels: [
                { id: "tm-1", worldId: "timber", levelInWorld: 1, displayName: "Level 1", letters: ['L', 'O', 'G'], targetWords: ["LOG", "GO"], unlocked: false, completed: false },
                { id: "tm-2", worldId: "timber", levelInWorld: 2, displayName: "Level 2", letters: ['A', 'X', 'E'], targetWords: ["AXE", "AX"], unlocked: false, completed: false },
                { id: "tm-3", worldId: "timber", levelInWorld: 3, displayName: "Level 3", letters: ['T', 'R', 'E', 'E'], targetWords: ["TREE", "TEE", "ERE"], unlocked: false, completed: false },
                { id: "tm-4", worldId: "timber", levelInWorld: 4, displayName: "Level 4", letters: ['W', 'O', 'O', 'D'], targetWords: ["WOOD", "WOO", "DO"], unlocked: false, completed: false },
                { id: "tm-5", worldId: "timber", levelInWorld: 5, displayName: "Level 5", letters: ['L', 'E', 'A', 'F'], targetWords: ["LEAF", "ALE", "ELF"], unlocked: false, completed: false },
                { id: "tm-6", worldId: "timber", levelInWorld: 6, displayName: "Level 6", letters: ['B', 'R', 'A', 'N', 'C', 'H'], targetWords: ["BRANCH", "BARN", "ARCH", "CARB", "RAN", "CAN"], unlocked: false, completed: false },
                { id: "tm-7", worldId: "timber", levelInWorld: 7, displayName: "Level 7", letters: ['F', 'O', 'R', 'E', 'S', 'T'], targetWords: ["FOREST", "FORTE", "REST", "STORE", "FORTS", "SOFT", "SET"], unlocked: false, completed: false },
            ]
        },
        {
            id: "valley", name: "HIDDEN VALLEY", themeColorVar: "--world-crystal-bg", isGenerated: false, levels: [ 
                { id: "hv-1", worldId: "valley", levelInWorld: 1, displayName: "Level 1", letters: ['C', 'U', 'P'], targetWords: ["CUP", "UP"], unlocked: false, completed: false },
                { id: "hv-2", worldId: "valley", levelInWorld: 2, displayName: "Level 2", letters: ['H', 'A', 'T'], targetWords: ["HAT", "AT", "AH"], unlocked: false, completed: false },
                { id: "hv-3", worldId: "valley", levelInWorld: 3, displayName: "Level 3", letters: ['P', 'A', 'T', 'H'], targetWords: ["PATH", "APT", "HAT", "PAT", "TAP"], unlocked: false, completed: false },
                { id: "hv-4", worldId: "valley", levelInWorld: 4, displayName: "Level 4", letters: ['R', 'O', 'C', 'K'], targetWords: ["ROCK", "CORK", "ORC"], unlocked: false, completed: false },
                { id: "hv-5", worldId: "valley", levelInWorld: 5, displayName: "Level 5", letters: ['C', 'A', 'V', 'E'], targetWords: ["CAVE", "ACE", "AVE"], unlocked: false, completed: false },
                { id: "hv-6", worldId: "valley", levelInWorld: 6, displayName: "Level 6", letters: ['S', 'T', 'R', 'E', 'A', 'M'], targetWords: ["STREAM", "STEAM", "MARE", "RATE", "STAR", "TEAM", "RAM"], unlocked: false, completed: false },
                { id: "hv-7", worldId: "valley", levelInWorld: 7, displayName: "Level 7", letters: ['P', 'L', 'A', 'T', 'E', 'U'], targetWords: ["PLEAT", "PLATE", "LATE", "TALE", "PEAT", "TAP"], unlocked: false, completed: false },
            ]
        },
        {
            id: "cosmic", name: "COSMIC CLUSTERS", themeColorVar: "--world-cosmic-bg", isGenerated: false, levels: [
                { id: "cs-1", worldId: "cosmic", levelInWorld: 1, displayName: "Level 1", letters: ['B', 'A', 'T'], targetWords: ["BAT", "TAB", "AT"], unlocked: false, completed: false },
                { id: "cs-2", worldId: "cosmic", levelInWorld: 2, displayName: "Level 2", letters: ['P', 'L', 'A', 'N'], targetWords: ["PLAN", "LAP", "PAN", "NAP"], unlocked: false, completed: false },
                { id: "cs-3", worldId: "cosmic", levelInWorld: 3, displayName: "Level 3", letters: ['S', 'P', 'A', 'C', 'E'], targetWords: ["SPACE", "CAPE", "PACE", "ACES", "APE"], unlocked: false, completed: false },
            ]
        }
    ];
    
    if (initialRoadmap.length > 0 && initialRoadmap[0].levels.length > 0) {
        initialRoadmap[0].levels[0].unlocked = true;
        for (let i = 1; i < initialRoadmap[0].levels.length; i++) {
            initialRoadmap[0].levels[i].unlocked = false;
        }
        for (let wIdx = 1; wIdx < initialRoadmap.length; wIdx++) {
            initialRoadmap[wIdx].levels.forEach(l => l.unlocked = false);
        }
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
    };

    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            coins = progress.coins || 100;
            bonusWordsFound = progress.bonusWordsFound || [];
            gameSettings = { ...defaultSettings, ...(progress.settings || {}) };
            
            if (progress.gameRoadmap && Array.isArray(progress.gameRoadmap)) {
                const loadedRoadmap = progress.gameRoadmap as WorldDefinition[];
                const defaultLevelsMap = new Map<string, LevelDefinition>();
                initialDefaultRoadmap.filter(w => !w.isGenerated).forEach(world => world.levels.forEach(level => defaultLevelsMap.set(level.id, level)));

                const newRoadmap: WorldDefinition[] = [];
                loadedRoadmap.forEach(savedWorld => {
                    const newWorld: WorldDefinition = { ...savedWorld, levels: [] };
                    const defaultWorldStructure = initialDefaultRoadmap.find(w => w.id === savedWorld.id && !w.isGenerated);

                    if (savedWorld.levels && Array.isArray(savedWorld.levels)) {
                        savedWorld.levels.forEach(savedLevel => {
                            const defaultLevelData = defaultLevelsMap.get(savedLevel.id);
                            if (defaultLevelData && !savedWorld.isGenerated) { 
                                newWorld.levels.push({
                                    ...defaultLevelData, 
                                    unlocked: savedLevel.unlocked, 
                                    completed: savedLevel.completed, 
                                } as LevelDefinition);
                            } else if (savedWorld.isGenerated) { 
                                newWorld.levels.push({ ...savedLevel }); 
                            }
                        });
                    }
                    
                    if (defaultWorldStructure) {
                        defaultWorldStructure.levels.forEach(defLvl => {
                            if (!newWorld.levels.find(svLvl => svLvl.id === defLvl.id)) {
                                const freshDefaultLevel = JSON.parse(JSON.stringify(defLvl));
                                const isFirstWorldOverall = initialDefaultRoadmap.length > 0 && initialDefaultRoadmap[0].id === freshDefaultLevel.worldId;
                                freshDefaultLevel.unlocked = isFirstWorldOverall && freshDefaultLevel.levelInWorld === 1 && !newWorld.levels.some(l => l.unlocked);
                                freshDefaultLevel.completed = false;
                                newWorld.levels.push(freshDefaultLevel);
                            }
                        });
                        newWorld.levels.sort((a,b) => a.levelInWorld - b.levelInWorld); 
                    }


                    if (newWorld.levels.length > 0 || savedWorld.isGenerated) { 
                        newRoadmap.push(newWorld);
                    }
                });

                initialDefaultRoadmap.forEach(defaultWorld => {
                    if (!newRoadmap.find(w => w.id === defaultWorld.id)) {
                         const newDefaultWorld = JSON.parse(JSON.stringify(defaultWorld)); 
                         newDefaultWorld.levels.forEach((l: LevelDefinition, idx: number) => {
                            const isFirstWorldOfAll = initialDefaultRoadmap.length > 0 && initialDefaultRoadmap[0].id === newDefaultWorld.id;
                            l.completed = false;
                            l.unlocked = isFirstWorldOfAll && idx === 0; 
                         });
                         newRoadmap.push(newDefaultWorld);
                    }
                });

                gameRoadmap = newRoadmap.sort((a, b) => { 
                    const aIndexInitial = initialDefaultRoadmap.findIndex(dw => dw.id === a.id);
                    const bIndexInitial = initialDefaultRoadmap.findIndex(dw => dw.id === b.id);

                    const aIsDefault = aIndexInitial !== -1;
                    const bIsDefault = bIndexInitial !== -1;

                    if (aIsDefault && !bIsDefault) return -1;
                    if (!aIsDefault && bIsDefault) return 1;
                    if (aIsDefault && bIsDefault) {
                        return aIndexInitial - bIndexInitial;
                    }
                    if (!aIsDefault && !bIsDefault) { 
                        return (a.id < b.id) ? -1 : 1;
                    }
                    return 0; 
                });

            } else { 
                gameRoadmap = initialDefaultRoadmap;
            }
        } catch (e) {
            console.error("Error loading progress, resetting to default:", e);
            coins = 100;
            bonusWordsFound = [];
            gameRoadmap = initialDefaultRoadmap; 
            gameSettings = defaultSettings;
        }
    } else { 
         gameRoadmap = initialDefaultRoadmap;
         gameSettings = defaultSettings;
    }
    if (gameRoadmap.length > 0 && gameRoadmap[0].levels.length > 0) {
        const anyUnlocked = gameRoadmap.some(world => world.levels.some(level => level.unlocked));
        if (!anyUnlocked) {
            gameRoadmap[0].levels[0].unlocked = true;
        }
    }
    updateGlobalUIElements();
    applySettings(); // Apply loaded settings to UI
}

// --- Gemini API World Generation ---
// ... (handleGenerateWorldClick, validateGeneratedWorld, initGemini remain the same) ...
function initGemini() {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        console.error("API_KEY is not set for Gemini.");
        generateWorldButton.disabled = true;
        worldThemeInput.disabled = true;
        numLevelsInput.disabled = true;
        if (generationStatusMessage) generationStatusMessage.textContent = "API Key not set. Please add one in Settings.";
        if(apiKeyStatus) apiKeyStatus.textContent = "";
        return;
    }
    try {
        genAI = new GoogleGenAI({ apiKey: apiKey });
        generateWorldButton.disabled = false;
        worldThemeInput.disabled = false;
        numLevelsInput.disabled = false;
        if (generationStatusMessage) generationStatusMessage.textContent = "";
        if(apiKeyStatus) apiKeyStatus.textContent = "API Key Loaded.";
        if(apiKeyStatus) apiKeyStatus.style.color = 'green';
        setTimeout(() => {
            if(apiKeyStatus) apiKeyStatus.textContent = "";
        }, 3000);
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        showFeedback("Failed to initialize World Generation service.", false, false, 3000);
        generateWorldButton.disabled = true;
        if (generationStatusMessage) generationStatusMessage.textContent = "Invalid API Key. Please check settings.";
        if(apiKeyStatus) apiKeyStatus.textContent = "Invalid API Key.";
        if(apiKeyStatus) apiKeyStatus.style.color = 'red';
    }
}

async function handleGenerateWorldClick() {
    if (!genAI) {
        showFeedback("World Generation service is not initialized.", false, false, 2000);
        return;
    }

    const theme = worldThemeInput.value.trim();
    const numLevels = parseInt(numLevelsInput.value, 10);

    if (!theme) {
        showFeedback("Please enter a theme for your world.", false, false, 2000);
        return;
    }
    if (isNaN(numLevels) || numLevels < 1 || numLevels > 7) { 
        showFeedback("Please enter a valid number of levels (1-7).", false, false, 2000);
        return;
    }

    generateWorldButton.disabled = true;
    generationLoadingIndicator.classList.remove('hidden');

    let levelStructurePrompt = "";
    if (numLevels === 7) { 
        levelStructurePrompt = `
The world should have a specific structure of 7 levels:
- Level 1: 3 unique uppercase English letters.
- Level 2: 3 unique uppercase English letters.
- Level 3: 4 unique uppercase English letters.
- Level 4: 4 unique uppercase English letters.
- Level 5: 4 unique uppercase English letters.
- Level 6: 5 unique uppercase English letters.
- Level 7: 6 unique uppercase English letters.
Ensure the 'letters' array for each level reflects this count accurately.
`;
    } else { 
        levelStructurePrompt = `
The world should have ${numLevels} levels.
Each level's 'letters' array MUST be an array of 3 to 7 **unique** uppercase English letters.
`;
    }


    const prompt = `
You are a creative game designer for a word puzzle game.
The player wants a new world with the theme: "${theme}".
${levelStructurePrompt}

Provide the output in a single, valid JSON object format, strictly adhering to this structure:
{
  "worldName": "A creative, capitalized name for the world based on the theme (e.g., 'SANDY REALMS', 'FROZEN EXPANSE'). Maximum 20 characters.",
  "levels": [
    {
      "letters": ["L", "E", "T", "R", "S"],
      "targetWords": ["WORDONE", "WORDTWO"]
    }
    // ... more level objects
  ]
}

Critical constraints for EACH level object within the 'levels' array:
1.  'letters':
    *   Follow the unique letter count as specified by the level structure for ${numLevels} levels. All letters must be uppercase English letters.
2.  'targetWords':
    *   MUST be an array of 1 to 5 common English words.
    *   Each word in 'targetWords' MUST be 2 to 7 letters long (allow 2-letter words for 3-letter puzzles, otherwise prefer 3+ letters).
    *   Each word in 'targetWords' MUST be composed **only** of letters from its corresponding 'letters' array for that level. All words must be uppercase.
    *   VERY IMPORTANT: When forming a word, each letter from the 'letters' array can be used **at most once** per word. For example, if 'letters' is ["A", "P", "L", "E"], "APPLE" is NOT a valid targetWord (uses "P" twice, and 'P' only appears once in letters), but "APE" and "ALE" are valid. "PEEL" would be invalid if 'letters' is ["P", "E", "L"] as "E" is used twice but only available once.
    *   Words should be common and appropriate for a general audience. Only use widely known English words. Avoid obscure or very technical terms.
3.  The total number of level objects in the "levels" array MUST exactly match the requested ${numLevels}.

Example of a single valid level object for a 6-letter puzzle (Level 7 of a 7-level world):
{
  "letters": ["F", "O", "R", "E", "S", "T"],
  "targetWords": ["FOREST", "REST", "FOR", "SET", "SORT"]
}


Ensure the entire output is a single, valid JSON object, starting with '{' and ending with '}'. Do not include any explanatory text, markdown, or comments outside the JSON structure itself.
`;

    try {
        const response: GenerateContentResponse = await genAI.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const generatedData = JSON.parse(jsonStr) as GeminiWorldResponse;

        if (!validateGeneratedWorld(generatedData, numLevels, numLevels === 7)) { 
            throw new Error("Gemini response validation failed. Please try a different theme or adjust number of levels.");
        }

        const newWorldId = `gen-world-${Date.now()}`;
        const newWorld: WorldDefinition = {
            id: newWorldId,
            name: generatedData.worldName.toUpperCase().substring(0, 20), 
            themeColorVar: DEFAULT_GENERATED_WORLD_THEME_VAR,
            isGenerated: true,
            levels: generatedData.levels.map((levelData, index) => ({
                id: `${newWorldId}-lvl-${index + 1}`,
                worldId: newWorldId,
                levelInWorld: index + 1,
                displayName: `Level ${index + 1}`,
                letters: levelData.letters.map(l => l.toUpperCase()),
                targetWords: levelData.targetWords.map(w => w.toUpperCase()),
                unlocked: index === 0, 
                completed: false,
            }))
        };
        
        let makeFirstLevelUnlocked = true;
        if (gameRoadmap.some(world => world.levels.some(level => level.unlocked && !level.completed))) {
            makeFirstLevelUnlocked = false; 
        }
        
        newWorld.levels.forEach((level, index) => {
            level.unlocked = (index === 0 && makeFirstLevelUnlocked);
        });


        gameRoadmap.push(newWorld);
        if (makeFirstLevelUnlocked) {
            gameRoadmap.forEach(world => {
                if (world.id !== newWorldId) {
                    world.levels.forEach(level => {
                        // No change to existing logic which allows multiple active levels
                    });
                }
            });
        }


        renderRoadmap();
        saveProgress();
        showFeedback(`New world "${newWorld.name}" generated successfully!`, true, false, 3000);
        worldThemeInput.value = ''; 

    } catch (error: any) {
        console.error("Error generating world:", error);
        let userMessage = "Failed to generate world. Please try again.";
        if (error instanceof Error) {
            if (error.message.toLowerCase().includes("json parse error") || error.message.toLowerCase().includes("unexpected token")) {
                userMessage = "Failed to generate world: received an invalid format. Please try again.";
            } else if (error.message.includes("Gemini response validation failed")) {
                userMessage = error.message + " Try a different theme or simplify your request.";
            } else {
                 userMessage = `Failed to generate world: ${error.message}. Try a different theme or simplify your request.`;
            }
        }
        showFeedback(userMessage, false, false, 0);
    } finally {
        generateWorldButton.disabled = false;
        generationLoadingIndicator.classList.add('hidden');
    }
}

function validateGeneratedWorld(data: GeminiWorldResponse, expectedNumLevels: number, strictStructure: boolean = false): boolean {
    if (!data || !data.worldName || typeof data.worldName !== 'string' || data.worldName.trim() === '') {
        console.error("Validation failed: Invalid or missing worldName", data?.worldName);
        return false;
    }
    if (data.worldName.length > 20) {
        console.warn("Validation warning: worldName exceeds 20 characters, will be truncated.", data.worldName)
    }

    if (!data.levels || !Array.isArray(data.levels) || data.levels.length !== expectedNumLevels) {
        console.error(`Validation failed: Levels array issues. Expected ${expectedNumLevels}, got ${data.levels?.length}`, data.levels);
        return false;
    }
    
    const expectedLetterCountsFor7Level = [3, 3, 4, 4, 4, 5, 6]; 

    for (let i = 0; i < data.levels.length; i++) {
        const level = data.levels[i];
        const expectedLCount = (strictStructure && expectedNumLevels === 7) ? expectedLetterCountsFor7Level[i] : null;

        if (!level.letters || !Array.isArray(level.letters) || level.letters.length < 3 || level.letters.length > 7) {
            console.error(`Validation failed: Invalid letters array structure or general length for level ${i+1}`, level);
            return false;
        }
        if (expectedLCount && level.letters.length !== expectedLCount) {
             console.error(`Validation failed: Level ${i+1} expected ${expectedLCount} letters, got ${level.letters.length}`, level.letters);
            return false;
        }

        if (!level.letters.every(l => typeof l === 'string' && /^[A-Z]$/.test(l.toUpperCase()))) {
            console.error(`Validation failed: Letters are not all single uppercase English characters for level ${i+1}`, level.letters);
            return false;
        }
         const uniqueLetters = new Set(level.letters.map(l => l.toUpperCase()));
        if (uniqueLetters.size !== level.letters.length) {
            console.error(`Validation failed: Letters are not unique for level ${i+1}`, level.letters);
            return false;
        }

        if (!level.targetWords || !Array.isArray(level.targetWords) || level.targetWords.length < 1 || level.targetWords.length > 5) { 
            console.error(`Validation failed: Invalid targetWords array structure or length for level ${i+1}`, level);
            return false;
        }
        for (const word of level.targetWords) {
            const upperWord = word.toUpperCase();
            const minWordLength = level.letters.length === 3 ? 2 : 3; 
            if (typeof word !== 'string' || upperWord.length < minWordLength || upperWord.length > 7 || !/^[A-Z]+$/.test(upperWord)) {
                 console.error(`Validation failed: Invalid target word format, characters, or length (expected ${minWordLength}-7) for word "${word}" in level ${i+1}`, `(letters: ${level.letters.join('')})`);
                return false;
            }
            const upperLetters = level.letters.map(l => l.toUpperCase());
            if (!isWordFormable(upperWord, upperLetters)) {
                console.error(`Validation failed: Word "${upperWord}" not formable from letters "${upperLetters.join('')}" in level ${i+1}`, level);
                return false;
            }
        }
    }
    return true;
}


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
];

function renderShopItems() {
    shopTabCurrencyContent.innerHTML = '';
    shopTabBundlesContent.innerHTML = '';
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
                <button class="shop-price-button" data-item-id="${item.id}">${item.priceDisplay}</button>
            </div>
        `;
        const purchaseButton = itemEl.querySelector('.shop-price-button') as HTMLButtonElement;
        purchaseButton.addEventListener('click', () => handlePurchase(item));

        if (item.type === 'currency') currencyGrid.appendChild(itemEl);
        else if (item.type === 'bundle') bundleGrid.appendChild(itemEl);
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
    updateScoreboardAndCoins();
    saveProgress();
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
}

function handleSettingsChange() {
    gameSettings.soundEffectsEnabled = soundToggle.checked;
    gameSettings.musicEnabled = musicToggle.checked;
    // Logic for sound/music objects would go here
    console.log("Settings saved:", gameSettings);
    saveProgress();
    applySettings();
}

function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
        apiKeyStatus.textContent = "API Key Saved!";
        apiKeyStatus.style.color = 'green';
        setTimeout(() => {
            apiKeyStatus.textContent = "";
        }, 3000);
        initGemini(); // Re-initialize with the new key
    } else {
        localStorage.removeItem('geminiApiKey');
        apiKeyStatus.textContent = "API Key Removed.";
        apiKeyStatus.style.color = 'orange';
        setTimeout(() => {
            apiKeyStatus.textContent = "";
        }, 3000);
        initGemini(); // Re-initialize to disable the feature
    }
}

function handleResetProgress() {
    if (confirm("Are you sure you want to reset all your progress? This cannot be undone!")) {
        localStorage.removeItem('wordFinderDeluxeProgress');
        // Reset in-memory state to defaults
        coins = 100;
        bonusWordsFound = [];
        gameRoadmap = getInitialDefaultRoadmap(); // Get a fresh copy
        gameSettings = { soundEffectsEnabled: true, musicEnabled: true, adsRemoved: false };
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
    micButton.addEventListener('click', handleMicButtonClick); 
    gameBackButton.addEventListener('click', showRoadmapScreen);
    gameSettingsButton.addEventListener('click', openSettingsModal);
    gameAchievementsButton.addEventListener('click', openBonusModal);
    gameShopButton.addEventListener('click', openShopModal);

    // Roadmap Screen Buttons
    roadmapBackButton.addEventListener('click', () => {/* Could implement multi-level back if needed */ showFeedback("Welcome to the Roadmap!", true, false, 1500)}); 
    roadmapSettingsButton.addEventListener('click', openSettingsModal);
    roadmapAchievementsButton.addEventListener('click', openBonusModal);
    roadmapShopButton.addEventListener('click', openShopModal);
    generateWorldButton.addEventListener('click', handleGenerateWorldClick);
    
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
    saveApiKeyButton.addEventListener('click', handleSaveApiKey);
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
    initGemini(); 
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
