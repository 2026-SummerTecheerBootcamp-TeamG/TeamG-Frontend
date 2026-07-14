import { Outlet } from "react-router-dom";
import Header from "./Header";

/** 모든 화면이 공유하는 뼈대 (헤더 + 본문 + 푸터) */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* 각 화면(screens/*)이 여기에 그려진다 */}
        <Outlet />
      </main>

      <footer className="border-t border-line py-7">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 md:px-7">
          <span className="text-[15px] font-bold tracking-[-0.03em]">
            트립캔버스
          </span>
          <span className="font-mono text-[11px] text-ink-3">TRIPCANVAS</span>
        </div>
      </footer>
    </div>
  );
}