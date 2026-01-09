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
          <div className="update-date">2026-01-10</div>
          <div className="update-title"></div>
          <ul className="update-details">
            <li>탭 시각화 (아이콘 적용)</li>
            <li>상점 - 등급추가 (가시성 문제 해결)</li>
            <li>계산기 - 완성 아이템 가격 수정 가능하도록 수정</li>
          </ul>
        </div>

        <div className="update-item">
          <div className="update-date">2026-01-09</div>
          <div className="update-title">대장 아이템 추가</div>
          <ul className="update-details">
            <li>대장 아이템 추가</li>
            <li>관계 - 시각화 개선</li>
            <li>상점 - 최소/ 최대 거래금액을 테이블에서 수정 가능합니다</li>
            <li>계산기 - 재료 편집 팝업창 UI 개선</li>
          </ul>
        </div>

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
        <p className="version-info">버전: 0.1.1 (Beta)</p>
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
