/**
 * @author Ilyssa Tanaka - A01426413
 * Hangman Game - Main Game Logic
 */

// Game State
let currentScreen = 'menu';
let selectedCategory = null;
let currentWord = '';
let hint = '';
let guessedLetters = [];
let wrongGuesses = 0;
let gameStatus = 'playing';
let comboCount = 0;
let wordData = {};

const MAX_WRONG_GUESSES = 6;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadWordData();
    setupEventListeners();
    generateAlphabetButtons();
});

// Load word data from JSON file
async function loadWordData() {
    try {
        const response = await fetch('data/words.json');
        wordData = await response.json();
    } catch (error) {
        console.error('Error loading word data:', error);
        // Fallback data if JSON fails to load
        wordData = {
            animals: [
                { word: "ELEPHANT", hint: "Largest land mammal with a trunk" },
                { word: "GIRAFFE", hint: "Tallest animal with a long neck" }
            ]
        };
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category selection
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            selectCategory(category);
        });
    });

    // Back button
    document.getElementById('back-button').addEventListener('click', returnToMenu);

    // Keyboard input
    document.addEventListener('keydown', (e) => {
        if (currentScreen !== 'game' || gameStatus !== 'playing') return;
        
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            handleLetterClick(key);
        }
    });

    // Keyboard listener for "Respawn" on loss screen
    document.addEventListener('keydown', (e) => {
        // Check if a loss screen is currently active and the Enter key was pressed
        const gameStatusElement = document.getElementById('game-status');
        const isDeathScreen = gameStatusElement && gameStatusElement.querySelector('.death-screen');

        if (isDeathScreen && e.key === 'Enter') {
            returnToMenu();
            // Prevent default action (like form submission)
            e.preventDefault(); 
        }
    });
}

// Generate alphabet buttons
function generateAlphabetButtons() {
    const container = document.getElementById('alphabet-buttons');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    container.innerHTML = '';
    alphabet.forEach(letter => {
        const button = document.createElement('button');
        button.className = 'letter-button';
        button.textContent = letter;
        button.dataset.letter = letter;
        button.addEventListener('click', () => handleLetterClick(letter));
        container.appendChild(button);
    });
}

// Select category and start game
function selectCategory(category) {
    selectedCategory = category;
    currentScreen = 'game';
    
    // Update UI
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    document.body.className = `category-${category}`;
    
    // Update category name
    const categoryNames = {
        animals: 'Animals',
        videogames: 'Video Games',
        javascript: 'JavaScript',
        html: 'HTML',
        java: 'Java'
    };
    document.getElementById('category-name').textContent = categoryNames[category];
    
    // Update header decorations
    const decorations = {
        animals: '🌿',
        videogames: '⚡',
        javascript: '{ }',
        html: '</>',
        java: '☕'
    };
    document.getElementById('game-header-title').textContent = 
        `${decorations[category]} Hangman ${decorations[category]}`;
    
    startNewGame();
}

// Start a new game
function startNewGame() {
    const words = wordData[selectedCategory] || [];
    if (words.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * words.length);
    const selected = words[randomIndex];
    
    currentWord = selected.word;
    hint = selected.hint;
    guessedLetters = [];
    wrongGuesses = 0;
    gameStatus = 'playing';
    comboCount = 0;
    
    // Update UI
    document.getElementById('hint-text').textContent = hint;
    document.getElementById('wrong-count').textContent = `0 / ${MAX_WRONG_GUESSES}`;
    updateWordDisplay();
    updateVisualDisplay();
    resetAlphabetButtons();
    hideGameStatus();
}

// Handle letter click
function handleLetterClick(letter) {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter)) return;
    
    guessedLetters.push(letter);
    
    // Update button state
    const button = document.querySelector(`[data-letter="${letter}"]`);
    if (button) {
        if (currentWord.includes(letter)) {
            button.classList.add('correct');
            comboCount++;
        } else {
            button.classList.add('incorrect');
            wrongGuesses++;
            comboCount = 0;
            
            // Show damage text for video games
            if (selectedCategory === 'videogames') {
                showDamageText();
            }
            
            document.getElementById('wrong-count').textContent = 
                `${wrongGuesses} / ${MAX_WRONG_GUESSES}`;
        }
        button.disabled = true;
    }
    
    updateWordDisplay();
    updateVisualDisplay();
    checkGameStatus();
}

