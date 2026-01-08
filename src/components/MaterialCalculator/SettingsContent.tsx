import React from 'react';
import './SettingsContent.css';

const SettingsContent: React.FC = () => {
  return (
    <div className="settings-content">
      <div className="settings-header">
        <h3>업데이트 이력</h3>
      </div>

      <div className="update-history">
        <div className="update-item">
          <div className="update-date">2026-01-09</div>
          <div className="update-title">데이터 동기화 로직 개선</div>
          <ul className="update-details">
            <li>기존 로컬 데이터 유지 기능 추가</li>
            <li>서버 동기화 시 신규 항목만 추가되도록 변경</li>
            <li>로컬 데이터 삭제 없이 안전하게 동기화 가능</li>
            <li>최적화 계산기 추가 - 현재 재료를 통해서 제작 가능한 아이템 혹은 부족한 재료가 2개 이하인 아이템 표시</li>
          </ul>
        </div>
      </div>

      <div className="settings-footer">
        <p className="version-info">버전: 0.1.0 (Beta)</p>
        <p className="contact-info">
          문의 및 피드백:{' '}
          <a href="https://discord.gg/wDFHrq5PPV" target="_blank" rel="noopener noreferrer">
            디스코드 서버
          </a>
        </p>
      </div>
    </div>
  );
};

export default SettingsContent;
