import type { JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button_login.tsx";
import { Card, CardContent } from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";

export const Signup = (): JSX.Element => {
  const navigate = useNavigate();

  const handleSignup = () => {
    // TODO: 실제 회원가입 API 호출 후 성공 시 이동하도록 교체
    navigate("/");
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12">
      <section className="flex w-full max-w-[553px] flex-col">
        {/* 헤더 부분 */}
        <header className="mb-10 flex w-full flex-col">
          <h1 className="text-[48px] font-bold text-black font-['Pretendard']">
            회원가입
          </h1>
          <p className="mt-4 text-[24px] font-bold text-zinc-400/50 font-['Pretendard']">
            저장된 계획과 여행 취향을 그대로 이어서.
          </p>
        </header>

        <Card className="w-full border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col gap-8 p-0">
            {/* 이름 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">이름</label>
              <Input
                type="text"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] !text-[24px] font-bold font-['Pretendard'] focus:outline-none"
              />
            </div>

            {/* 이메일 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">이메일</label>
              <Input
                type="email"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] !text-[24px] font-bold font-['Pretendard'] focus:outline-none"
              />
            </div>

            {/* 비밀번호 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">비밀번호</label>
              <Input
                type="password"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] !text-[24px] font-bold font-['Pretendard'] focus:outline-none"
              />
            </div>

            {/* 국적 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">국적</label>
              <Input
                type="text"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] !text-[24px] font-bold font-['Pretendard'] focus:outline-none"
              />
            </div>

            {/* 기본 출발지 입력창 */}
            <div className="flex flex-col gap-3">
              <label className="text-[18px] font-bold text-zinc-400 font-['Pretendard']">기본 출발지</label>
              <Input
                type="text"
                className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-white transition-all duration-150 hover:border-rose-600 hover:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] focus:border-rose-600 focus:shadow-[5px_5px_10px_0px_rgba(127,3,3,0.5)] !text-[24px] font-bold font-['Pretendard'] focus:outline-none"
              />
            </div>

            {/* 가입 완료 버튼 */}
            <Button
              onClick={handleSignup}
              className="h-[96px] w-[553px] rounded-[10px] border-[2.5px] border-black bg-rose-600 text-[30px] font-bold text-white hover:bg-rose-700 font-['Pretendard']"
            >
              가입 완료
            </Button>

            {/* 로그인 페이지로 돌아가는 안내 */}
            <p className="text-center text-[18px] font-bold font-['Pretendard']">
              <span className="text-zinc-400/75">이미 계정이 있으신가요?</span>
              <span className="text-black"> </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-orange-200 hover:opacity-80"
              >
                로그인하기
              </button>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};