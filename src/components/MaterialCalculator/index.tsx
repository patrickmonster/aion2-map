import React, { useState } from 'react';
import CalculatorContent from './CalculatorContent';
import './index.css';
import ShopContent from './ShopContent';

// 사이드 메뉴 타입
type SideMenuTab = '계산기' | '상점';

interface MaterialCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  isPageMode?: boolean;
  backButton?: boolean;
  hideHeader?: boolean;
}

const MaterialCalculator: React.FC<MaterialCalculatorProps> = ({ isOpen, onClose, isPageMode = false, backButton = false, hideHeader = false }) => {
  const [activeSideTab, setSideTab] = useState<SideMenuTab>('상점');
  const sideTabs: SideMenuTab[] = ['상점', '계산기'];

  if (!isOpen) return null;

  return (
    <div className="material-calculator-overlay" onClick={hideHeader ? onClose : undefined}>
      <div className="material-calculator-modal" onClick={e => e.stopPropagation()}>
        {!hideHeader && (
          <div className="material-calculator-header">
            {backButton && (
              <button className="back-button" onClick={onClose}>
                ← 이전
              </button>
            )}
            <h2>재료 효율 계산기 .Bata</h2>
            {!isPageMode && (
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}

        <div className="material-calculator-content">
          {/* 사이드 메뉴 */}
          <div className="side-menu">
            <h3>메뉴</h3>
            <div className="side-tabs">
              {sideTabs.map(tab => (
                <button key={tab} className={`side-tab ${activeSideTab === tab ? 'active' : ''}`} onClick={() => setSideTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="main-content">
            {/* 최상단 타이틀 */}

            {/* 사이드 메뉴에 따른 콘텐츠 변경 */}
            {activeSideTab === '계산기' && <CalculatorContent />}
            {activeSideTab === '상점' && <ShopContent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;
