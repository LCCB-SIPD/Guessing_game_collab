import { useState, useEffect, useCallback, useRef } from 'react';

// Achievement class converted to plain object factory
const createAchievement = (id, name, description, condition) => ({
    id,
    name,
    description,
    condition,
    unlocked: false,
    check(gameData) {
        if (!this.unlocked && this.condition(gameData)) {
            this.unlocked = true;
            return true;
        }
        return false;
    }
});

// Custom hook for Achievement Manager
export const useAchievementManager = () => {
    const [achievements, setAchievements] = useState([]);
    const [newAchievements, setNewAchievements] = useState([]);

    const initializeAchievements = useCallback(() => {
        const initialAchievements = [
            createAchievement('first_win', 'First Victoryyyyy!', 'Na solbar mona dayon ang una gha ba!', 
                data => data.correctWords >= 1),
            createAchievement('streak_3', 'Triple SHOOTTT!', 'Tatlo ka sunod-sunod nga daog gha ba!', 
                data => data.currentStreak >= 3),
            createAchievement('speed_demon', 'Speeda gid!', 'Nasolusyonan mo sang maayo gha!', 
                data => data.lastSolveTime <= 5),
            createAchievement('high_score', 'Academic Achieverrrrr!', 'Grabe gid ya imo puntos gha!', 
                data => data.score >= 1000),
            createAchievement('perfect_game', 'Perfectionistaaa!', 'Wala gid ka nag-skip kag ga click nag-hint! Believe ko simo ah!', 
                data => data.hintsUsed === 0 && data.skipsUsed === 0 && data.wordsCompleted >= 10)
        ];
        setAchievements(initialAchievements);
    }, []);

    const checkAchievements = useCallback((gameData) => {
        const unlocked = [];
        setAchievements(prev => prev.map(achievement => {
            if (achievement.check(gameData)) {
                unlocked.push(achievement);
                return { ...achievement, unlocked: true };
            }
            return achievement;
        }));
        
        if (unlocked.length > 0) {
            setNewAchievements(unlocked);
        }
        return unlocked;
    }, []);

    const resetAchievements = useCallback(() => {
        setAchievements(prev => prev.map(achievement => ({ 
            ...achievement, 
            unlocked: false 
        })));
        setNewAchievements([]);
    }, []);

    const clearNewAchievements = useCallback(() => {
        setNewAchievements([]);
    }, []);

    // Auto-clear new achievements after 3 seconds
    useEffect(() => {
        if (newAchievements.length > 0) {
            const timer = setTimeout(() => {
                setNewAchievements([]);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [newAchievements]);

    return {
        achievements,
        newAchievements,
        initializeAchievements,
        checkAchievements,
        resetAchievements,
        clearNewAchievements
    };
};

// Custom hook for Game Timer
export const useGameTimer = (initialTime = 30) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef(null);
    const onExpireRef = useRef(null);

    const start = useCallback((onExpire) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        onExpireRef.current = onExpire;
        setIsRunning(true);
        setIsPaused(false);
        
        intervalRef.current = setInterval(() => {

            setTimeRemaining(prev => {

                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setIsRunning(false);
                    if (onExpireRef.current) onExpireRef.current();
                    return 0;
                }
                return newTime;
            });
        }, 1000);
    }, []);

    const pause = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
    }, []);

    const addTime = useCallback((seconds) => {
        setTimeRemaining(prev => Math.min(prev + seconds, 50));
    }, []);

    const reset = useCallback((newTime = initialTime) => {
        stop();
        setTimeRemaining(newTime);
    }, [stop, initialTime]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        timeRemaining,
        isRunning,
        isPaused,
        start,
        pause,
        resume,
        stop,
        addTime,
        reset
    };
};

