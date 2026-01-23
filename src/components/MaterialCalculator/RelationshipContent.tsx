import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CalculatorItemData } from '../../hooks';
import { useCalculatorData, useShopData } from '../../hooks';
import { GRADE_COLORS, ItemGrade } from '../../hooks/useShopData';
import './RelationshipContent.css';

// 메인 콘텐츠 탭 타입
type MainContentTab = '연금' | '갑옷' | '대장' | '세공' | '요리';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'product' | 'material';
  group: string;
  minPrice?: number;
  maxPrice?: number;
  grade?: ItemGrade;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  quantity: number;
}

interface RelationshipContentProps {
  className?: string;
}

const MAIN_TABS: MainContentTab[] = ['연금', '갑옷', '대장', '세공', '요리'];

const RelationshipContent: React.FC<RelationshipContentProps> = ({ className }) => {
  const [activeMainTab, setActiveMainTab] = useState<MainContentTab>('연금');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [linkDistance, setLinkDistance] = useState(100);

  const { getItemById, initializeData } = useShopData();
  const { loadCalculatorData } = useCalculatorData();

  // 탭을 카테고리로 변환
  const getTabCategory = useCallback((tab: MainContentTab): string => {
    switch (tab) {
      case '연금':
        return 'alchemy';
      case '갑옷':
        return 'armor';
      case '대장':
        return 'blacksmith';
      case '세공':
        return 'handicrafting';
      case '요리':
        return 'food';
      default:
        return 'alchemy';
    }
  }, []);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 그래프 데이터 생성
  const graphData = useMemo(() => {
    const category = getTabCategory(activeMainTab);
    const calculatorData = loadCalculatorData(category);

    const nodesMap = new Map<string, Node>();
    const links: Link[] = [];

    // 상품 노드 추가
    calculatorData.forEach((item: CalculatorItemData) => {
      const shopItem = getItemById(item.id);
      if (!nodesMap.has(item.id)) {
        nodesMap.set(item.id, {
          id: item.id,
          name: item.name,
          type: 'product',
          group: item.type || '기타',
          minPrice: shopItem?.minPrice || 0,
          maxPrice: shopItem?.maxPrice || 0,
          grade: shopItem?.grade || ItemGrade.NORMAL,
        });
      }

      // 재료 노드 및 링크 추가
      if (item.materials && item.materials.length > 0) {
        item.materials.forEach(material => {
          const materialShopItem = getItemById(material.itemId);
          const materialName = materialShopItem?.name || material.itemId;

          if (!nodesMap.has(material.itemId)) {
            nodesMap.set(material.itemId, {
              id: material.itemId,
              name: materialName,
              type: 'material',
              group: materialShopItem?.type || '재료',
              minPrice: materialShopItem?.minPrice || 0,
              maxPrice: materialShopItem?.maxPrice || 0,
            });
          }

          links.push({
            source: material.itemId,
            target: item.id,
            quantity: material.quantity,
          });
        });
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [activeMainTab, getTabCategory, loadCalculatorData, getItemById]);

  // 상품 타입 목록 추출
  const productTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.nodes.filter(n => n.type === 'product').forEach(n => types.add(n.group));
    return Array.from(types).sort();
  }, [graphData.nodes]);

  // 타입 토글 핸들러
  const toggleTypeVisibility = useCallback((type: string) => {
    setHiddenTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  // 필터링된 그래프 데이터
  const filteredGraphData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const hasSearchFilter = searchLower.length > 0;
    const hasTypeFilter = hiddenTypes.size > 0;

    if (!hasSearchFilter && !hasTypeFilter) {
      return graphData;
    }

    // 숨길 상품 ID 목록 (타입 필터 + 검색어 필터)
    const hiddenProductIds = new Set(
      graphData.nodes
        .filter(n => {
          if (n.type !== 'product') return false;
          // 타입 필터
          if (hiddenTypes.has(n.group)) return true;
          // 검색어 필터 (검색어가 있고, 이름에 검색어가 포함되지 않으면 숨김)
          if (hasSearchFilter && !n.name.toLowerCase().includes(searchLower)) return true;
          return false;
        })
        .map(n => n.id)
    );

    // 필터링된 노드 (숨길 상품과 그 상품에만 연결된 재료 제외)
    const filteredNodes = graphData.nodes.filter(node => {
      if (node.type === 'product') {
        return !hiddenProductIds.has(node.id);
      }
      // 재료는 숨겨지지 않은 상품과 연결된 경우에만 표시
      const hasVisibleConnection = graphData.links.some(link => {
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        return sourceId === node.id && !hiddenProductIds.has(targetId);
      });
      return hasVisibleConnection;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // 필터링된 링크
    const filteredLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [graphData, hiddenTypes, searchTerm]);

  // D3 그래프 렌더링
  useEffect(() => {
    if (!svgRef.current || filteredGraphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // 줌 기능 설정
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on('zoom', zoomed);

    svg.call(zoom);

    const g = svg.append('g');

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      g.attr('transform', event.transform.toString());
    }

    // 시뮬레이션 설정
    const simulation = d3
      .forceSimulation<Node>(filteredGraphData.nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>(filteredGraphData.links)
          .id(d => d.id)
          .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // 화살표 마커 정의 (고정 크기)
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('markerUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');

    // 링크 그리기
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredGraphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.quantity))
      .attr('marker-end', 'url(#arrowhead)');

    // 링크 수량 라벨
    const linkLabels = g
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(filteredGraphData.links)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => `x${d.quantity}`);

    // 노드 그룹
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredGraphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, Node>().on('start', dragstarted).on('drag', dragged).on('end', dragended));

    // 노드 원
    node
      .append('circle')
      .attr('r', d => (d.type === 'product' ? 20 : 12))
      .attr('fill', d => (d.type === 'product' ? GRADE_COLORS[d.grade || ItemGrade.NORMAL] : '#95a5a6'))
      .attr('stroke', d => (d.type === 'product' ? '#333' : '#666'))
      .attr('stroke-width', d => (d.type === 'product' ? 2 : 1))
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // 노드 라벨
    node
      .append('text')
      .attr('dx', d => (d.type === 'product' ? 25 : 15))
      .attr('dy', '.35em')
      .attr('font-size', d => (d.type === 'product' ? '12px' : '10px'))
      .attr('font-weight', d => (d.type === 'product' ? 'bold' : 'normal'))
      .attr('fill', '#333')
      .text(d => (d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name));

    // 노드 타입 아이콘
    node
      .filter(d => d.type === 'product')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .text('P');

    node
      .filter(d => d.type === 'material')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .text('M');

    // 시뮬레이션 틱
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x || 0)
        .attr('y1', d => (d.source as Node).y || 0)
        .attr('x2', d => (d.target as Node).x || 0)
        .attr('y2', d => (d.target as Node).y || 0);

      linkLabels.attr('x', d => (((d.source as Node).x || 0) + ((d.target as Node).x || 0)) / 2).attr('y', d => (((d.source as Node).y || 0) + ((d.target as Node).y || 0)) / 2);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // 드래그 함수들
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // 클릭시 선택 해제
    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [filteredGraphData, dimensions, linkDistance]);

  return (
    <div className={`relationship-content ${className || ''}`}>
      {/* 메인 탭 네비게이션 */}
      <div className="main-tabs">
        {MAIN_TABS.map(tab => (
          <button key={tab} className={`main-tab ${activeMainTab === tab ? 'active' : ''}`} onClick={() => setActiveMainTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* 범례 및 필터 */}
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-circle product"></span>
          <span>상품 (P)</span>
        </div>
        <div className="legend-item">
          <span className="legend-circle material"></span>
          <span>재료 (M)</span>
        </div>
        <div className="legend-item">
          <span className="legend-arrow">→</span>
          <span>재료 → 상품</span>
        </div>
        <div className="legend-info">
          <span>노드: {filteredGraphData.nodes.length}개</span>
          <span>연결: {filteredGraphData.links.length}개</span>
        </div>
      </div>

      {/* 필터 영역 (검색 + 타입 필터 한 줄) */}
      <div className="filter-area">
        {/* 검색창 */}
        <div className="search-filter">
          <label htmlFor="product-search" className="filter-label">
            검색:
          </label>
          <div className="search-input-wrapper">
            <input id="product-search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="상품명 입력..." className="search-input" />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="검색어 지우기">
                ×
              </button>
            )}
          </div>
        </div>

        {/* 타입 필터 */}
        {productTypes.length > 0 && (
          <div className="type-filter">
            <span className="filter-label">타입:</span>
            <div className="filter-buttons">
              {productTypes.map(type => (
                <button
                  key={type}
                  className={`filter-btn ${hiddenTypes.has(type) ? 'hidden' : 'visible'}`}
                  onClick={() => toggleTypeVisibility(type)}
                  title={hiddenTypes.has(type) ? `${type} 표시` : `${type} 숨기기`}
                >
                  {type}
                  <span className="filter-count">({graphData.nodes.filter(n => n.type === 'product' && n.group === type).length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 거리 조절 슬라이더 */}
        <div className="distance-filter">
          <label htmlFor="link-distance" className="filter-label">
            노드간 거리:
          </label>
          <input id="link-distance" type="range" min="30" max="300" value={linkDistance} onChange={e => setLinkDistance(Number(e.target.value))} className="distance-slider" />
          <span className="distance-value">{linkDistance}</span>
        </div>

        {/* 필터 초기화 버튼 */}
        {(hiddenTypes.size > 0 || searchTerm || linkDistance !== 100) && (
          <button
            className="filter-btn reset"
            onClick={() => {
              setHiddenTypes(new Set());
              setSearchTerm('');
              setLinkDistance(100);
            }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 그래프 컨테이너 */}
      <div className="graph-container" ref={containerRef}>
        {filteredGraphData.nodes.length > 0 ? (
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
        ) : graphData.nodes.length > 0 ? (
          <div className="no-data-message">
            <p>모든 타입이 숨겨져 있습니다.</p>
            <p>필터에서 타입을 선택하여 표시해주세요.</p>
          </div>
        ) : (
          <div className="no-data-message">
            <p>표시할 데이터가 없습니다.</p>
            <p>계산기 탭에서 먼저 아이템을 추가해주세요.</p>
          </div>
        )}
      </div>

      {/* 상품 리스트 패널 (우측 하단, 펼치기/접기) */}
      <div className={`product-list-panel ${isProductListOpen ? 'open' : 'closed'}`}>
        <button className="toggle-panel-btn" onClick={() => setIsProductListOpen(!isProductListOpen)}>
          <span className="toggle-icon">{isProductListOpen ? '▼' : '▲'}</span>
          <span className="toggle-text">상품 목록 ({filteredGraphData.nodes.filter(n => n.type === 'product').length})</span>
        </button>
        {isProductListOpen && (
          <div className="product-list-content">
            <div className="product-list-header">
              <span className="header-name">상품명</span>
              <span className="header-type">분류</span>
              <span className="header-price">가격</span>
            </div>
            <ul className="product-list">
              {filteredGraphData.nodes
                .filter(n => n.type === 'product')
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(product => (
                  <li key={product.id} className={`product-item ${selectedNode?.id === product.id ? 'selected' : ''}`} onClick={() => setSelectedNode(product)}>
                    <span className="product-name">{product.name}</span>
                    <span className="product-type">{product.group}</span>
                    <span className="product-price">
                      {product.minPrice?.toLocaleString() || 0} ~ {product.maxPrice?.toLocaleString() || 0}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* 선택된 노드 정보 패널 */}
      {selectedNode && (
        <div className="node-info-panel">
          <div className="panel-header">
            <h4>{selectedNode.name}</h4>
            <button className="close-panel" onClick={() => setSelectedNode(null)}>
              ×
            </button>
          </div>
          <div className="panel-body">
            <div className="info-row">
              <span className="label">타입:</span>
              <span className={`value type-${selectedNode.type}`}>{selectedNode.type === 'product' ? '상품' : '재료'}</span>
            </div>
            <div className="info-row">
              <span className="label">분류:</span>
              <span className="value">{selectedNode.group}</span>
            </div>
            {selectedNode.minPrice !== undefined && selectedNode.minPrice > 0 && (
              <div className="info-row">
                <span className="label">최저가:</span>
                <span className="value price">{selectedNode.minPrice.toLocaleString()}원</span>
              </div>
            )}
            {selectedNode.maxPrice !== undefined && selectedNode.maxPrice > 0 && (
              <div className="info-row">
                <span className="label">최고가:</span>
                <span className="value price">{selectedNode.maxPrice.toLocaleString()}원</span>
              </div>
            )}
            {/* 연결된 노드 정보 */}
            <div className="connected-nodes">
              <h5>{selectedNode.type === 'product' ? '필요 재료' : '사용처'}</h5>
              <ul>
                {filteredGraphData.links
                  .filter(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    return selectedNode.type === 'product' ? targetId === selectedNode.id : sourceId === selectedNode.id;
                  })
                  .map((link, index) => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    const connectedId = selectedNode.type === 'product' ? sourceId : targetId;
                    const connectedNode = filteredGraphData.nodes.find(n => n.id === connectedId);
                    return (
                      <li key={`${sourceId}-${targetId}-${index}`}>
                        {connectedNode?.name || connectedId}
                        {selectedNode.type === 'product' && ` (x${link.quantity})`}
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipContent;
