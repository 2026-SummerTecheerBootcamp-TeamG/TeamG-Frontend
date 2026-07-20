const ONBOARDING_SEEN_KEY = "tripcanvas_onboarding_seen";

/** 회원가입 직후 1회만 온보딩을 보여주기 위한 플래그 (탭/새로고침에도 유지되도록 localStorage 사용) */
export const onboardingStorage = {
  hasSeen: () => localStorage.getItem(ONBOARDING_SEEN_KEY) === "1",
  markSeen: () => localStorage.setItem(ONBOARDING_SEEN_KEY, "1"),
};