// Update word display
function updateWordDisplay() {
    const display = currentWord.split('').map(letter => 
        guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
    document.getElementById('word-text').textContent = display;
}

// Update visual display (hangman, character, scene)
function updateVisualDisplay() {
    const container = document.getElementById('visual-display');
    
    if (selectedCategory === 'videogames') {
        container.innerHTML = getTerrariaCharacterHTML();
    } else if (selectedCategory === 'animals') {
        container.innerHTML = getAnimalSceneHTML();
    } else if (['javascript', 'html', 'java'].includes(selectedCategory)) {
        container.innerHTML = getCodingDisplayHTML();
    } else {
        container.innerHTML = getHangmanSVG();
    }
}

// Show damage text animation
function showDamageText() {
    const visual = document.getElementById('visual-container');
    const damage = document.createElement('div');
    damage.className = 'damage-text';
    damage.textContent = 'HIT! -20';
    damage.style.left = `${Math.random() * 80 + 10}%`;
    damage.style.top = `${Math.random() * 50 + 10}%`;
    visual.appendChild(damage);
    
    setTimeout(() => damage.remove(), 1000);
}

// Check game status
function checkGameStatus() {
    const wordComplete = currentWord.split('').every(letter => 
        guessedLetters.includes(letter)
    );
    
    if (wordComplete) {
        gameStatus = 'won';
        showGameStatus('won');
    } else if (wrongGuesses >= MAX_WRONG_GUESSES) {
        gameStatus = 'lost';
        showGameStatus('lost');
    }
}

// Show game status (win/loss screen)
function showGameStatus(status) {
    const container = document.getElementById('game-status');
    container.className = `game-status ${status} category-${selectedCategory}`;
    
    // Hide game area and alphabet buttons
    document.querySelector('.game-area').classList.add('hidden');
    document.getElementById('alphabet-buttons').classList.add('hidden');
    
    // VIDEO GAMES 
    if (selectedCategory === 'videogames') {
        if (status === 'won') {
            container.innerHTML = getVideoGameWinHTML();
        } else {
            container.innerHTML = getVideoGameLossHTML();
        }
    }
    // animals
    else if (selectedCategory === 'animals') {
        if (status === 'won') {
            container.innerHTML = getAnimalWinHTML();
        } else {
            container.innerHTML = getAnimalLossHTML();
        }
    }
    // coding languages
    else if (selectedCategory === 'javascript' || selectedCategory === 'html' || selectedCategory === 'java') {
        if (status === 'won') {
            container.innerHTML = getCodingWinHTML();
        } else {
            container.innerHTML = getCodingLossHTML();
        }
    }
    // Default fallback
    else {
        container.innerHTML = getDefaultStatusHTML(status);
    }
    
    container.classList.remove('hidden');
    
    // Add play again button listener
    const playAgainBtn = container.querySelector('.play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', startNewGame);
    }
}

// Hide game status
function hideGameStatus() {
    document.getElementById('game-status').classList.add('hidden');
    
    // Show game area and alphabet buttons again
    document.querySelector('.game-area').classList.remove('hidden');
    document.getElementById('alphabet-buttons').classList.remove('hidden');
}

// Reset alphabet buttons
function resetAlphabetButtons() {
    document.querySelectorAll('.letter-button').forEach(button => {
        button.disabled = false;
        button.className = 'letter-button';
    });
}

// Return to menu
function returnToMenu() {
    currentScreen = 'menu';
    selectedCategory = null;
    
    // RESET ALL GAME STATE
    currentWord = '';
    hint = '';
    guessedLetters = [];
    wrongGuesses = 0;
    gameStatus = 'playing';
    comboCount = 0;
    
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('menu-screen').classList.add('active');
    document.body.className = '';
    
    // Hide any status messages
    hideGameStatus();
}


