import { Routes, Route } from "react-router-dom";
import CercularAnimation from "./pages/CercularAnimation/CercularAnimation";
import DelayCercularAnimation from "./pages/DelayCercularAnimation";
import FolderStackAnimation from "./pages/FolderStackAnimation";

import LayeredInterface from "./pages/Test/Layered";
import SpringBounce from "./pages/Test/ElasticPhysics";
import PhysicsShatter from "./pages/Test/PhysicsShatter";
import FallingTextWrapper from "./pages/Test/FallingText";
import ClothReveal from "./pages/Test/ClothsEffect";
import Preloader from "./components/Preloader";
import CardScrollTrigger from "./pages/Test/CardScrollTrigger";
import HomePage from "./pages/Home/HomePage";

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
        <Route path="/card-scroll-trigger" element={<CardScrollTrigger />} />
        <Route path="/physics-shatter" element={<PhysicsShatter />} />
        <Route path="/falling-text" element={<FallingTextWrapper />} />
        <Route path="/cloth-reveal" element={<ClothReveal />} />
      </Routes>
    </Preloader>
  );
}

export default App;
