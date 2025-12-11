import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import './MapPage.css';

// 타입, 상수, 훅들 import
import { setupLeafletIcons } from '../constants';
import { useGameData, useMarkers, useMarkerTypes, useSettings, useUrlParams } from '../hooks';
import { MarkerMemo, MarkerType } from '../types';

// 컴포넌트들 import
import {
  ChatModal,
  FloatingCalculatorButton,
  FloatingChatButton,
  GameIconToggle,
  GameMarkers,
  JsonEditorModal,
  MapContainerComponent,
  MarkersSidebar,
  MarkerTypeForm,
  MemoDialog,
  Navigation,
  SettingsModal,
} from '../components';

// Leaflet 아이콘 설정
setupLeafletIcons();

// UI 상태 타입 정의
interface UIState {
  showMemoDialog: boolean;
  currentPosition: [number, number] | null;
  memoText: string;
  editingMarker: string | null;
  showSettingsModal: boolean;
  selectedMarkerType: string;
  editingMarkerType: MarkerType | null;
  showMarkerTypeForm: boolean;
  markerFilter: string;
  showJsonEditor: boolean;
  isAdminMode: boolean;
  showChatModal: boolean;
}

// UI 액션 타입
type UIAction =
  | { type: 'OPEN_MEMO_DIALOG'; position: [number, number] }
  | { type: 'CLOSE_MEMO_DIALOG' }
  | { type: 'SET_MEMO_TEXT'; text: string }
  | { type: 'SET_EDITING_MARKER'; markerId: string | null }
  | { type: 'OPEN_SETTINGS_MODAL' }
  | { type: 'CLOSE_SETTINGS_MODAL' }
  | { type: 'SET_SELECTED_MARKER_TYPE'; markerType: string }
  | { type: 'SET_EDITING_MARKER_TYPE'; markerType: MarkerType | null }
  | { type: 'OPEN_MARKER_TYPE_FORM' }
  | { type: 'CLOSE_MARKER_TYPE_FORM' }
  | { type: 'SET_MARKER_FILTER'; filter: string }
  | { type: 'OPEN_JSON_EDITOR' }
  | { type: 'CLOSE_JSON_EDITOR' }
  | { type: 'SET_ADMIN_MODE'; isAdmin: boolean }
  | { type: 'EDIT_MARKER_DIALOG'; marker: MarkerMemo }
  | { type: 'OPEN_CHAT_MODAL' }
  | { type: 'CLOSE_CHAT_MODAL' };

// UI 상태 초기값
const initialUIState: UIState = {
  showMemoDialog: false,
  currentPosition: null,
  memoText: '',
  editingMarker: null,
  showSettingsModal: false,
  selectedMarkerType: 'default',
  editingMarkerType: null,
  showMarkerTypeForm: false,
  markerFilter: 'all',
  showJsonEditor: false,
  isAdminMode: false,
  showChatModal: false,
};

// UI reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'OPEN_MEMO_DIALOG':
      return {
        ...state,
        showMemoDialog: true,
        currentPosition: action.position,
        memoText: '',
        editingMarker: null,
      };
    case 'CLOSE_MEMO_DIALOG':
      return {
        ...state,
        showMemoDialog: false,
        currentPosition: null,
        memoText: '',
        editingMarker: null,
      };
    case 'SET_MEMO_TEXT':
      return { ...state, memoText: action.text };
    case 'SET_EDITING_MARKER':
      return { ...state, editingMarker: action.markerId };
    case 'OPEN_SETTINGS_MODAL':
      return { ...state, showSettingsModal: true };
    case 'CLOSE_SETTINGS_MODAL':
      return { ...state, showSettingsModal: false };
    case 'SET_SELECTED_MARKER_TYPE':
      return { ...state, selectedMarkerType: action.markerType };
    case 'SET_EDITING_MARKER_TYPE':
      return { ...state, editingMarkerType: action.markerType };
    case 'OPEN_MARKER_TYPE_FORM':
      return { ...state, showMarkerTypeForm: true };
    case 'CLOSE_MARKER_TYPE_FORM':
      return {
        ...state,
        showMarkerTypeForm: false,
        editingMarkerType: null,
      };
    case 'SET_MARKER_FILTER':
      return { ...state, markerFilter: action.filter };
    case 'OPEN_JSON_EDITOR':
      return { ...state, showJsonEditor: true };
    case 'CLOSE_JSON_EDITOR':
      return { ...state, showJsonEditor: false };
    case 'SET_ADMIN_MODE':
      return { ...state, isAdminMode: action.isAdmin };
    case 'EDIT_MARKER_DIALOG':
      return {
        ...state,
        showMemoDialog: true,
        currentPosition: action.marker.position,
        memoText: action.marker.memo,
        selectedMarkerType: action.marker.type || 'default',
        editingMarker: action.marker.id,
      };
    case 'OPEN_CHAT_MODAL':
      return { ...state, showChatModal: true };
    case 'CLOSE_CHAT_MODAL':
      return { ...state, showChatModal: false };
    default:
      return state;
  }
};

