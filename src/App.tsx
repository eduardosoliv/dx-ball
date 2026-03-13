import { useState } from 'react'
import GameOverScreen from './screens/GameOverScreen'
import GameScreen from './screens/GameScreen'
import TitleScreen from './screens/TitleScreen'

type Screen = 'title' | 'game' | 'gameover'

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [finalScore, setFinalScore] = useState(0)
  const [gameKey, setGameKey] = useState(0)

  const handlePlay = () => setScreen('game')
  const handleGameOver = (score: number) => {
    setFinalScore(score)
    setScreen('gameover')
  }
  const handlePlayAgain = () => {
    setGameKey((k) => k + 1)
    setScreen('game')
  }
  const handleMenu = () => setScreen('title')

  return (
    <>
      {screen === 'title' && <TitleScreen onPlay={handlePlay} />}
      {screen === 'game' && (
        <GameScreen key={gameKey} onGameOver={handleGameOver} />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}
    </>
  )
}
