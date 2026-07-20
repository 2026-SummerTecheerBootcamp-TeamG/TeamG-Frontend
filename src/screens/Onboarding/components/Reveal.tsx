import { useEffect, useRef, useState } from "react";

/**
 * 스크롤 리빌 래퍼 — 화면에 들어오는 순간 "투명 + 아래" 상태에서
 * 위로 떠오르며 불투명해진다 (피드백: 온보딩 콘텐츠 등장 연출).
 *
 * IntersectionObserver: 요소가 뷰포트에 보이는지 브라우저가 감지해주는 표준 API.
 * 스크롤 이벤트를 직접 계산하는 것보다 가볍고 정확하다.
 * 한 번 나타나면 관찰을 끊어(disconnect) 다시 사라지지 않게 한다.
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect(); // 한 번 등장하면 끝 — 스크롤을 되돌려도 유지
        }
      },
      { threshold: 0.15 }, // 요소의 15%가 보이면 발동 (너무 늦지도 이르지도 않게)
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