// Get Terraria character HTML
function getTerrariaCharacterHTML() {
    const lives = 3;
    const health = MAX_WRONG_GUESSES - wrongGuesses;
    const livesRemaining = Math.ceil((health / MAX_WRONG_GUESSES) * lives);
    
    let heartsHTML = '';
    for (let i = 0; i < lives; i++) {
        if (i < livesRemaining) {
            // Full heart - red with shine
            heartsHTML += `
                <svg width="40" height="40" viewBox="0 0 16 16" class="heart filled">
                    <path d="M8 14s-6-4-6-8c0-2 1-3 2.5-3C6 3 7 4 8 5c1-1 2-2 3.5-2C13 3 14 4 14 6c0 4-6 8-6 8z"
                          fill="#ff0000" stroke="#8B0000" stroke-width="0.5"/>
                    <ellipse cx="6" cy="6" rx="1.5" ry="1" fill="#ff6b6b" opacity="0.7"/>
                </svg>
            `;
        } else {
            // Empty/broken heart
            heartsHTML += `
                <svg width="40" height="40" viewBox="0 0 16 16" class="heart empty">
                    <path d="M8 14s-6-4-6-8c0-2 1-3 2.5-3C6 3 7 4 8 5c1-1 2-2 3.5-2C13 3 14 4 14 6c0 4-6 8-6 8z"
                          fill="#2a0000" stroke="#8B0000" stroke-width="0.5"/>
                </svg>
            `;
        }
    }
    
    const comboHTML = comboCount > 1 ? 
        `<div class="combo-counter">🔥 ${comboCount}x COMBO!</div>` : '';
    
    return `
        <div class="terraria-container">
            <div class="hearts-display">${heartsHTML}</div>
            ${comboHTML}
            <img src="images/games/terraria-man.png" alt="Terraria Character" class="terraria-character ${wrongGuesses > 0 ? 'damaged' : ''}">
            ${wrongGuesses > 0 && wrongGuesses < 6 ? '<div class="status-text">Taking Damage!</div>' : ''}
        </div>
    `;
}

// Get animal scene HTML
function getAnimalSceneHTML() {
    const eagleProgress = wrongGuesses / MAX_WRONG_GUESSES;
    const eagleTop = 10 + (eagleProgress * 40);
    // Eagle starts from RIGHT (80%) and flies LEFT towards bunny (20%)
    const eagleLeft = 80 - (eagleProgress * 60); // Starts at 80%, ends at 20%
    const eagleSize = 80 + (eagleProgress * 80);
    
    return `
        <div class="animal-scene">
            <div class="nature-bg">
                <div class="sun"></div>
                <div class="cloud cloud1"></div>
                <div class="cloud cloud2"></div>
                <div class="cloud cloud3"></div>
                <div class="ground"></div>
            </div>
            <img src="images/animals/eagle-flying.gif" alt="Eagle" class="eagle" 
                 style="top: ${eagleTop}%; left: ${eagleLeft}%; width: ${eagleSize}px;">
            <img src="images/animals/rabbit.png" alt="Bunny" class="bunny ${wrongGuesses > 3 ? 'scared' : ''}">
            ${wrongGuesses > 3 ? '<div class="danger-warning">⚠️ DANGER!</div>' : ''}
        </div>
    `;
}

// Get coding language display HTML
function getCodingDisplayHTML() {
    if (selectedCategory === 'javascript') {
        return `
            <div class="js-console">
                <div class="console-header">
                    <div class="traffic-lights">
                        <span class="red"></span>
                        <span class="yellow"></span>
                        <span class="green"></span>
                    </div>
                    <span>Console</span>
                </div>
                <div class="console-output">
                    <div>&gt; Running script...</div>
                    ${wrongGuesses >= 1 ? '<div class="error">❌ Uncaught ReferenceError</div>' : ''}
                    ${wrongGuesses >= 2 ? '<div class="error">❌ Uncaught TypeError</div>' : ''}
                    ${wrongGuesses >= 3 ? '<div class="error">❌ Uncaught SyntaxError</div>' : ''}
                    ${wrongGuesses >= 4 ? '<div class="error">❌ Error: Maximum guesses exceeded</div>' : ''}
                    ${wrongGuesses >= 5 ? '<div class="error">❌ Warning: Script unstable</div>' : ''}
                    ${wrongGuesses >= 6 ? '<div class="error fatal">💥 FATAL ERROR: Script crashed!</div>' : ''}
                </div>
                <div class="error-count">Errors: ${wrongGuesses} / ${MAX_WRONG_GUESSES}</div>
            </div>
        `;
    } else if (selectedCategory === 'html') {
        return `
            <div class="html-browser">
                <div class="browser-bar">
                    <div class="traffic-lights">
                        <span class="red"></span>
                        <span class="yellow"></span>
                        <span class="green"></span>
                    </div>
                    <span>localhost:3000</span>
                </div>
                <div class="page-content ${wrongGuesses > 3 ? 'broken' : ''}">
                    ${wrongGuesses < 2 ? '<div class="element"></div>' : ''}
                    ${wrongGuesses < 3 ? '<div class="element small"></div>' : ''}
                    ${wrongGuesses < 4 ? '<div class="element large"></div>' : ''}
                    ${wrongGuesses < 5 ? '<div class="element medium"></div>' : ''}
                    ${wrongGuesses >= 4 ? `
                        <div class="error-page">
                            <div class="error-icon">⚠️</div>
                            <div class="error-code">Error ${400 + wrongGuesses * 10}</div>
                            <div>Page elements missing</div>
                        </div>
                    ` : ''}
                </div>
                <div class="error-count">Missing Elements: ${wrongGuesses} / ${MAX_WRONG_GUESSES}</div>
            </div>
        `;
    } else if (selectedCategory === 'java') {
        return `
            <div class="java-ide">
                <div class="ide-header">Build Output:</div>
                <div class="build-output">
                    <div class="success">✓ Compiling...</div>
                    ${wrongGuesses >= 1 ? '<div class="error">✗ Error: Variable not initialized</div>' : ''}
                    ${wrongGuesses >= 2 ? '<div class="error">✗ Error: Syntax error on line 42</div>' : ''}
                    ${wrongGuesses >= 3 ? '<div class="error">✗ Error: Cannot find symbol</div>' : ''}
                    ${wrongGuesses >= 4 ? '<div class="error">✗ Error: Incompatible types</div>' : ''}
                    ${wrongGuesses >= 5 ? '<div class="error">✗ Error: Missing return statement</div>' : ''}
                    ${wrongGuesses >= 6 ? '<div class="error fatal">✗ BUILD FAILED</div>' : ''}
                </div>
                <div class="coffee-icon ${wrongGuesses > 4 ? 'faded' : ''}">☕</div>
                <div class="error-count">Compilation Errors: ${wrongGuesses} / ${MAX_WRONG_GUESSES}</div>
            </div>
        `;
    }
}

