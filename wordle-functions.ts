// This file will be appended to index.tsx
// Wordle Game Functions

function showWordleScreen() {
    mainMenuScreen.classList.add('hidden');
    levelSelectionScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    wordleContainer.classList.remove('hidden');

    // Initialize newWordle game if not exists
    if (!wordleGameInstance) {
        const validWords = dictionaryManager.getAllWords();
        wordleGameInstance = new WordleGame(validWords);
    }

    renderWordleGrid();
    updateGlobalUIElements();
}

function renderWordleGrid() {
    wordleGrid.innerHTML = '';

    const state = wordleGameInstance!.getState();
    const maxRows = 6;

    // Create 6 rows
    for (let row = 0; row < maxRows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('wordle-row');
        rowDiv.dataset.row = row.toString();

        // Create 5 tiles per row
        for (let col = 0; col < 5; col++) {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('wordle-tile');
            tileDiv.dataset.col = col.toString();

            // Fill in guessed rows
            if (row < state.guesses.length) {
                const guess = state.guesses[row];
                tileDiv.textContent = guess[col];
                tileDiv.classList.add('filled');
                // Tile state will be set by evaluating the guess
            }
            // Fill in current row being typed
            else if (row === state.currentRow && col < state.currentGuess.length) {
                tileDiv.textContent = state.currentGuess[col];
                tileDiv.classList.add('filled');
            }

            rowDiv.appendChild(tileDiv);
        }

        wordleGrid.appendChild(rowDiv);
    }

    // Update attempt counter
    currentAttemptSpan.textContent = (state.currentRow + 1).toString();

    // Apply colors to completed guesses
    applyWordleColors();
}

function applyWordleColors() {
    const state = wordleGameInstance!.getState();
    const keyStates = new Map<string, 'correct' | 'present' | 'absent'>();

    state.guesses.forEach((guess, rowIndex) => {
        const target = state.targetWord;
        const result = evaluateWordleGuess(guess, target);

        const rowDiv = wordleGrid.querySelector(`[data-row="${rowIndex}"]`);
        if (!rowDiv) return;

        result.forEach((letterResult, colIndex) => {
            const tile = rowDiv.querySelector(`[data-col="${colIndex}"]`) as HTMLElement;
            if (tile) {
                tile.classList.add(letterResult.state);

                // Update keyboard key states
                const existingState = keyStates.get(letterResult.letter);
                if (!existingState ||
                    (letterResult.state === 'correct') ||
                    (letterResult.state === 'present' && existingState !== 'correct')) {
                    keyStates.set(letterResult.letter, letterResult.state);
                }
            }
        });
    });

    // Update keyboard colors
    updateWordleKeyboard(keyStates);
}

function evaluateWordleGuess(guess: string, target: string): LetterResult[] {
    const result: LetterResult[] = [];
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    const used: boolean[] = new Array(5).fill(false);

    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = { letter: guessLetters[i], state: 'correct' };
            used[i] = true;
        }
    }

    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
        if (result[i]) continue;

        const foundIndex = targetLetters.findIndex((letter, idx) =>
            letter === guessLetters[i] && !used[idx]
        );

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
                    coins += 50; // Award coins for winning
                    updateGlobalUIElements();
                    setTimeout(() => {
                        showFeedback('You won! +50 coins', true, false, 3000);
                    }, 1000);
                } else if (state.gameOver) {
                    setTimeout(() => {
                        showFeedback(result.message!, false, false, 3000);
                    }, 1000);
                }
            }
        } else {
            wordleMessage.textContent = result.message || '';
            setTimeout(() => {
                wordleMessage.textContent = '';
            }, 2000);
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

        // Reset keyboard colors
        const keys = wordleKeyboard.querySelectorAll('.key-button');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });
    }
}
