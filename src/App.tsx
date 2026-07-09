import { Routes, Route } from "react-router-dom";
import { Element } from "./screens/Element/Element.tsx";
import { Login } from "./screens/login/login.tsx";
import { Signup } from "./screens/signup/index.ts";
import { PlanningRoom } from "./screens/PlanningRoom/index.ts";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Element />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/planning-room" element={<PlanningRoom />} />
    </Routes>
  );
}

export default App;