// Get standard hangman SVG
function getHangmanSVG() {
    return `
        <svg viewBox="0 0 200 250" class="hangman-svg">
            <line x1="10" y1="230" x2="150" y2="230" stroke="#8B4513" stroke-width="4"/>
            <line x1="50" y1="230" x2="50" y2="20" stroke="#8B4513" stroke-width="4"/>
            <line x1="50" y1="20" x2="130" y2="20" stroke="#8B4513" stroke-width="4"/>
            <line x1="130" y1="20" x2="130" y2="50" stroke="#8B4513" stroke-width="2"/>
            ${wrongGuesses >= 1 ? '<circle cx="130" cy="70" r="20" stroke="#2c3e50" stroke-width="3" fill="none"/>' : ''}
            ${wrongGuesses >= 2 ? '<line x1="130" y1="90" x2="130" y2="150" stroke="#2c3e50" stroke-width="3"/>' : ''}
            ${wrongGuesses >= 3 ? '<line x1="130" y1="110" x2="100" y2="130" stroke="#2c3e50" stroke-width="3"/>' : ''}
            ${wrongGuesses >= 4 ? '<line x1="130" y1="110" x2="160" y2="130" stroke="#2c3e50" stroke-width="3"/>' : ''}
            ${wrongGuesses >= 5 ? '<line x1="130" y1="150" x2="110" y2="190" stroke="#2c3e50" stroke-width="3"/>' : ''}
            ${wrongGuesses >= 6 ? '<line x1="130" y1="150" x2="150" y2="190" stroke="#2c3e50" stroke-width="3"/>' : ''}
        </svg>
    `;
}

// Video Game Win HTML
function getVideoGameWinHTML() {
    return `
        <div class="victory-screen videogame">
            <div class="sparkles"></div>
            <h2 class="victory-title">🎉 VICTORY! 🎉</h2>
            <p class="victory-subtitle">You found the treasure!</p>
            <img src="images/games/chest_gold.gif" alt="Treasure Chest" class="treasure-chest">
            <div class="stats-box">
                <p>Word Completed:</p>
                <p class="word-completed">${currentWord}</p>
                ${comboCount > 0 ? `<p class="combo">🔥 Max Combo: ${comboCount}x</p>` : ''}
            </div>
            <button class="play-again-btn">🔄 Play Again</button>
        </div>
    `;
}

