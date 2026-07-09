import { Routes, Route } from "react-router-dom";
import { Element } from "./screens/Element/Element.tsx"; // 실제 파일 경로에 맞게 수정
import { Login } from "./screens/login/loginTest.tsx";   // 실제 파일 경로에 맞게 수정

function App() {
  return (
    <Routes>
      <Route path="/" element={<Element />} />
      <Route path="/login" element={<Login />} />
      {/* 회원가입 페이지도 만들면 여기 추가 */}
      {/* <Route path="/signup" element={<Signup />} /> */}
    </Routes>
  );
}

export default App;