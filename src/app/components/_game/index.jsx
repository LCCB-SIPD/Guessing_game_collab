import { useEffect, useState } from 'react';
import { useWordScrambleGame } from '../../modules/_game_logic/gameHooks';
import { useWalletModal, useWalletStatus, useDisconnectWallets, ConnectWalletBT, CordyStackTransStellar } from '@cordystackx/cordy_minikit';
import { Fetch_to } from '@/app/utilities';
import json_route from "@/app/config/json_route/route.json";

export default function InGame() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const {
        gameState,
        timer,
        achievementManager,
        powerUps,
        startNewGame,
        submitGuess,
        useHelper,
        closeTriviaModal,
        restartFromBeginning,
        updateUserInput
    } = useWordScrambleGame();

    const {
      context,
      evm,
      stellar,
      refreshBalances
    } = useWalletStatus();

    

    const {
      disconnectAll,
      disconnectStellar,
      disconnectEVM
    } = useDisconnectWallets();

    const { closeModal } = useWalletModal();

    async function ClaimRewards() {
      const scoreDivided = Number(gameState.score / 2).toFixed(4);
      
      if (context === "EVM") return alert("Invalid Wallet");
      if (context === "MULTI" || context === "NONE") return handleDisconnect();
      
      setLoading(true);
      const response = await Fetch_to(json_route.Claim, {
        destination: stellar.address,
        amount: scoreDivided,
      });

      if (response.success) {
        alert("Congrats You Win " + scoreDivided);
        refreshBalances();
        restartFromBeginning();
        setLoading(false);
      } else {
        alert("something went wrong");
        setLoading(false);
      }
    }

    // Handle keyboard events
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && gameState.status === 'playing') {
                submitGuess();
            }
        };

        document.addEventListener('keypress', handleKeyPress);
        return () => document.removeEventListener('keypress', handleKeyPress);
    }, [submitGuess, gameState.status]);

    useEffect(() => {
    if (
      (context === "NONE" || context === "MULTI")
    ) {
      return;
    }
    

    const signIn = async () => {
      closeModal();
      await refreshBalances();

      const address =
        context === "EVM"
          ? evm.address
          : stellar.address;

      if (address) {
        if (context === "EVM") await disconnectStellar();
        if (context === "Non-EVM") await disconnectEVM();
        setConnected(true);
      } else {
        alert(response.message);
        handleDisconnect();
        return;
      }
    };

    signIn();
  }, [context]);

    // Calculate progress percentage
    const progressPercentage = gameState.round > 0 ? (gameState.round / 20) * 100 : 0;
    
    // Calculate accuracy
    const accuracy = gameState.totalAttempts > 0 
        ? Math.round((gameState.correctWords / gameState.totalAttempts) * 100) 
        : 0;

    // Get final message based on score
    const getFinalMessage = () => {
        if (gameState.score >= 2000) return 'Outstanding performance!';
        if (gameState.score >= 1500) return 'Excellent work!';
        if (gameState.score >= 1000) return 'Well done!';
        if (gameState.score >= 500) return 'Good effort!';
        return 'Nice try!';
    };

    async function handleDisconnect() {                                                                                
      const success = await disconnectAll();                                                                           
                                                                                                                        
      if (success) {                                                                                                   
        console.log("Wallets disconnected");
        window.location.reload();                                                               
      } else {                                                                                                         
        console.log("Failed to disconnect wallets");                                                             
      }                                                                                                                
    }

    return (
        <>
            <div className="game-container">
              {connected ? (
                <div style={{ 
                  width: "330px",
                  position: "fixed", 
                  top: "1rem", 
                  right: "1.25rem", 
                  background: "#505050", 
                  padding: "1rem",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <h4>Balance: {context === "EVM" ? "Invalid Wallets" : Number(stellar.balance).toFixed(4) } </h4>
                  <button className='glass-btn' style={{ 
                    background: "#f00",
                    fontWeight: "bold"
                  }} onClick={handleDisconnect}>DisConnect</button>
                </div>
              ) : null}
                <div className={`game-wrapper ${gameState.inputState === 'correct' ? 'success-animation' : ''}`}> 
                    {/* Home Screen */}
                    <div className={`start-screen ${gameState.currentView === 'home' ? 'active' : ''}`}>
                        <h1>Guess The Word</h1>
                        <p>Mahampang nata and let us have a fun taya gha! </p>
                        {connected ? (<button className="glass-btn" disabled={loading} onClick={async() => {
                          if (context === "EVM") return alert("Invalid Wallet Please use Stellar");
                          setLoading(true);
                          const response = await CordyStackTransStellar(process.env.NEXT_PUBLIC_BANKER, 2000, { memo: "Play It Now" });
                          if (response) {
                            refreshBalances();
                            startNewGame();
                            setLoading(false);
                          } else {
                            alert("Something Went Wrong");
                            setLoading(false);
                          }
                        }}>{loading ? "Laoding..." : "Start Game"}</button>) : (<ConnectWalletBT className='glass-btn' />)}
                    </div>

                    {/* Game Play Screen */}
                    <div className={`game-content ${gameState.currentView === 'play' ? 'active' : ''}`}>
                        <div className="status-row">
                            <div className="score-info">Score: <span>{gameState.score}</span></div>
                            <div className="category-chip">{gameState.currentWord?.category || 'Loading...'}</div>
                            <div className={`time-display ${timer.timeRemaining <= 5 ? 'warning-state' : ''}`}>
                                {timer.timeRemaining}
                            </div>
                        </div>

                        <div className="level-progress">
                            <div className="progress-indicator" style={{ width: `${progressPercentage}%` }}></div>
                        </div>

                        <div className="word-section">
                            <div 
                                className="jumbled-text" 
                                dangerouslySetInnerHTML={{ 
                                    __html: gameState.currentWord?.getDisplayWord() || 'PREPARING...' 
                                }}
                            />
                            <img className="word-image" alt="Word hint image" />
                            <div className="clue-container">
                                <span>{gameState.currentWord?.clue || 'Getting ready to start...'}</span>
                            </div>
                            {gameState.firstLetterHint && (
                                <div className="first-letter-hint" style={{ display: 'block' }}>
                                    {gameState.firstLetterHint}
                                </div>
                            )}
                            <input 
                                type="text" 
                                className={`input-field ${gameState.inputState} ${gameState.inputState === 'incorrect' ? 'incorrect-shake' : ''}`}
                                value={gameState.userInput}
                                onChange={(e) => updateUserInput(e.target.value)}
                                placeholder="Enter your guess" 
                                autoComplete="off" 
                                spellCheck="false"
                                disabled={gameState.status !== 'playing'}
                            />
                        </div>

                        <div className="tools-section">
                            {/* <ConnectWalletBT /> */}
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('firstLetter')}
                                disabled={!powerUps.firstLetter?.canUse()}
                            >
                                First Letter <span className="tool-badge">{powerUps.firstLetter?.remainingUses || 0}</span>
                            </button>
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('skip')}
                                disabled={!powerUps.skip?.canUse()}
                            >
                                Skip Word <span className="tool-badge">{powerUps.skip?.remainingUses || 0}</span>
                            </button>
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('time')}
                                disabled={!powerUps.time?.canUse()}
                            >
                                +10 Seconds <span className="tool-badge">{powerUps.time?.remainingUses || 0}</span>
                            </button>
                        </div>

                        <button 
                            className="glass-btn submit-btn" 
                            onClick={submitGuess}
                            disabled={gameState.status !== 'playing'}
                        >
                            Submit Answer
                        </button>
                    </div>

                    {/* End Game Screen */}
                    <div className={`finish-screen ${gameState.currentView === 'end' ? 'active' : ''}`}>
                        <h2>Game Complete!</h2>
                        
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value">{gameState.score}</span>
                                <span className="stat-label">Final Score</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{gameState.correctWords}</span>
                                <span className="stat-label">Words Solved</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{gameState.bestStreak}</span>
                                <span className="stat-label">Best Streak</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{accuracy}%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                        </div>

                        <div className="finish-message">{getFinalMessage()}</div>
                        
                        {achievementManager.achievements.filter(a => a.unlocked).length > 0 && (
                            <div className="achievements-section">
                                <h3>🏅 Achievements Unlocked</h3>
                                {achievementManager.achievements
                                    .filter(achievement => achievement.unlocked)
                                    .map(achievement => (
                                        <div key={achievement.id} className="achievement-item">
                                            <strong>{achievement.name}</strong> - {achievement.description}
                                        </div>
                                    ))}
                            </div>
                        )}
                        
                        <button className="glass-btn" onClick={ClaimRewards}> {loading ? "Claiming..." : "Claim & Play Again"} </button>
                    </div>
                </div> 
            </div>

            {/* Trivia Modal */}
            <div className={`trivia-modal ${gameState.showTrivia ? 'show' : ''}`}>
                <div className="trivia-content">
                    <h3>Did you know?</h3>
                    <p>{gameState.currentWord?.trivia || 'Interesting fact will appear here...'}</p>
                    <button className="continue-btn" onClick={closeTriviaModal}>Continue Game</button>
                </div>
            </div>

            {/* Achievement Popup */}
            {achievementManager.newAchievements.length > 0 && (
                <div className="achievement-popup show">
                    <div>
                        {achievementManager.newAchievements.map(achievement => (
                            <div key={achievement.id}>
                                <strong>{achievement.name}</strong><br/>
                                {achievement.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Popup */}
            <div className={`score-popup ${gameState.scorePopup.show ? 'show' : ''}`}>
                +<span>{gameState.scorePopup.amount}</span> points!
            </div>
        </>
    );
}