// Video Game Loss HTML
function getVideoGameLossHTML() {
    return `
        <div class="death-screen videogame">
            <div class="terraria-ground"></div>
            
            <div class="relative z-10 pt-20">
                <!-- Death Message GIF - Fixed path -->
                <div class="mb-8">
                    <img src="images/games/death-message.gif" 
                         alt="You were slain" 
                         class="death-gif"
                         style="width: 400px; max-width: 90%; height: auto; margin: 0 auto 2rem; display: block;"
                         onerror="this.style.display='none'; console.error('GIF failed to load');">
                </div>
                
                <div class="mb-8">
                    <p class="text-gray-400 text-sm mb-2 pixelated" style="font-family: monospace;">
                        Word was:
                    </p>
                    <p class="text-3xl font-bold text-white pixelated tracking-wider" style="font-family: monospace; text-shadow: 0 0 10px rgba(255,255,255,0.3);">
                        ${currentWord}
                    </p>
                </div>
                
                <p class="text-gray-500 text-sm mb-3 pixelated animate-pulse" style="font-family: monospace;">
                    Press ENTER to respawn
                </p>
                <div class="flex justify-center items-center gap-2 mb-6">
                    <div class="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                        <span class="text-white font-bold text-xl pixelated">↵</span>
                    </div>
                </div>
                
                <button class="play-again-btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center mx-auto pixelated">
                    🔄 Respawn
                </button>
            </div>
        </div>
    `;
}

// Animal Win HTML
function getAnimalWinHTML() {
    return `
        <div class="victory-screen animals">
            <div class="celebration-particles"></div>
            <h2>🎉 Victory! The bunny has escaped! 🎉</h2>
            <img src="images/animals/victory-rabbit.png" alt="Victory Bunny" class="victory-bunny">
            <p>You saved the bunny from the eagle!</p>
            <button class="play-again-btn">🔄 Play Again</button>
        </div>
    `;
}

// Animal Loss HTML
function getAnimalLossHTML() {
    return `
        <div class="death-screen animals">
            <div class="eagle-icon">🦅</div>
            <h2 class="death-title">The poor bunny has died :(</h2>
            <img src="images/animals/lose-rabbit.png" alt="Defeated Bunny" class="lose-bunny">
            <div class="word-reveal">
                <p>Word was:</p>
                <p class="word">${currentWord}</p>
            </div>
            <button class="play-again-btn">🔄 Try Again</button>
        </div>
    `;
}

// Coding Win HTML
function getCodingWinHTML() {
    const titles = {
        javascript: '✅ Code Compiled Successfully!',
        html: '✅ Page Loaded Successfully!',
        java: '☕ BUILD SUCCESSFUL'
    };

    const winGifs = {
    javascript: 'js-win.gif',
    html: 'html-win.gif',
    java: 'java-win.gif'
    };

    return `
        <div class="victory-screen coding ${selectedCategory}">
            <h2>${titles[selectedCategory]}</h2>

            <!-- ⭐ Your WIN GIF -->
            <img src="images/coding-languages/${winGifs[selectedCategory]}" 
                 class="codin-win-gif" alt="Success GIF">

            <p>Perfect! No errors detected!</p>
            <button class="play-again-btn">🔄 Play Again</button>
        </div>
    `;
}


// Coding Loss HTML
function getCodingLossHTML() {
    const titles = {
        javascript: '💥 Script Crashed!',
        html: '❌ 404 - Page Not Found',
        java: '☕ BUILD FAILED'
    };
    
    const gifs = {
        javascript: 'js-fail.gif',
        html: 'html-fail.gif',
        java: 'java-fail.gif'
    };
    
    return `
        <div class="death-screen coding ${selectedCategory}">
            <h2 class="death-title">${titles[selectedCategory]}</h2>
            <img src="images/coding-languages/${gifs[selectedCategory]}" 
            alt="Failure" class="coding-loss-gif">
            <div class="word-reveal">
                <p>Word was:</p>
                <p class="word">${currentWord}</p>
            </div>
            <button class="play-again-btn">🔄 Try Again</button>
        </div>
    `;
}

// Default status HTML
function getDefaultStatusHTML(status) {
    if (status === 'won') {
        return `
            <div class="victory-screen default">
                <h2>🎉 You Won!</h2>
                <p>Congratulations! You guessed the word!</p>
                <button class="play-again-btn">🔄 Play Again</button>
            </div>
        `;
    } else {
        return `
            <div class="death-screen default">
                <h2>💀 Game Over!</h2>
                <div class="word-reveal">
                    <p>The word was:</p>
                    <p class="word">${currentWord}</p>
                </div>
                <button class="play-again-btn">🔄 Play Again</button>
            </div>
        `;
    }
}