const MapPage: React.FC = () => {
  const mapRef = React.useRef<L.Map>(null);
  const [selectedMap, setSelectedMap] = useState<string>('');

  // UI 상태 관리를 useReducer로 통합
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

  // 훅들 사용
  const { getUrlParam, setUrlParam } = useUrlParams();
  const { markers, saveMarker, deleteMarker, deleteAllMarkers, importMarkers } = useMarkers();
  const { markerTypes, saveMarkerType, deleteMarkerType } = useMarkerTypes();
  const { settings, toggleGameMarkerType } = useSettings();

  // 게임 데이터 로드
  const { gameData, getAvailableTypes } = useGameData(selectedMap);

  // 맵 변경 함수
  const handleMapChange = useCallback(
    (mapName: string) => {
      setSelectedMap(mapName);
      setUrlParam('map', mapName);
    },
    [setUrlParam]
  );

  // 마커 추가/수정 함수
  const handleMapClick = useCallback((position: [number, number]) => {
    uiDispatch({ type: 'OPEN_MEMO_DIALOG', position });
  }, []);

  // 메모 저장 함수
  const handleSaveMemo = useCallback(() => {
    if (!uiState.currentPosition) return;

    const newMarker: MarkerMemo = {
      id: uiState.editingMarker || Date.now().toString(),
      position: uiState.currentPosition,
      memo: uiState.memoText.trim(), // 빈 문자열도 허용
      mapName: selectedMap,
      type: uiState.selectedMarkerType,
      createdAt: new Date(),
    };

    saveMarker(newMarker);
    uiDispatch({ type: 'CLOSE_MEMO_DIALOG' });
  }, [uiState.currentPosition, uiState.memoText, selectedMap, uiState.editingMarker, uiState.selectedMarkerType, saveMarker]);

  // 마커 편집 함수
  const handleEditMarker = useCallback((marker: MarkerMemo) => {
    uiDispatch({ type: 'EDIT_MARKER_DIALOG', marker });
  }, []);

  // 마커 삭제 함수
  const handleDeleteMarker = useCallback(
    (markerId: string) => {
      deleteMarker(markerId);
    },
    [deleteMarker]
  );

  // 마커 위치로 이동 함수
  const handleMoveToMarker = useCallback(
    (position: [number, number]) => {
      if (mapRef.current) {
        mapRef.current.setView(position, 1, {
          animate: true,
          duration: settings.animationSpeed,
        });
      }
    },
    [settings.animationSpeed]
  );

  // 모든 마커 삭제 함수
  const handleDeleteAllMarkers = useCallback(() => {
    if (window.confirm('모든 마커를 삭제하시겠습니까?')) {
      deleteAllMarkers();
    }
  }, [deleteAllMarkers]);

  // 마커 데이터 내보내기
  const handleExportMarkers = useCallback(() => {
    const dataStr = JSON.stringify(markers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aion2-map-markers.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [markers]);

  // 마커 데이터 가져오기
  const handleImportMarkers = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const importedMarkerData = JSON.parse(e.target?.result as string);
          importMarkers(importedMarkerData);
          alert('마커 데이터를 성공적으로 가져왔습니다.');
        } catch (error) {
          alert('마커 데이터 가져오기에 실패했습니다.');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [importMarkers]
  );

  // 마커 타입 추가/수정 함수
  const handleSaveMarkerType = useCallback(
    (markerType: MarkerType) => {
      saveMarkerType(markerType, uiState.editingMarkerType?.id);
      uiDispatch({ type: 'CLOSE_MARKER_TYPE_FORM' });
    },
    [uiState.editingMarkerType, saveMarkerType]
  );

  // 마커 타입 삭제 함수
  const handleDeleteMarkerType = useCallback(
    (typeId: string) => {
      if (typeId === 'default') {
        alert('기본 마커 타입은 삭제할 수 없습니다.');
        return;
      }

      if (window.confirm('이 마커 타입을 삭제하시겠습니까?')) {
        const success = deleteMarkerType(typeId);
        if (success) {
          // 삭제된 타입을 사용하는 마커들을 기본 타입으로 변경
          const updatedMarkers = markers.map(marker => (marker.type === typeId ? { ...marker, type: 'default' } : marker));
          // 마커들을 개별적으로 업데이트
          updatedMarkers.forEach(marker => {
            if (marker.type === 'default' && markers.find(m => m.id === marker.id)?.type === typeId) {
              saveMarker(marker);
            }
          });
        }
      }
    },
    [deleteMarkerType, markers, saveMarker]
  );

  // 마커 타입 편집 시작
  const handleEditMarkerType = useCallback((markerType: MarkerType) => {
    uiDispatch({ type: 'SET_EDITING_MARKER_TYPE', markerType });
    uiDispatch({ type: 'OPEN_MARKER_TYPE_FORM' });
  }, []);

  // 게임 마커 신고 함수
  const handleReportGameMarker = useCallback(
    (marker: any) => {
      const reportData = {
        markerId: marker.id,
        markerName: marker.name || 'Unknown',
        markerType: marker.type,
        coordinates: `(${marker.x.toFixed(0)}, ${marker.y.toFixed(0)})`,
        mapName: selectedMap,
        category: marker.category,
        region: marker.region || 'N/A',
        timestamp: new Date().toISOString(),
      };

      // GitHub Issues로 신고하기 URL 생성
      const issueTitle = `[마커 신고] ${marker.name || marker.id} - ${selectedMap}`;
      const issueBody = `## 마커 신고

**마커 ID:** ${marker.id}
**마커 이름:** ${marker.name || 'Unknown'}
**마커 타입:** ${marker.type}
**좌표:** ${reportData.coordinates}
**지도:** ${selectedMap}
**카테고리:** ${marker.category}
**지역:** ${marker.region || 'N/A'}
**신고 시간:** ${new Date().toLocaleString()}

## 신고 내용
해당 마커에 대해 신고하는 이유를 상세히 설명해 주세요:

- [ ] 잘못된 좌표
- [ ] 잘못된 이름
- [ ] 잘못된 카테고리
- [ ] 기타 (아래에 상세 내용 작성)`;

      const githubUrl = `https://github.com/patrickmonster/aion2-map/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;

      // 새 창에서 GitHub Issues 페이지 열기
      window.open(githubUrl, '_blank');
    },
    [selectedMap]
  );

  // 사용자 마커 정보 공개 요청 함수
  const handleRequestMarkerInfo = useCallback(
    (marker: any) => {
      const markerTypeName = markerTypes.find(type => type.id === marker.type)?.name || '기본';

      const issueTitle = `[정보 공개 요청] ${marker.memo.substring(0, 30)}${marker.memo.length > 30 ? '...' : ''} - ${selectedMap}`;
      const issueBody = `## 사용자 마커 정보 공개 요청

**마커 내용:** ${marker.memo}
**마커 타입:** ${markerTypeName}
**좌표:** (${marker.position[1].toFixed(0)}, ${marker.position[0].toFixed(0)})
**지도:** ${selectedMap}
**생성 시간:** ${marker.createdAt.toLocaleString()}
**요청 시간:** ${new Date().toLocaleString()}

## 요청 내용
이 사용자 마커에 대한 정보를 게임 마커로 추가해 주세요.

**요청 이유:**
- [ ] 중요한 던전/지역 정보
- [ ] NPC/상점 위치
- [ ] 퀀스트 관련 위치
- [ ] 아이템 수집 위치
- [ ] 기타 (아래에 상세 내용 작성)

**추가 설명:**
<!-- 여기에 자세한 내용을 작성해 주세요 -->`;

      const githubUrl = `https://github.com/patrickmonster/aion2-map/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;

      // 새 창에서 GitHub Issues 페이지 열기
      window.open(githubUrl, '_blank');
    },
    [selectedMap, markerTypes]
  );

  // 관리자 모드 확인
  const checkAdminMode = useCallback(() => {
    // 로컬 개발 환경이거나 localhost에서 실행 시 관리자 모드 활성용
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';

    return isDevelopment && isLocalhost;
  }, []);

  // 컴포넌트 마운트 시 관리자 모드 확인
  useEffect(() => {
    uiDispatch({ type: 'SET_ADMIN_MODE', isAdmin: checkAdminMode() });
  }, [checkAdminMode]);

  // 현재 맵의 마커만 필터링
  const currentMapMarkers = markers.filter(marker => marker.mapName === selectedMap);

  // 마커 타입으로 필터링된 마커
  const filteredMarkers = currentMapMarkers.filter(marker => {
    if (uiState.markerFilter === 'all') return true;
    return marker.type === uiState.markerFilter;
  });

  useEffect(() => {
    const mapParam = getUrlParam('map') || 'World_D_A';
    setSelectedMap(mapParam);
    if (!getUrlParam('map')) {
      setUrlParam('map', mapParam);
    }
  }, [getUrlParam, setUrlParam]);

  // 표시할 게임 마커들 필터링
  const visibleGameMarkerTypes = React.useMemo(() => {
    const types = new Set<string>();
    if (gameData && settings.gameMarkers) {
      getAvailableTypes().forEach(type => {
        if (settings.gameMarkers[type]?.visible) {
          types.add(type);
        }
      });
    }
    return types;
  }, [gameData, getAvailableTypes, settings.gameMarkers]);

  return (
    <div className="map-container">
      <Navigation
        selectedMap={selectedMap}
        onMapChange={handleMapChange}
        onSettingsClick={() => uiDispatch({ type: 'OPEN_SETTINGS_MODAL' })}
        isAdminMode={uiState.isAdminMode}
        onJsonEditorClick={() => uiDispatch({ type: 'OPEN_JSON_EDITOR' })}
      />
      {/* 게임 아이콘 토글 패널 */}
      {gameData && settings.gameMarkers && getAvailableTypes().length > 0 && (
        <GameIconToggle availableTypes={getAvailableTypes()} gameMarkerSettings={settings.gameMarkers} onToggleMarkerType={toggleGameMarkerType} />
      )}
      <MapContainerComponent selectedMap={selectedMap} onMapClick={handleMapClick} mapRef={mapRef}>
        {/* 게임 마커들 렌더링 */}
        {gameData && settings.gameMarkers && (
          <GameMarkers gameMarkers={gameData.markers} gameMarkerSettings={settings.gameMarkers} visibleTypes={visibleGameMarkerTypes} onReportMarker={handleReportGameMarker} />
        )}

        {/* 필터링된 마커들 렌더링 */}
        {filteredMarkers.map(marker => {
          // 마커 타입에 따른 커스텀 아이콘 생성
          const markerType = markerTypes.find(type => type.id === marker.type) || markerTypes.find(type => type.id === 'default');
          let customIcon;

          if (markerType && markerType.id !== 'default') {
            // 커스텀 마커 타입인 경우 이모지 아이콘 사용
            customIcon = L.divIcon({
              html: `<div style="font-size: 24px; text-align: center; line-height: 1;">${markerType.icon}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15],
              className: 'custom-marker-icon',
            });
          }
          // 기본 타입이거나 타입이 없는 경우 기본 Leaflet 아이콘 사용

          return (
            <Marker key={marker.id} position={marker.position} {...(customIcon && { icon: customIcon })}>
              <Popup>
                <div className="marker-popup">
                  <div className="memo-content">{marker.memo}</div>
                  <div className="memo-actions">
                    <button className="edit-btn" onClick={() => handleEditMarker(marker)}>
                      편집
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteMarker(marker.id)}>
                      삭제
                    </button>
                    <button className="info-request-btn" onClick={() => handleRequestMarkerInfo(marker)} title="이 위치를 공식 마커로 추가 요청">
                      📝 정보공개
                    </button>
                  </div>
                  <div className="memo-info">
                    <small>
                      {marker.createdAt.toLocaleDateString()} {marker.createdAt.toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainerComponent>
      {/* 메모 작성 다이얼로그 */}
      <MemoDialog
        isOpen={uiState.showMemoDialog}
        isEditing={!!uiState.editingMarker}
        currentPosition={uiState.currentPosition}
        memoText={uiState.memoText}
        selectedMarkerType={uiState.selectedMarkerType}
        markerTypes={markerTypes}
        onClose={() => uiDispatch({ type: 'CLOSE_MEMO_DIALOG' })}
        onMemoTextChange={text => uiDispatch({ type: 'SET_MEMO_TEXT', text })}
        onMarkerTypeChange={markerType => uiDispatch({ type: 'SET_SELECTED_MARKER_TYPE', markerType })}
        onSave={handleSaveMemo}
      />
      {/* 설정 모달 */}
      <SettingsModal
        isOpen={uiState.showSettingsModal}
        settings={settings}
        markerTypes={markerTypes}
        markers={markers}
        availableTypes={gameData ? getAvailableTypes() : []}
        onClose={() => uiDispatch({ type: 'CLOSE_SETTINGS_MODAL' })}
        onExportMarkers={handleExportMarkers}
        onImportMarkers={handleImportMarkers}
        onDeleteAllMarkers={handleDeleteAllMarkers}
        onEditMarkerType={handleEditMarkerType}
        onDeleteMarkerType={handleDeleteMarkerType}
        onAddMarkerType={() => {
          uiDispatch({ type: 'SET_EDITING_MARKER_TYPE', markerType: null });
          uiDispatch({ type: 'OPEN_MARKER_TYPE_FORM' });
        }}
        onToggleGameMarkerType={toggleGameMarkerType}
      />
      {/* 마커 목록 사이드바 */}
      <MarkersSidebar
        markers={currentMapMarkers}
        markerTypes={markerTypes}
        selectedFilter={uiState.markerFilter}
        onFilterChange={filter => uiDispatch({ type: 'SET_MARKER_FILTER', filter })}
        onMoveToMarker={handleMoveToMarker}
        onEditMarker={handleEditMarker}
        onDeleteMarker={handleDeleteMarker}
        onRequestMarkerInfo={handleRequestMarkerInfo}
      />
      {/* 마커 타입 추가/편집 폼 */}
      {uiState.showMarkerTypeForm && <MarkerTypeForm markerType={uiState.editingMarkerType} onSave={handleSaveMarkerType} onCancel={() => uiDispatch({ type: 'CLOSE_MARKER_TYPE_FORM' })} />}
      {/* JSON 에디터 모달 */}
      {uiState.isAdminMode && <JsonEditorModal isOpen={uiState.showJsonEditor} onClose={() => uiDispatch({ type: 'CLOSE_JSON_EDITOR' })} selectedMap={selectedMap} gameData={gameData} />}
      {/* 채팅 모달 */}
      <ChatModal isOpen={uiState.showChatModal} onClose={() => uiDispatch({ type: 'CLOSE_CHAT_MODAL' })} />
      {/* 재료 계산기 플로팅 버튼 */}
      <FloatingCalculatorButton onClick={() => window.open('/aion2-map/calculator', 'calculator', 'width=1200,height=800,scrollbars=yes,resizable=yes')} />
      {/* 채팅 플로팅 버튼 */}
      <FloatingChatButton onClick={() => uiDispatch({ type: 'OPEN_CHAT_MODAL' })} />
    </div>
  );
};

export default MapPage;