// WordItem factory function
export const createWordItem = (answer, clue, category, trivia, difficulty = 1) => {
    const shuffle = (word) => {
        let chars = word.toLowerCase().split('');
        for (let i = chars.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('').toUpperCase();
    };

    return {
        answer: answer.toLowerCase(),
        mixedUp: shuffle(answer),
        clue,
        category,
        trivia,
        difficulty,
        revealedLetters: new Set(),
        firstLetterRevealed: false,
        
        isCorrect(guess) {
            return guess.toLowerCase().trim() === this.answer;
        },
        
        revealFirstLetter() {
            if (!this.firstLetterRevealed) {
                this.firstLetterRevealed = true;
                return true;
            }
            return false;
        },

        getDisplayWord() {
            let display = '';
            for (let i = 0; i < this.answer.length; i++) {
                if (this.revealedLetters.has(i)) {
                    display += `<span class="letter-reveal">${this.answer[i].toUpperCase()}</span>`;
                } else if (i < this.mixedUp.length) {
                    display += this.mixedUp[i];
                }
            }
            return display;
        },

        getFirstLetterHint() {
            if (this.firstLetterRevealed) {
                return `First letter: ${this.answer[0].toUpperCase()}`;
            }
            return '';
        }
    };
};

// PowerUp factory function
const createPowerUp = (name, maxUses) => ({
    name,
    maxUses,
    remainingUses: maxUses,
    canUse() {
        return this.remainingUses > 0;
    },
    reset() {
        return {
            ...this,
            remainingUses: this.maxUses
        };
    }
});

// Word database
const createWordDatabase = () => [
    createWordItem('BANANA', 'Yellow fruit na gid ka sweet', 'Food', 'Bananas are berries, pero ang strawberries indi berries!', 1),
    createWordItem('COMPUTER', 'Electronic gadget para sa trabaho kag games', 'Technology', 'Ang first computer bug literal nga bug - insect na na-stuck sa machine!', 2),
    createWordItem('UMBRELLA', 'Gamit sa ulan kag init', 'Objects', 'Ang umbrella ginggamit sa may 4,000 years na sa Egypt!', 2),
    createWordItem('BUTTERFLY', 'Colorful insect na nag-fly', 'Animals', 'Butterflies taste with their feet kag smell with their antennae!', 3),
    createWordItem('CHOCOLATE', 'Sweet treat na favorite sang tanan', 'Food', 'Chocolate kay mas effective pa sa cough syrup para sa ubo!', 2),
    createWordItem('RAINBOW', 'Makita sa langit pagkatapos sang ulan', 'Nature', 'Double rainbows happen when light bounces twice inside raindrops!', 2),
    createWordItem('ELEPHANT', 'Largest land animal', 'Animals', 'Elephants can remember faces kag recognize themselves sa mirror!', 3),
    createWordItem('GUITAR', 'Musical instrument na may strings', 'Music', 'Ang oldest guitar found kay 3,500 years old na gani!', 2),
    createWordItem('LIBRARY', 'Place full of books', 'Places', 'Library of Alexandria kay may estimated 700,000 scrolls!', 2),
    createWordItem('SANDWICH', 'Food between two breads', 'Food', 'Sandwich gin-invent sang Earl of Sandwich para indi maka-tigil sa card games!', 2),
    createWordItem('KEYBOARD', 'Input device para sa computer', 'Technology', 'QWERTY layout gin-designed para ma-slow down ang typing sa typewriters!', 2),
    createWordItem('MOUNTAIN', 'Very high landform', 'Nature', 'Mount Everest naga-grow pa gid by 4mm each year!', 2),
    createWordItem('TELEPHONE', 'Device para sa pag-call', 'Technology', 'First words sa telephone kay "Mr. Watson, come here!"', 3),
    createWordItem('CALENDAR', 'Shows dates kag months', 'Objects', 'Gregorian calendar kay may error of 26 seconds per year!', 2),
    createWordItem('VOLCANO', 'Mountain na may lava', 'Nature', 'May over 1,500 active volcanoes worldwide!', 2),
    createWordItem('DINOSAUR', 'Extinct giant reptiles', 'Animals', 'Dinosaurs lived on Earth for 165 million years!', 3),
    createWordItem('TREASURE', 'Hidden valuable things', 'Objects', 'Pirate treasure maps were mostly fictional inventions!', 2),
    createWordItem('HOSPITAL', 'Place para sa medical care', 'Places', 'First hospitals were established sa monasteries!', 2),
    createWordItem('AIRPLANE', 'Flying vehicle', 'Transportation', 'Wright brothers first flight lasted lang 12 seconds!', 2),
    createWordItem('INTERNET', 'Global network of computers', 'Technology', 'First message sa internet kay "LOGIN" pero nag-crash after "LO"!', 2)
];

// Main game hook
export const useWordScrambleGame = () => {
    const [gameState, setGameState] = useState({
        score: 0,
        round: 1,
        currentWord: null,
        status: 'waiting', // 'waiting', 'playing', 'finished'
        wordsCompleted: 0,
        correctWords: 0,
        incorrectAttempts: 0,
        currentStreak: 0,
        bestStreak: 0,
        hintsUsed: 0,
        skipsUsed: 0,
        totalAttempts: 0,
        lastSolveTime: 0,
        roundStartTime: 0,
        currentView: 'home', // 'home', 'play', 'end'
        userInput: '',
        inputState: 'normal', // 'normal', 'correct', 'incorrect'
        showTrivia: false,
        scorePopup: { show: false, amount: 0 },
        firstLetterHint: ''
    });

    const [wordDatabase, setWordDatabase] = useState([]);
    const [powerUps, setPowerUps] = useState({});
    
    const timer = useGameTimer(30);
    const achievementManager = useAchievementManager();
    const handleTimeUpRef = useRef(null);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Initialize game data
    useEffect(() => {
        const shuffledWords = [...createWordDatabase()].sort(() => Math.random() - 0.5);
        setWordDatabase(shuffledWords);

        const initialPowerUps = {
            firstLetter: createPowerUp('First Letter', 3, (game) => game.revealFirstLetter()), 
            skip: createPowerUp('Skip Word', 3, () => true), 
            time: createPowerUp('Extra Time', 3, () => true) 
        };
        setPowerUps(initialPowerUps);

        achievementManager.initializeAchievements();
    }, []);

    const resetGameStats = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            score: 0,
            round: 1,
            wordsCompleted: 0,
            correctWords: 0,
            incorrectAttempts: 0,
            currentStreak: 0,
            bestStreak: 0,
            hintsUsed: 0,
            skipsUsed: 0,
            totalAttempts: 0,
            lastSolveTime: 0,
            status: 'playing',
            currentView: 'play',
            userInput: '',
            inputState: 'normal',
            showTrivia: false,
            firstLetterHint: ''
        }));
    }, []);

    const resetPowerUps = useCallback(() => {
        setPowerUps(prev => {
            const reset = {};
            Object.keys(prev).forEach(key => {
                reset[key] = prev[key].reset();
            });
            return reset;
        });
    }, []);

    const startNewGame = useCallback(() => {
        resetGameStats();
        achievementManager.resetAchievements();
        resetPowerUps();
        
        // Shuffle word database
        const shuffled = [...wordDatabase].sort(() => Math.random() - 0.5);
        setWordDatabase(shuffled);
        
        // Start with first word
        if (shuffled.length > 0) {
            setGameState(prev => ({
                ...prev,
                currentWord: shuffled[0],
                roundStartTime: Date.now()
            }));
            timer.reset(30);
            timer.start(() => handleTimeUpRef.current?.());
        }
    }, [wordDatabase, achievementManager, resetGameStats, resetPowerUps, timer]);

    const endGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            status: 'finished',
            currentView: 'end'
        }));
        timer.stop();
    }, [timer]);

    const advanceToNextWord = useCallback(() => {
        const currentRound = gameStateRef.current.round;

        if (currentRound >= wordDatabase.length) {
            endGame();
            return;
        }

        const nextWordItem = wordDatabase[currentRound];

        setGameState(prev => {
            if (!nextWordItem) {
                return {
                    ...prev,
                    status: 'finished',
                    currentView: 'end'
                };
            }

            return {
                ...prev,
                round: prev.round + 1,
                currentWord: nextWordItem,
                roundStartTime: Date.now(),
                userInput: '',
                inputState: 'normal',
                showTrivia: false,
                firstLetterHint: ''
            };
        });

        if (nextWordItem) {
            timer.reset(30);
            timer.start(() => handleTimeUpRef.current?.());
        } else {
            timer.stop();
        }
    }, [endGame, wordDatabase, timer]);

    const submitGuess = useCallback(() => {
        if (gameState.status !== 'playing' || !gameState.userInput.trim()) return;

        const guess = gameState.userInput.trim();
        setGameState(prev => ({
            ...prev,
            totalAttempts: prev.totalAttempts + 1
        }));

        if (gameState.currentWord && gameState.currentWord.isCorrect(guess)) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }, [gameState.status, gameState.userInput, gameState.currentWord]);

    const handleCorrectAnswer = useCallback(() => {
        timer.stop();
        const timeTaken = Math.floor((Date.now() - gameState.roundStartTime) / 1000);
        
        const baseScore = 100 * gameState.currentWord.difficulty;
        const timeBonus = Math.max(0, (30 - timeTaken) * 5);
        const streakBonus = gameState.currentStreak > 0 ? (gameState.currentStreak + 1) * 10 : 0;
        const totalScore = baseScore + timeBonus + streakBonus;

        setGameState(prev => ({
            ...prev,
            correctWords: prev.correctWords + 1,
            wordsCompleted: prev.wordsCompleted + 1,
            currentStreak: prev.currentStreak + 1,
            bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
            score: prev.score + totalScore,
            lastSolveTime: timeTaken,
            inputState: 'correct',
            userInput: prev.currentWord.answer.toUpperCase(),
            scorePopup: { show: true, amount: totalScore }
        }));

        // Check achievements
        const gameData = {
            score: gameState.score + totalScore,
            correctWords: gameState.correctWords + 1,
            currentStreak: gameState.currentStreak + 1,
            bestStreak: Math.max(gameState.bestStreak, gameState.currentStreak + 1),
            wordsCompleted: gameState.wordsCompleted + 1,
            hintsUsed: gameState.hintsUsed,
            skipsUsed: gameState.skipsUsed,
            lastSolveTime: timeTaken,
            totalAttempts: gameState.totalAttempts + 1
        };
        achievementManager.checkAchievements(gameData);

        // Show trivia after delay
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                showTrivia: true,
                scorePopup: { show: false, amount: 0 }
            }));
        }, 1500);
    }, [timer, gameState, achievementManager]);

    const handleIncorrectAnswer = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            incorrectAttempts: prev.incorrectAttempts + 1,
            currentStreak: 0,
            inputState: 'incorrect'
        }));

        // Reset input state after animation
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                inputState: 'normal',
                userInput: ''
            }));
        }, 500);
    }, []);

    const handleTimeUp = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            currentStreak: 0,
            inputState: 'incorrect',
            userInput: `Time's up! Answer: ${prev.currentWord?.answer.toUpperCase() || ''}`
        }));

        setTimeout(() => {
            advanceToNextWord();
        }, 2000);
    }, [advanceToNextWord]);

    useEffect(() => {
        handleTimeUpRef.current = handleTimeUp;
    }, [handleTimeUp]);

    const closeTriviaModal = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            showTrivia: false
        }));
        
        setTimeout(() => {
            advanceToNextWord();
        }, 300);
    }, [advanceToNextWord]);

    const restartFromBeginning = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            currentView: 'home',
            status: 'waiting'
        }));
    }, []);

    const useHelper = useCallback((type) => {
        if (gameState.status !== 'playing') return;
        
        const powerUp = powerUps[type];
        if (!powerUp || !powerUp.canUse()) return;

        let success = false;
        
        if (type === 'firstLetter' && gameState.currentWord) {
            if (gameState.currentWord.revealFirstLetter()) {
                setGameState(prev => ({
                    ...prev,
                    hintsUsed: prev.hintsUsed + 1,
                    firstLetterHint: prev.currentWord.getFirstLetterHint()
                }));
                success = true;
            }
        } else if (type === 'skip') {
            setGameState(prev => ({
                ...prev,
                skipsUsed: prev.skipsUsed + 1,
                currentStreak: 0,
                inputState: 'correct',
                userInput: `Answer: ${prev.currentWord?.answer.toUpperCase() || ''}`
            }));
            timer.stop();
            setTimeout(() => {
                advanceToNextWord();
            }, 2000);
            success = true;
        } else if (type === 'time') {
            timer.addTime(10);
            success = true;
        }

        if (success) {
            setPowerUps(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    remainingUses: prev[type].remainingUses - 1
                }
            }));
        }
    }, [gameState, powerUps, timer, advanceToNextWord]);

    const updateUserInput = useCallback((value) => {
        setGameState(prev => ({
            ...prev,
            userInput: value,
            inputState: 'normal'
        }));
    }, []);

    return {
        gameState,
        timer,
        achievementManager,
        powerUps,
        wordDatabase,
        startNewGame,
        submitGuess,
        useHelper,
        closeTriviaModal,
        restartFromBeginning,
        updateUserInput
    };
};
