/** 국적 선택지 — 값은 ISO 3166-1 alpha-2 (백엔드 규약) */
export const NATIONS: { code: string; label: string }[] = [
    { code: "KR", label: "대한민국" },
    { code: "JP", label: "일본" },
    { code: "US", label: "미국" },
    { code: "TW", label: "대만" },
    { code: "VN", label: "베트남" },
    { code: "TH", label: "태국" },
  ];
  
  /** 기본 출발지 선택지 */
  export const DEPARTURES: { city: string; iata: string }[] = [
    { city: "서울", iata: "ICN" },
    { city: "부산", iata: "PUS" },
    { city: "제주", iata: "CJU" },
    { city: "대구", iata: "TAE" },
  ];
  
  /** 국가 코드 → 한글 이름 (없으면 코드 그대로) */
  export const nationLabel = (code: string) =>
    NATIONS.find((n) => n.code === code)?.label ?? code;