import type { Flight, Hotel, PlanItem } from "@/types/trip";

/**
 * 도시 데이터 (임시)
 * 계획 생성 API(POST /api/v1/trips) 연동 전까지 프론트에서 쓴다.
 */
export interface CityData {
  iata: string;
  country: string;
  flight: Omit<Flight, "price"> & { price: number };
  /** [상위 등급, 합리적 등급] */
  hotels: [Hotel, Hotel];
  places: PlanItem[];
}

export const CITIES: Record<string, CityData> = {
  후쿠오카: {
    iata: "FUK",
    country: "일본",
    flight: {
      airline: "진에어",
      price: 172_000,
      duration: "1시간 20분",
      stops: 0,
      outbound: ["09:20", "10:40"],
      inbound: ["18:35", "20:05"],
    },
    hotels: [
      { name: "하카타 그레이스 스테이", stars: 4, area: "하카타역 도보 6분", pricePerNight: 118_000, lat: 33.5902, lng: 130.4203 },
      { name: "텐진 코트 인", stars: 3, area: "텐진역 도보 4분", pricePerNight: 78_000, lat: 33.5914, lng: 130.399 },
    ],
    places: [
      { arriveAt: "09:40", placeName: "오호리 공원", description: "호수를 한 바퀴 도는 산책로. 아침에 사람이 적습니다.", stayMinutes: 70, transit: "지하철 12분", cost: 0, lat: 33.586, lng: 130.379 },
      { arriveAt: "12:00", placeName: "다이묘 골목 라멘", description: "점심 대기 20분 안쪽. 돈코츠 기본.", stayMinutes: 60, transit: "도보 9분", cost: 14_000, isMeal: true, lat: 33.5863, lng: 130.396 },
      { arriveAt: "14:00", placeName: "구시다 신사", description: "하카타 옛 거리와 이어지는 짧은 코스.", stayMinutes: 50, transit: "지하철 8분", cost: 0, lat: 33.5931, lng: 130.4106 },
      { arriveAt: "16:30", placeName: "캐널시티 하카타", description: "분수 쇼는 정시마다. 비가 와도 실내로 이어집니다.", stayMinutes: 90, transit: "도보 11분", cost: 0, lat: 33.5896, lng: 130.4113 },
      { arriveAt: "19:00", placeName: "나카스 포장마차", description: "강변 야타이 거리. 자리 나면 바로 앉는 편이 낫습니다.", stayMinutes: 80, transit: "도보 7분", cost: 22_000, isMeal: true, lat: 33.594, lng: 130.4045 },
      { arriveAt: "10:00", placeName: "다자이후 텐만구", description: "도심에서 조금 나가지만 오전이 한산합니다.", stayMinutes: 100, transit: "열차 30분", cost: 0, lat: 33.5215, lng: 130.535 },
      { arriveAt: "13:00", placeName: "우메가에모찌 노점", description: "줄이 짧은 쪽 아무 데나. 갓 구운 게 맛있습니다.", stayMinutes: 30, transit: "도보 3분", cost: 6_000, isMeal: true, lat: 33.5203, lng: 130.5341 },
      { arriveAt: "15:30", placeName: "모모치 해변", description: "해 질 무렵 타워 방향으로 걷기 좋습니다.", stayMinutes: 80, transit: "버스 25분", cost: 0, lat: 33.594, lng: 130.3512 },
      { arriveAt: "18:00", placeName: "텐진 이자카야", description: "예약 없이도 대체로 자리가 있습니다.", stayMinutes: 90, transit: "지하철 10분", cost: 26_000, isMeal: true, lat: 33.5905, lng: 130.3985 },
    ],
  },

  오사카: {
    iata: "KIX",
    country: "일본",
    flight: {
      airline: "제주항공",
      price: 198_000,
      duration: "1시간 55분",
      stops: 0,
      outbound: ["08:05", "10:00"],
      inbound: ["19:10", "21:15"],
    },
    hotels: [
      { name: "난바 리버사이드 호텔", stars: 4, area: "난바역 도보 5분", pricePerNight: 132_000, lat: 34.6655, lng: 135.502 },
      { name: "우메다 스테이 인", stars: 3, area: "우메다역 도보 7분", pricePerNight: 88_000, lat: 34.702, lng: 135.496 },
    ],
    places: [
      { arriveAt: "10:30", placeName: "오사카성", description: "천수각까지 오르막 15분. 해자 쪽 길이 덜 붐빕니다.", stayMinutes: 110, transit: "지하철 15분", cost: 8_000, lat: 34.6873, lng: 135.5262 },
      { arriveAt: "13:00", placeName: "구로몬 시장", description: "점심은 서서 먹는 쪽이 회전이 빠릅니다.", stayMinutes: 70, transit: "지하철 12분", cost: 18_000, isMeal: true, lat: 34.6653, lng: 135.5061 },
      { arriveAt: "15:30", placeName: "신사이바시 상점가", description: "아케이드라 날씨 영향이 없습니다.", stayMinutes: 90, transit: "도보 6분", cost: 0, lat: 34.6725, lng: 135.501 },
      { arriveAt: "18:30", placeName: "도톤보리", description: "간판 앞은 저녁에 특히 붐빕니다.", stayMinutes: 80, transit: "도보 5분", cost: 24_000, isMeal: true, lat: 34.6687, lng: 135.5013 },
      { arriveAt: "09:30", placeName: "우메다 스카이빌딩", description: "전망대는 오전에 대기가 짧습니다.", stayMinutes: 80, transit: "지하철 10분", cost: 12_000, lat: 34.7053, lng: 135.4901 },
      { arriveAt: "12:30", placeName: "후쿠시마 우동집", description: "점심 피크 전에 들어가면 바로 앉습니다.", stayMinutes: 50, transit: "도보 12분", cost: 11_000, isMeal: true, lat: 34.697, lng: 135.487 },
      { arriveAt: "15:00", placeName: "나카노시마 산책로", description: "강 따라 걷는 평지 코스.", stayMinutes: 70, transit: "도보 9분", cost: 0, lat: 34.693, lng: 135.495 },
      { arriveAt: "18:00", placeName: "덴마 이자카야 골목", description: "가게가 촘촘해 자리 찾기 쉽습니다.", stayMinutes: 90, transit: "지하철 8분", cost: 27_000, isMeal: true, lat: 34.7005, lng: 135.512 },
    ],
  },

  도쿄: {
    iata: "NRT",
    country: "일본",
    flight: {
      airline: "대한항공",
      price: 246_000,
      duration: "2시간 25분",
      stops: 0,
      outbound: ["09:00", "11:25"],
      inbound: ["18:20", "21:00"],
    },
    hotels: [
      { name: "시부야 크로스 호텔", stars: 4, area: "시부야역 도보 8분", pricePerNight: 158_000, lat: 35.6585, lng: 139.702 },
      { name: "우에노 파크 인", stars: 3, area: "우에노역 도보 5분", pricePerNight: 96_000, lat: 35.712, lng: 139.777 },
    ],
    places: [
      { arriveAt: "10:00", placeName: "센소지", description: "나카미세 거리는 오전이 그나마 여유롭습니다.", stayMinutes: 70, transit: "전철 25분", cost: 0, lat: 35.7148, lng: 139.7967 },
      { arriveAt: "12:30", placeName: "아사쿠사 텐동", description: "점심 줄은 12시 전에 서는 편이 낫습니다.", stayMinutes: 60, transit: "도보 6분", cost: 16_000, isMeal: true, lat: 35.712, lng: 139.795 },
      { arriveAt: "15:00", placeName: "시부야 스크램블", description: "횡단보도 위 전망대는 30분이면 충분합니다.", stayMinutes: 80, transit: "전철 30분", cost: 9_000, lat: 35.6595, lng: 139.7005 },
      { arriveAt: "19:00", placeName: "에비스 요코초", description: "좁은 골목 술집. 7시 전에 들어가면 자리가 납니다.", stayMinutes: 90, transit: "전철 7분", cost: 28_000, isMeal: true, lat: 35.647, lng: 139.71 },
      { arriveAt: "09:30", placeName: "신주쿠 교엔", description: "입장료가 있는 대신 조용합니다.", stayMinutes: 90, transit: "전철 15분", cost: 5_000, lat: 35.6852, lng: 139.71 },
      { arriveAt: "13:00", placeName: "오모테산도 카페", description: "가로수길 따라 걷다 아무 곳이나.", stayMinutes: 60, transit: "전철 10분", cost: 13_000, isMeal: true, lat: 35.6655, lng: 139.712 },
      { arriveAt: "16:00", placeName: "하라주쿠 다케시타 거리", description: "주말은 사람에 밀려 다닙니다. 평일 추천.", stayMinutes: 70, transit: "도보 8분", cost: 0, lat: 35.6716, lng: 139.706 },
      { arriveAt: "18:30", placeName: "신주쿠 이자카야", description: "골목 안쪽이 조용합니다.", stayMinutes: 90, transit: "전철 12분", cost: 30_000, isMeal: true, lat: 35.694, lng: 139.7005 },
    ],
  },

  다낭: {
    iata: "DAD",
    country: "베트남",
    flight: {
      airline: "베트젯항공",
      price: 285_000,
      duration: "4시간 40분",
      stops: 0,
      outbound: ["20:10", "23:20"],
      inbound: ["01:20", "08:10"],
    },
    hotels: [
      { name: "미케 비치 리조트", stars: 4, area: "미케 해변 앞", pricePerNight: 105_000, lat: 16.048, lng: 108.245 },
      { name: "한강 뷰 호텔", stars: 3, area: "한 시장 도보 6분", pricePerNight: 62_000, lat: 16.07, lng: 108.2225 },
    ],
    places: [
      { arriveAt: "09:00", placeName: "미케 해변", description: "오전에는 파라솔 자리가 넉넉합니다.", stayMinutes: 120, transit: "도보 4분", cost: 0, lat: 16.056, lng: 108.245 },
      { arriveAt: "12:30", placeName: "미꽝 국수집", description: "현지식 점심. 자리 회전이 빠릅니다.", stayMinutes: 50, transit: "택시 10분", cost: 7_000, isMeal: true, lat: 16.06, lng: 108.223 },
      { arriveAt: "15:00", placeName: "오행산", description: "엘리베이터를 타면 계단을 아낄 수 있습니다.", stayMinutes: 100, transit: "택시 20분", cost: 6_000, lat: 16.004, lng: 108.263 },
      { arriveAt: "19:00", placeName: "한 시장 & 용다리", description: "주말 밤에는 다리에서 불을 뿜습니다.", stayMinutes: 90, transit: "택시 18분", cost: 15_000, isMeal: true, lat: 16.068, lng: 108.224 },
      { arriveAt: "08:30", placeName: "바나힐", description: "왕복 케이블카 포함. 오전에 안개가 걷힙니다.", stayMinutes: 240, transit: "셔틀 45분", cost: 48_000, lat: 15.995, lng: 107.996 },
      { arriveAt: "14:30", placeName: "골든 브리지", description: "바나힐 안. 사람 없는 사진은 이른 시간뿐입니다.", stayMinutes: 60, transit: "도보 5분", cost: 0, lat: 15.996, lng: 107.9975 },
      { arriveAt: "19:30", placeName: "해산물 식당 거리", description: "미케 해변 남쪽. 킬로 단위로 고릅니다.", stayMinutes: 90, transit: "택시 15분", cost: 19_000, isMeal: true, lat: 16.045, lng: 108.2455 },
      { arriveAt: "10:00", placeName: "호이안 올드타운", description: "차로 40분. 등불은 해 진 뒤부터입니다.", stayMinutes: 180, transit: "택시 40분", cost: 5_000, lat: 15.877, lng: 108.327 },
    ],
  },

  방콕: {
    iata: "BKK",
    country: "태국",
    flight: {
      airline: "타이항공",
      price: 312_000,
      duration: "5시간 45분",
      stops: 0,
      outbound: ["10:35", "14:20"],
      inbound: ["22:30", "06:05"],
    },
    hotels: [
      { name: "수쿰빗 리버 호텔", stars: 4, area: "아속역 도보 5분", pricePerNight: 112_000, lat: 13.737, lng: 100.56 },
      { name: "실롬 시티 인", stars: 3, area: "살라댕역 도보 6분", pricePerNight: 68_000, lat: 13.729, lng: 100.534 },
    ],
    places: [
      { arriveAt: "09:00", placeName: "왕궁 · 왓 프라깨우", description: "복장 규정이 있습니다. 오전이 덜 덥습니다.", stayMinutes: 120, transit: "택시 25분", cost: 9_000, lat: 13.751, lng: 100.4925 },
      { arriveAt: "12:30", placeName: "차이나타운 국숫집", description: "점심은 골목 안쪽이 시원합니다.", stayMinutes: 60, transit: "택시 15분", cost: 8_000, isMeal: true, lat: 13.74, lng: 100.51 },
      { arriveAt: "16:00", placeName: "짜뚜짝 주말시장", description: "주말에만 전부 엽니다. 물 챙기세요.", stayMinutes: 120, transit: "BTS 30분", cost: 0, lat: 13.7995, lng: 100.55 },
      { arriveAt: "19:30", placeName: "루프톱 바", description: "드레스 코드가 있는 곳이 많습니다.", stayMinutes: 90, transit: "택시 20분", cost: 25_000, isMeal: true, lat: 13.72, lng: 100.517 },
      { arriveAt: "10:00", placeName: "짜오프라야 보트", description: "수상버스로 강을 따라 이동합니다.", stayMinutes: 60, transit: "도보 8분", cost: 3_000, lat: 13.736, lng: 100.512 },
      { arriveAt: "13:00", placeName: "왓 아룬", description: "강 건너 사원. 계단이 가파릅니다.", stayMinutes: 70, transit: "보트 10분", cost: 4_000, lat: 13.7437, lng: 100.4889 },
      { arriveAt: "18:00", placeName: "아시아티크 야시장", description: "강변 노을 시간에 맞춰 가면 좋습니다.", stayMinutes: 120, transit: "보트 25분", cost: 18_000, isMeal: true, lat: 13.7045, lng: 100.503 },
      { arriveAt: "09:30", placeName: "담넌 사두억 수상시장", description: "차로 1시간 반. 이른 아침이 제철입니다.", stayMinutes: 180, transit: "차량 90분", cost: 22_000, lat: 13.52, lng: 99.955 },
    ],
  },

  타이베이: {
    iata: "TPE",
    country: "대만",
    flight: {
      airline: "티웨이항공",
      price: 215_000,
      duration: "2시간 50분",
      stops: 0,
      outbound: ["08:40", "10:30"],
      inbound: ["20:15", "23:50"],
    },
    hotels: [
      { name: "중산 가든 호텔", stars: 4, area: "중산역 도보 4분", pricePerNight: 108_000, lat: 25.053, lng: 121.52 },
      { name: "시먼딩 스테이", stars: 3, area: "시먼역 도보 3분", pricePerNight: 71_000, lat: 25.042, lng: 121.507 },
    ],
    places: [
      { arriveAt: "11:00", placeName: "중정기념당", description: "위병 교대는 정시마다 진행됩니다.", stayMinutes: 60, transit: "MRT 12분", cost: 0, lat: 25.035, lng: 121.522 },
      { arriveAt: "13:00", placeName: "딤섬 본점", description: "점심 대기표를 먼저 받아두세요.", stayMinutes: 70, transit: "MRT 8분", cost: 17_000, isMeal: true, lat: 25.033, lng: 121.53 },
      { arriveAt: "15:30", placeName: "용캉제 거리", description: "디저트와 잡화가 이어지는 골목.", stayMinutes: 80, transit: "도보 6분", cost: 6_000, lat: 25.027, lng: 121.529 },
      { arriveAt: "18:30", placeName: "스린 야시장", description: "저녁은 여기서 해결하는 편이 낫습니다.", stayMinutes: 110, transit: "MRT 20분", cost: 15_000, isMeal: true, lat: 25.088, lng: 121.524 },
      { arriveAt: "09:00", placeName: "지우펀 옛거리", description: "차로 1시간. 오전에 가면 골목이 비어 있습니다.", stayMinutes: 150, transit: "버스 60분", cost: 0, lat: 25.109, lng: 121.844 },
      { arriveAt: "13:30", placeName: "지우펀 찻집", description: "창가 자리는 대기가 있습니다.", stayMinutes: 60, transit: "도보 3분", cost: 12_000, isMeal: true, lat: 25.1095, lng: 121.8455 },
      { arriveAt: "17:00", placeName: "타이베이 101 전망대", description: "해 질 무렵이 가장 붐빕니다.", stayMinutes: 80, transit: "MRT 40분", cost: 20_000, lat: 25.034, lng: 121.5645 },
      { arriveAt: "19:30", placeName: "라오허제 야시장", description: "입구 후추빵 줄이 가장 깁니다.", stayMinutes: 90, transit: "MRT 15분", cost: 13_000, isMeal: true, lat: 25.048, lng: 121.577 },
    ],
  },
};