import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

// 맵 클릭 이벤트 핸들러 컴포넌트
interface MapClickHandlerProps {
  onMapClick: (position: [number, number]) => void;
}

export const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  onMapClick,
}) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
};
