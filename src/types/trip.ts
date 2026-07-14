/** 자연어 파싱으로 채워지는 요청 슬롯 (POST /api/v1/agent/parse 의 fields) */
export interface TripRequest {
    /** 목적지 도시명 */
    city: string | null;
    /** 여행 시작일 */
    start: Date | null;
    /** 여행 종료일 */
    end: Date | null;
    /** 성인 인원수 */
    pax: number | null;
    /** 총 예산 (원) */
    budget: number | null;
  }
  
  /** 아직 채워지지 않은 슬롯 이름 (missing_slots) */
  export type MissingSlot = "목적지" | "날짜" | "인원" | "예산";
  
  /** 챗 말풍선 */
  export interface ChatMessage {
    id: string;
    role: "user" | "bot";
    text: string;
    /** 봇 메시지에 붙는 슬롯 칩 */
    slots?: { label: string; missing?: boolean }[];
  }