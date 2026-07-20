import { useEffect, useRef, useState } from "react";

/**
 * 프로필 사진 정사각형 크롭 모달 (외부 라이브러리 없이 구현)
 *
 * 흐름: 업로드한 원본 이미지를 보여주고, 그 위의 "정사각형 선택 박스"를
 *  - 드래그해서 위치를 옮기고
 *  - 아래 슬라이더로 크기를 조절해
 * 보여질 영역을 고른다. [변경]을 누르면 선택 영역을 256×256 캔버스에 그려
 * 압축된 data URL로 부모에게 돌려준다. [취소]는 아무것도 바꾸지 않는다.
 *
 * 좌표계 메모: 박스(x, y, size)는 "화면에 표시된 이미지" 기준 px.
 * 실제 원본 픽셀로는 (원본 크기 / 표시 크기) 배율을 곱해 환산한다.
 */

interface Props {
  /** 업로드한 원본 이미지 (FileReader가 만든 data URL) */
  src: string;
  onCancel: () => void;
  /** 크롭 완료 — 256×256 정사각형 JPEG data URL */
  onApply: (croppedDataUrl: string) => void;
}

/** 크롭 결과 한 변의 픽셀 수 — 아바타 용도라 256이면 충분 (용량도 작아짐) */
const OUTPUT_SIZE = 256;

export default function AvatarCropModal({ src, onCancel, onApply }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  /** 화면에 표시된 이미지의 실제 크기 (원본과 다름 — 축소돼 보일 수 있음) */
  const [disp, setDisp] = useState<{ w: number; h: number } | null>(null);
  /** 정사각형 선택 박스: 표시 이미지 기준 좌상단(x,y)과 한 변 길이(size) */
  const [box, setBox] = useState({ x: 0, y: 0, size: 0 });
  /** 드래그 시작 시점의 포인터/박스 위치 (이동량 계산용) */
  const dragRef = useRef<{ px: number; py: number; bx: number; by: number } | null>(null);

  /** 모달이 떠 있는 동안 배경 스크롤 잠금 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /** 이미지가 로드되면 표시 크기를 재고, 박스를 중앙에 70% 크기로 초기화 */
  const handleImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const size = Math.round(Math.min(w, h) * 0.7);
    setDisp({ w, h });
    setBox({ x: Math.round((w - size) / 2), y: Math.round((h - size) / 2), size });
  };

  /** 값이 [lo, hi] 범위를 벗어나지 않게 자르기 */
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const startDrag = (e: React.PointerEvent) => {
    // setPointerCapture: 포인터가 박스 밖으로 빠르게 나가도 move 이벤트를 계속 받는다
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, bx: box.x, by: box.y };
  };

  const moveDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !disp) return;
    setBox((b) => ({
      ...b,
      // 시작 위치 + 이동량, 이미지 밖으로 못 나가게 clamp
      x: clamp(d.bx + (e.clientX - d.px), 0, disp.w - b.size),
      y: clamp(d.by + (e.clientY - d.py), 0, disp.h - b.size),
    }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  /** 슬라이더로 크기 변경 — 박스 중심을 유지한 채 커지고 작아진다 */
  const resize = (newSize: number) => {
    if (!disp) return;
    setBox((b) => {
      const cx = b.x + b.size / 2;
      const cy = b.y + b.size / 2;
      return {
        size: newSize,
        x: clamp(Math.round(cx - newSize / 2), 0, disp.w - newSize),
        y: clamp(Math.round(cy - newSize / 2), 0, disp.h - newSize),
      };
    });
  };

  /** 선택 영역을 원본 픽셀로 환산해 256×256 캔버스에 그리고 data URL로 변환 */
  const apply = () => {
    const el = imgRef.current;
    if (!el || !disp) return;
    const scale = el.naturalWidth / disp.w; // 표시 px → 원본 px 배율
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      el,
      box.x * scale, box.y * scale, box.size * scale, box.size * scale, // 원본에서 잘라올 영역
      0, 0, OUTPUT_SIZE, OUTPUT_SIZE,                                   // 캔버스에 채울 영역
    );
    // JPEG 품질 0.85: 아바타 크기에서 화질 손실 체감 없이 용량을 크게 줄인다
    onApply(canvas.toDataURL("image/jpeg", 0.85));
  };

  const maxSize = disp ? Math.min(disp.w, disp.h) : 0;
  const minSize = Math.min(60, maxSize); // 아주 작은 이미지도 동작하게

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 px-5 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-card border border-line bg-white p-6 shadow-[0_24px_60px_-16px_rgba(15,20,24,.4)]"
        style={{ fontFamily: "Pretendard, sans-serif" }}
      >
        <h3 className="text-[17px] font-extrabold tracking-[-0.03em]">
          프로필 사진 영역 선택
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-2">
          박스를 끌어서 위치를 옮기고, 아래 슬라이더로 크기를 조절하세요.
          박스 안의 영역이 프로필 사진이 됩니다.
        </p>

        {/* 이미지 + 선택 박스. overflow-hidden: 박스의 그림자(바깥 어둡게)가 카드 밖으로 안 새게 */}
        <div className="relative mx-auto mt-4 w-fit select-none overflow-hidden rounded-xl">
          <img
            ref={imgRef}
            src={src}
            alt="크롭할 원본 사진"
            onLoad={handleImgLoad}
            draggable={false}
            className="block max-h-[340px] max-w-full"
          />
          {disp && box.size > 0 && (
            <div
              // 정사각형 선택 박스 — 거대한 box-shadow로 "박스 바깥"을 어둡게 처리
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              className="absolute cursor-move rounded-md border-2 border-white shadow-[0_0_0_9999px_rgba(15,20,24,.55)]"
              style={{
                left: box.x,
                top: box.y,
                width: box.size,
                height: box.size,
                touchAction: "none", // 모바일에서 드래그가 스크롤로 먹히지 않게
              }}
            />
          )}
        </div>

        {/* 크기 슬라이더 */}
        {disp && (
          <div className="mt-4 flex items-center gap-3">
            <span className="shrink-0 text-[11.5px] text-ink-3">크기</span>
            <input
              type="range"
              min={minSize}
              max={maxSize}
              value={box.size}
              onChange={(e) => resize(Number(e.target.value))}
              className="w-full accent-cobalt"
            />
          </div>
        )}

        {/* 취소 왼쪽 / 변경(확정) 오른쪽 */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-field border border-line py-2.5 text-[14px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            취소
          </button>
          <button
            onClick={apply}
            disabled={!disp}
            className="flex-1 rounded-field bg-cobalt py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
          >
            변경
          </button>
        </div>
      </div>
    </div>
  );
}
