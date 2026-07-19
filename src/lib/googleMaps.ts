/**
 * Google Maps JavaScript API 로더
 * 여러 컴포넌트가 동시에 불러도 스크립트를 한 번만 넣는다.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/** 이미 진행 중인 로딩이 있으면 그 약속을 재사용한다 */
let loading: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (!API_KEY) {
    return Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY가 .env에 없습니다."),
    );
  }

  // 이미 로드됨
  if (window.google?.maps) return Promise.resolve();

  // 로딩 중이면 기다린다
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    // libraries=places: 숙소 상세 모달이 사진/평점을 가져올 때 사용 (Places JS)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&language=ko&region=KR&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("지도를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return loading;
}