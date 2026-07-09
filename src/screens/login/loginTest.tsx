import type { JSX } from "react/jsx-runtime";
import { Button } from "../../components/ui/button_login.tsx";
import { Card, CardContent } from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import {useNavigate} from "react-router-dom";
export const Login = (): JSX.Element => {   
    const navigate = useNavigate();
    const handleLogin = () => {
        // 로그인 로직을 수행한 후, 성공하면 navigate를 사용하여 이동
        navigate('/'); // 로그인 성공 시 이동할 경로
    };
  return (
    // 배경을 흰색으로 변경 및 전체 레이아웃 중앙 정렬
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12">
      <section className="flex w-full max-w-[553px] flex-col">
        {/* 헤더 부분 */}
        <header className="mb-10 flex w-full flex-col">
          <h1 className="text-[48px] font-bold text-black font-['Pretendard']">
            로그인
          </h1>
          <p className="mt-4 text-[24px] font-bold text-zinc-400/50 font-['Pretendard']">
            저장된 계획과 여행 취향을 그대로 이어서.
          </p>
        </header>

        <Card className="w-full border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col gap-8 p-0">
            {/* 이메일 입력창 */}
            <div className="flex flex-col gap-3">
            <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">이메일</label>
            <Input
                type="email"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:outline-none !text-[24px] font-bold font-['Pretendard']"
            />
            </div>

            {/* 비밀번호 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">비밀번호</label>
              <Input
                type="password"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:outline-none !text-[24px] font-bold font-['Pretendard']"
              />
            </div>

            {/* 로그인 버튼 */}
            <Button
              onClick={handleLogin}
              className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-rose-600 text-[30px] font-bold text-white hover:bg-rose-700 font-['Pretendard']"
            >
              로그인
            </Button>

            {/* 가입 안내 */}
            <p className="text-center text-[18px] font-bold font-['Pretendard']">
              <span className="text-zinc-400/75">처음이신가요?</span>
              <span className="text-black"> </span>
              <button type="button" onClick={() => navigate('/signup')} className="text-orange-200 hover:opacity-80">
                30초 만에 가입하기
              </button>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};