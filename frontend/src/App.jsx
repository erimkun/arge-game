/**
 * Main App Component
 * Single Responsibility: Uygulama durumuna göre doğru ekranı render etme
 */

import { AppStateProvider, useAppState, APP_STATES } from './contexts/AppStateContext';
import { useSocket } from './hooks/useSocket';
import JoinScreen from './pages/JoinScreen';
import VotingScreen from './pages/VotingScreen';
import ResultsScreen from './pages/ResultsScreen';

function AppContent() {
  const { state } = useAppState();
  
  // Socket bağlantısını başlat
  useSocket();

  // Duruma göre ekranı render et
  switch (state.currentState) {
    case APP_STATES.JOIN:
      return <JoinScreen />;
    case APP_STATES.VOTING:
      return <VotingScreen />;
    case APP_STATES.RESULTS:
      return <ResultsScreen />;
    default:
      return <JoinScreen />;
  }
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;

