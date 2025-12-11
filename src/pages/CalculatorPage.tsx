import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialCalculator from '../components/MaterialCalculator';
import './CalculatorPage.css';

const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    window.close();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleGoBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="calculator-page">
      <div className="calculator-content">
        <MaterialCalculator isOpen={true} onClose={handleGoBack} isPageMode={true} hideHeader={true} />
      </div>
    </div>
  );
};

export default CalculatorPage;
