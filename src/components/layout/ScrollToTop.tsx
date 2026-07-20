import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 라우트(경로)가 바뀌면 화면을 맨 위로 올린다.
 *
 * SPA는 페이지를 "이동"해도 실제로는 같은 문서라 스크롤 위치가 그대로 남는다 —
 * 온보딩을 끝까지 스크롤한 뒤 "채팅하러 가기"를 누르면 플래닝 룸이
 * 중간부터 보이는 문제(피드백)의 원인. 경로가 바뀔 때만 맨 위로 올리고,
 * 같은 경로에서 쿼리만 바뀔 때(?plan= 등)는 위치를 유지한다.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // 화면에 그리는 것 없음 — 동작만 하는 컴포넌트
}
