interface Item {
  no: string;
  label: string;
  title: string;
  desc: string;
  /** 카드 하단 색 막대 (토큰 색) */
  rule: string;
}

const ITEMS: Item[] = [
  {
    no: "01",
    label: "항공",
    title: "왕복 한 편",
    desc: "출발·도착 시각과 경유 여부까지 정해진 하나의 노선.",
    rule: "bg-cobalt",
  },
  {
    no: "02",
    label: "숙소",
    title: "묵을 곳 한 곳",
    desc: "동선 한가운데에 두고 이동 시간을 줄인 숙소.",
    rule: "bg-teal",
  },
  {
    no: "03",
    label: "동선",
    title: "지도 위 하루 경로",
    desc: "숙소에서 출발해 다시 돌아오는 순서를 지도에 그립니다.",
    rule: "bg-violet",
  },
  {
    no: "04",
    label: "예산",
    title: "남는 돈이 보이는 정산",
    desc: "적어낸 예산을 넘지 않게 항목별로 나눈 금액.",
    rule: "bg-amber",
  },
];

/** 계획서에 항상 확정되어 들어가는 네 가지 */
export default function IntroCards() {
  return (
    <section style={{ fontFamily: "Pretendard, sans-serif" }} className="pb-24">
      <h2 className="text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.04em]">
        한 장에 들어가는 것
      </h2>
      <p className="mb-6 mt-1.5 text-[15px] text-ink-2">
        계획서는 항상 이 네 가지가 확정된 상태로 나옵니다.
      </p>

      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <li
            key={it.no}
            className="rounded-card border border-line bg-paper p-5 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_30px_-22px_rgba(15,20,24,.4)]"
          >
            <p className="text-[11px] tracking-[0.1em] text-ink-3">
              {it.no} / {it.label}
            </p>
            <h3 className="mb-1.5 mt-3 text-base font-bold tracking-[-0.03em]">
              {it.title}
            </h3>
            <p className="break-keep text-[13.5px] text-ink-2">{it.desc}</p>
            <span
              className={`mt-3.5 block h-0.5 w-6 rounded-sm ${it.rule}`}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </section>
  );
}