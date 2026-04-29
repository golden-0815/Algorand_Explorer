import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { DebugPage } from './pages/DebugPage';
import { WalletPage } from './pages/WalletPage';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VestigeProvider } from './contexts/VestigeContext';

function AppRoutes() {
  const navigate = useNavigate();
  
  const handleHeaderSearch = (address: string) => {
    navigate(`/wallet/${address}`);
  };

  return (
    <div role="application" aria-label="Algorand Explorer">
      <Header onSearch={handleHeaderSearch} />
      <main role="main">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/wallet/:id" element={<WalletPage />} />
          <Route path="/debug" element={<DebugPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <VestigeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </VestigeProvider>
    </ErrorBoundary>
  );
}

export default App;