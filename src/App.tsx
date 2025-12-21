import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';

const MapPage = lazy(() => import('./pages/MapPage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="App">
        <main className="main-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
