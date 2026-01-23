import cv from 'opencv-ts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { useShopData } from '../../hooks/useShopData';

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'move' | null;

const HANDLE_SIZE = 12; // 모서리 핸들 크기
const STORAGE_KEY = 'aion2-map-camera-area';

const CameraContent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRecognizeRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [originalBox, setOriginalBox] = useState<SelectionBox | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isAutoRecognize, setIsAutoRecognize] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string>('');
  const lastOcrHashRef = useRef<string>('');

  // 상점 데이터 가져오기
  const { initializeData } = useShopData();

  // Tesseract Worker 초기화 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await Tesseract.createWorker('kor');
        workerRef.current = worker;
        setIsWorkerReady(true);
      } catch (err) {
        console.error('Tesseract Worker 초기화 실패:', err);
      }
    };

    initWorker();
    initializeData();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initializeData]);

  useEffect(() => {
    if (selectionBox) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectionBox));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectionBox]);

  // 처리된 이미지를 캔버스에 그리기
  useEffect(() => {
    if (!processedImageUrl || !processedCanvasRef.current) return;

    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = processedImageUrl;
  }, [processedImageUrl]);

  // 이미지 해시 생성 함수 (간단한 샘플링 기반)
  const generateImageHash = useCallback((data: Uint8ClampedArray, width: number, height: number): string => {
    // 10x10 그리드로 샘플링하여 해시 생성 (성능 최적화)
    const sampleSize = 10;
    const stepX = Math.floor(width / sampleSize);
    const stepY = Math.floor(height / sampleSize);
    const samples: number[] = [];

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const pixelX = Math.min(x * stepX, width - 1);
        const pixelY = Math.min(y * stepY, height - 1);
        const idx = (pixelY * width + pixelX) * 4;
        // 그레이스케일 값만 사용 (R, G, B가 동일하므로)
        samples.push(data[idx]);
      }
    }

    // 샘플들의 패턴을 문자열로 변환
    return samples.map(v => v.toString(36)).join('');
  }, []);

  // 이미지 처리 (캡처 중이고 선택 영역이 있으면 항상 실행)
  useEffect(() => {
    if (!isCapturing || !selectionBox || !videoRef.current) return;

    const processImageInterval = setInterval(() => {
      if (!videoRef.current || !selectionBox) return;

      try {
        const video = videoRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = selectionBox.width;
        tempCanvas.height = selectionBox.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;

        tempCtx.drawImage(video, selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height, 0, 0, selectionBox.width, selectionBox.height);

        // OpenCV.js로 이미지 처리
        const src = cv.imread(tempCanvas);
        const dst = new cv.Mat();
        const processed = new cv.Mat();

        // 이미지 2배 확대
        cv.resize(src, dst, new cv.Size(selectionBox.width * 2, selectionBox.height * 2), 0, 0, cv.INTER_LINEAR);

        // 그레이스케일 변환
        cv.cvtColor(dst, processed, cv.COLOR_RGBA2GRAY);

        // 가우시안 블러로 노이즈 제거
        cv.GaussianBlur(processed, processed, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

        // 적응형 이진화 (기존 고정 임계값보다 훨씬 우수)
        cv.adaptiveThreshold(processed, processed, 127, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 9);

        // Morphology 연산 (노이즈 제거 + 텍스트 강화)
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3), new cv.Point(-1, -1));
        cv.morphologyEx(processed, processed, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 1, cv.BORDER_CONSTANT, new cv.Scalar());

        // 처리된 이미지를 캔버스로 출력
        const outputCanvas = document.createElement('canvas');
        cv.imshow(outputCanvas, processed);

        // 이미지 해시 생성
        const imageData = outputCanvas.getContext('2d')?.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        if (imageData) {
          const hash = generateImageHash(imageData.data, imageData.width, imageData.height);
          setImageHash(hash);
        }

        // 처리된 이미지를 Data URL로 변환하여 저장
        const processedImageDataUrl = outputCanvas.toDataURL('image/png');
        setProcessedImageUrl(processedImageDataUrl);

        // OpenCV 메모리 해제
        src.delete();
        dst.delete();
        processed.delete();
        kernel.delete();
      } catch (err) {
        console.error('OpenCV 이미지 처리 실패:', err);
      }
    }, 1000); // 1초마다 이미지 처리

    return () => {
      clearInterval(processImageInterval);
    };
  }, [isCapturing, selectionBox, generateImageHash]);

  // 자동 OCR 인식 (이미지가 변경되었을 때만 실행)
  useEffect(() => {
    if (isAutoRecognize && processedImageUrl && imageHash && !isRecognizing && isWorkerReady) {
      const runAutoOCR = async () => {
        if (!workerRef.current) return;

        console.log('?????????????');

        // 이미지가 변경되지 않았으면 OCR 스킵
        if (imageHash === lastOcrHashRef.current) {
          return;
        }

        try {
          setIsRecognizing(true);

          // 처리된 이미지로 OCR 인식
          await workerRef.current.recognize(processedImageUrl);

          // 마지막 OCR 처리한 해시 저장
          lastOcrHashRef.current = imageHash;
        } catch (err) {
          console.error('자동 텍스트 인식 실패:', err);
        } finally {
          setIsRecognizing(false);
        }
      };

      autoRecognizeRef.current = setInterval(runAutoOCR, 100); // 100ms마다 체크 (이미지 변경 감지)

      return () => {
        if (autoRecognizeRef.current) {
          clearInterval(autoRecognizeRef.current);
          autoRecognizeRef.current = null;
        }
      };
    } else {
      if (autoRecognizeRef.current) {
        clearInterval(autoRecognizeRef.current);
        autoRecognizeRef.current = null;
      }
    }
  }, [isAutoRecognize, processedImageUrl, imageHash, isRecognizing, isWorkerReady]);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, [stream]);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      } as DisplayMediaStreamOptions);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsCapturing(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err) {
      console.error('화면 캡처 실패:', err);
      setError('화면 캡처를 시작할 수 없습니다. 권한을 확인해주세요.');
      setIsCapturing(false);
    }
  }, [stopCapture]);

  // 캔버스에 비디오와 선택 영역 그리기
  useEffect(() => {
    if (!isCapturing || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        if (selectionBox) {
          // 선택 영역 테두리
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);

          // 선택 영역 배경
          ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
          ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);

          // 라벨
          ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
          ctx.fillRect(selectionBox.x, selectionBox.y - 24, 80, 24);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('인식 영역', selectionBox.x + 8, selectionBox.y - 7);

          // 4개 모서리 핸들 그리기
          const handles = [
            { x: selectionBox.x, y: selectionBox.y }, // nw
            { x: selectionBox.x + selectionBox.width, y: selectionBox.y }, // ne
            { x: selectionBox.x, y: selectionBox.y + selectionBox.height }, // sw
            { x: selectionBox.x + selectionBox.width, y: selectionBox.y + selectionBox.height }, // se
          ];

          handles.forEach(handle => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
            ctx.fill();
            ctx.stroke();
          });
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isCapturing, selectionBox]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // 마우스 위치에 따른 핸들 또는 이동 영역 감지
  const getHandleAtPosition = useCallback(
    (x: number, y: number): ResizeHandle => {
      if (!selectionBox) return null;

      const handles: { type: ResizeHandle; x: number; y: number }[] = [
        { type: 'nw', x: selectionBox.x, y: selectionBox.y },
        { type: 'ne', x: selectionBox.x + selectionBox.width, y: selectionBox.y },
        { type: 'sw', x: selectionBox.x, y: selectionBox.y + selectionBox.height },
        { type: 'se', x: selectionBox.x + selectionBox.width, y: selectionBox.y + selectionBox.height },
      ];

      // 핸들 체크
      for (const handle of handles) {
        if (Math.abs(x - handle.x) <= HANDLE_SIZE && Math.abs(y - handle.y) <= HANDLE_SIZE) {
          return handle.type;
        }
      }

      // 영역 내부 체크 (이동)
      if (x >= selectionBox.x && x <= selectionBox.x + selectionBox.width && y >= selectionBox.y && y <= selectionBox.y + selectionBox.height) {
        return 'move';
      }

      return null;
    },
    [selectionBox]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(e);
      const handle = getHandleAtPosition(coords.x, coords.y);

      if (handle && selectionBox) {
        setActiveHandle(handle);
        setDragStart(coords);
        setOriginalBox({ ...selectionBox });
      } else if (!selectionBox) {
        // 선택 영역이 없으면 새로 생성 (기본 크기)
        const canvas = canvasRef.current;
        if (canvas) {
          const defaultWidth = Math.min(200, canvas.width * 0.3);
          const defaultHeight = Math.min(150, canvas.height * 0.3);
          setSelectionBox({
            x: coords.x - defaultWidth / 2,
            y: coords.y - defaultHeight / 2,
            width: defaultWidth,
            height: defaultHeight,
          });
        }
      }
    },
    [getCanvasCoordinates, getHandleAtPosition, selectionBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(e);
      const canvas = canvasRef.current;

      // 커서 변경
      if (canvas && selectionBox) {
        const handle = getHandleAtPosition(coords.x, coords.y);
        if (handle === 'nw' || handle === 'se') {
          canvas.style.cursor = 'nwse-resize';
        } else if (handle === 'ne' || handle === 'sw') {
          canvas.style.cursor = 'nesw-resize';
        } else if (handle === 'move') {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }

      if (!activeHandle || !dragStart || !originalBox) return;

      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      let newBox = { ...originalBox };

      switch (activeHandle) {
        case 'nw':
          newBox.x = originalBox.x + deltaX;
          newBox.y = originalBox.y + deltaY;
          newBox.width = originalBox.width - deltaX;
          newBox.height = originalBox.height - deltaY;
          break;
        case 'ne':
          newBox.y = originalBox.y + deltaY;
          newBox.width = originalBox.width + deltaX;
          newBox.height = originalBox.height - deltaY;
          break;
        case 'sw':
          newBox.x = originalBox.x + deltaX;
          newBox.width = originalBox.width - deltaX;
          newBox.height = originalBox.height + deltaY;
          break;
        case 'se':
          newBox.width = originalBox.width + deltaX;
          newBox.height = originalBox.height + deltaY;
          break;
        case 'move':
          newBox.x = originalBox.x + deltaX;
          newBox.y = originalBox.y + deltaY;
          break;
      }

      // 최소 크기 보장
      if (newBox.width < 20) {
        if (activeHandle === 'nw' || activeHandle === 'sw') {
          newBox.x = originalBox.x + originalBox.width - 20;
        }
        newBox.width = 20;
      }
      if (newBox.height < 20) {
        if (activeHandle === 'nw' || activeHandle === 'ne') {
          newBox.y = originalBox.y + originalBox.height - 20;
        }
        newBox.height = 20;
      }

      setSelectionBox(newBox);
    },
    [getCanvasCoordinates, getHandleAtPosition, selectionBox, activeHandle, dragStart, originalBox]
  );

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
    setDragStart(null);
    setOriginalBox(null);
  }, []);

  const clearBox = useCallback(() => {
    setSelectionBox(null);
  }, []);

  return (
    <div className="camera-content">
      <div className="camera-header">
        <h3>자동화 상점 동기화</h3>
        <div className="camera-controls">
          {!isCapturing ? (
            <button className="btn-start-capture" onClick={startCapture}>
              🎥 창 선택하여 캡처 시작
            </button>
          ) : (
            <>
              {selectionBox && (
                <>
                  <button className={`btn-auto-recognize ${isAutoRecognize ? 'active' : ''}`} onClick={() => setIsAutoRecognize(!isAutoRecognize)}>
                    {isAutoRecognize ? '⏸️ 자동 중지' : '▶️ 자동 인식'}
                  </button>
                  <button className="btn-clear-boxes" onClick={clearBox}>
                    🗑️ 영역 삭제
                  </button>
                </>
              )}
              <button className="btn-stop-capture" onClick={stopCapture}>
                ⏹️ 캡처 중지
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="camera-error">{error}</div>}

      {isCapturing && !selectionBox && <div className="selection-hint">📌 화면을 클릭하여 인식 영역을 생성하세요. 모서리를 드래그하여 크기를 조절할 수 있습니다.</div>}

      <div className="camera-main-area-vertical">
        {/* 게임 화면 미리보기 + 처리된 이미지 */}
        <div className="camera-bottom-row">
          <div className="camera-preview-small" ref={containerRef}>
            {!isCapturing && !error && (
              <div className="camera-placeholder-small">
                <p>📺 게임 창을 선택하여 화면을 캡처하세요</p>
              </div>
            )}
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas
              ref={canvasRef}
              className="camera-canvas-small"
              style={{ display: isCapturing ? 'block' : 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {selectionBox && isCapturing && (
              <div className="selection-info-compact">
                {Math.round(selectionBox.width)} x {Math.round(selectionBox.height)}
              </div>
            )}
          </div>

          {/* 처리된 이미지 미리보기 */}
          <div className="processed-image-preview">
            <div className="processed-image-label">처리된 이미지</div>
            {processedImageUrl ? (
              <canvas ref={processedCanvasRef} className="processed-image" />
            ) : (
              <div className="processed-image-placeholder">
                <p>자동 인식 시 처리된 이미지가 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraContent;
