import React, { useState } from 'react';
import { MARKER_CATEGORIES } from '../constants';
import { GameMarkerSettings, GroupVisibility, MarkerCategory } from '../types';

interface GameIconToggleProps {
  availableTypes: string[];
  gameMarkerSettings: GameMarkerSettings;
  onToggleMarkerType: (type: string) => void;
}

export const GameIconToggle: React.FC<GameIconToggleProps> = ({ availableTypes, gameMarkerSettings, onToggleMarkerType }) => {
  const [groupVisibility, setGroupVisibility] = useState<GroupVisibility>(
    Object.keys(MARKER_CATEGORIES).reduce((acc, category) => {
      acc[category] = false;
      return acc;
    }, {} as GroupVisibility)
  );

  // 카테고리별로 마커 그룹화
  const groupedMarkers = availableTypes.reduce((groups, type) => {
    const config = gameMarkerSettings[type];
    if (!config) return groups;

    const category = config.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(type);
    return groups;
  }, {} as Record<MarkerCategory, string[]>);

  const toggleGroup = (category: MarkerCategory) => {
    const newVisibility = !groupVisibility[category];
    setGroupVisibility(prev => ({
      ...prev,
      [category]: newVisibility,
    }));
  };

  const toggleAllInGroup = (category: MarkerCategory) => {
    const markersInGroup = groupedMarkers[category] || [];
    const allVisible = markersInGroup.every(type => gameMarkerSettings[type]?.visible);

    markersInGroup.forEach(type => {
      const currentVisible = gameMarkerSettings[type]?.visible;
      if (allVisible && currentVisible) {
        onToggleMarkerType(type); // 모두 보이면 숨기기
      } else if (!allVisible && !currentVisible) {
        onToggleMarkerType(type); // 일부만 보이거나 모두 안보이면 보이기
      }
    });
  };

  return (
    <div className="game-icon-toggle-panel">
      {Object.entries(MARKER_CATEGORIES).map(([category, categoryInfo]) => {
        const markersInGroup = groupedMarkers[category as MarkerCategory] || [];
        if (markersInGroup.length === 0) return null;

        const allVisible = markersInGroup.every(type => gameMarkerSettings[type]?.visible);
        const someVisible = markersInGroup.some(type => gameMarkerSettings[type]?.visible);
        const isGroupExpanded = groupVisibility[category];

        return (
          <div key={category} className="marker-group">
            <div className="group-header">
              <button className="group-toggle" onClick={() => toggleGroup(category as MarkerCategory)} title={`${categoryInfo.displayName} ${isGroupExpanded ? '접기' : '펼치기'}`}>
                <span className="group-arrow">{isGroupExpanded ? '▼' : '▶'}</span>
                <span className="group-title">{categoryInfo.displayName}</span>
              </button>
              <button
                className={`group-all-toggle ${allVisible ? 'all-active' : someVisible ? 'some-active' : 'all-inactive'}`}
                onClick={() => toggleAllInGroup(category as MarkerCategory)}
                title={`${categoryInfo.displayName} ${allVisible ? '모두 숨기기' : '모두 표시'}`}
              >
                {allVisible ? '👁️' : someVisible ? '👁️‍🗨️' : '👁️‍🗨️'}
              </button>
            </div>

            {isGroupExpanded && (
              <div className="group-markers">
                {markersInGroup.map(type => {
                  const config = gameMarkerSettings[type];
                  if (!config) return null;

                  return (
                    <button
                      key={type}
                      className={`game-icon-toggle ${config.visible ? 'active' : 'inactive'}`}
                      onClick={() => onToggleMarkerType(type)}
                      title={`${config.displayName} ${config.visible ? '숨기기' : '표시'}`}
                    >
                      <span
                        className="game-icon-emoji"
                        style={{
                          color: config.visible ? config.color : '#999',
                          opacity: config.visible ? 1 : 0.5,
                        }}
                      >
                        {config.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
