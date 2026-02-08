/**
 * Main App Component
 * Single Responsibility: Uygulama durumuna göre doğru ekranı render etme
 * Oda sistemi ile çalışır
 */

import { AppStateProvider, useAppState, APP_STATES } from './contexts/AppStateContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSocket } from './hooks/useSocket';
import LobbyScreen from './pages/LobbyScreen';
import JoinScreen from './pages/JoinScreen';
import VotingScreen from './pages/VotingScreen';
import ResultsScreen from './pages/ResultsScreen';
import ThemeSwitcher from './components/ThemeSwitcher';

import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
  const { state } = useAppState();

  // Socket bağlantısını başlat
  useSocket();

  const getScreen = () => {
    switch (state.currentState) {
      case APP_STATES.LOBBY:
        return <LobbyScreen key="lobby" />;
      case APP_STATES.JOIN:
        return <JoinScreen key="join" />;
      case APP_STATES.VOTING:
        return <VotingScreen key="voting" />;
      case APP_STATES.RESULTS:
        return <ResultsScreen key="results" />;
      default:
        return <LobbyScreen key="lobby" />;
    }
  };

  return (
    <>
      {/* Tema değiştirme butonu - sağ üst köşe */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentState}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {getScreen()}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 animate-gradient-xy flex flex-col">
          <AppContent />
        </div>
      </AppStateProvider>
    </ThemeProvider>
  );
}

export default App;

