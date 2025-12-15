import { Routes, Route } from "react-router-dom";
import CercularAnimation from "./pages/CercularAnimation/CercularAnimation";
import DelayCercularAnimation from "./pages/DelayCercularAnimation";
import FolderStackAnimation from "./pages/FolderStackAnimation";

function App() {
  return (
    <Routes>
      <Route path="/circular-animation" element={<CercularAnimation />} />
      <Route
        path="/delay-circular-animation"
        element={<DelayCercularAnimation />}
      />
      <Route
        path="/folder-stack-animation"
        element={<FolderStackAnimation />}
      />
    </Routes>
  );
}

export default App;
