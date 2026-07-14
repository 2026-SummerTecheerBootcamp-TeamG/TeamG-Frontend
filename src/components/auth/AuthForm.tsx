import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/** 로그인·회원가입 화면이 함께 쓰는 가운데 정렬 카드 */
export function AuthCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px-89px)] max-w-[1240px] items-center justify-center px-5 py-14">
      <div className="w-full max-w-[400px] rounded-card border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)]">
        <h1 className="text-[22px] font-extrabold tracking-[-0.035em]">
          {title}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-2">{desc}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

/** 라벨 + 인풋 */
export function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.1em] text-ink-3">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-field border-[1.5px] bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors ${
          error ? "border-stamp" : "border-line focus:border-ink"
        }`}
      />
      {error && <span className="mt-1 block text-[12px] text-stamp">{error}</span>}
    </label>
  );
}

/** 라벨 + 셀렉트 */
export function SelectField({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.1em] text-ink-3">
        {label}
      </span>
      <select
        {...props}
        className="w-full rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition-colors focus:border-ink"
      >
        {children}
      </select>
    </label>
  );
}

/** 제출 버튼 */
export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-6 w-full rounded-field bg-cobalt py-3 text-[15px] font-bold text-white transition-colors hover:bg-[#1c36c4]"
    >
      {children}
    </button>
  );
}