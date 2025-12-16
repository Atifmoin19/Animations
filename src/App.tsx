import { Routes, Route } from "react-router-dom";
import CercularAnimation from "./pages/CercularAnimation/CercularAnimation";
import DelayCercularAnimation from "./pages/DelayCercularAnimation";
import FolderStackAnimation from "./pages/FolderStackAnimation";
import HomePage from "./pages/Home";
import Test from "./pages/Test";
import Test2 from "./pages/Test/index2";
import Test3 from "./pages/Test/index3";
import Preloader from "./components/Preloader";
import Test4 from "./pages/Test/index4";
import Test5 from "./pages/Test/index5";

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
        <Route path="/test" element={<Test />} />
        <Route path="/test2" element={<Test2 />} />
        <Route path="/test3" element={<Test3 />} />
        <Route path="/test4" element={<Test4 />} />
        <Route path="/test5" element={<Test5 />} />
      </Routes>
    </Preloader>
  );
}

export default App;
