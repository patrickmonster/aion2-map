import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import CalculatorPage from './pages/CalculatorPage';
import MapPage from './pages/MapPage';

function App() {
  return (
    <Router>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
