import { Routes, Route } from "react-router-dom";
import CercularAnimation from "./pages/CercularAnimation/CercularAnimation";
import DelayCercularAnimation from "./pages/DelayCercularAnimation";
import FolderStackAnimation from "./pages/FolderStackAnimation";
import HomePage from "./pages/Home";
import LayeredInterface from "./pages/Test";
import SpringBounce from "./pages/Test/index2";
import PhysicsShatter from "./pages/Test/index3";
import FallingTextWrapper from "./pages/Test/index4";
import ClothReveal from "./pages/Test/index5";
import Preloader from "./components/Preloader";

function App() {
  return (
    <Preloader>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/circular-animation" element={<CercularAnimation />} />
        <Route
          path="/delay-circular-animation"
          element={<DelayCercularAnimation />}
        />
        <Route
          path="/folder-stack-animation"
          element={<FolderStackAnimation />}
        />
        <Route path="/layered-interface" element={<LayeredInterface />} />
        <Route path="/spring-bounce" element={<SpringBounce />} />
        <Route path="/physics-shatter" element={<PhysicsShatter />} />
        <Route path="/falling-text" element={<FallingTextWrapper />} />
        <Route path="/cloth-reveal" element={<ClothReveal />} />
      </Routes>
    </Preloader>
  );
}

export default App;
