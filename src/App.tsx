import { Routes, Route } from "react-router-dom";
import { Element } from "./screens/Element/Element.tsx";
import { Login } from "./screens/login/login.tsx";
import { Signup } from "./screens/signup/index.ts";
import { PlanningRoom } from "./screens/PlanningRoom/index.ts";
import { MyPage } from "./screens/MyPage/index.ts";
import { PlanConfirm } from "./screens/PlanConfirm/index.ts";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Element />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/planning-room" element={<PlanningRoom />} />
      <Route path="/my-page" element={<MyPage />} />
      <Route path="/plan-confirm" element={<PlanConfirm />} />
    </Routes>
  );
}

export default App;