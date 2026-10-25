import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import FormBuilder from "./pages/FormBuilder.jsx";
import FormViewer from "./pages/FormViewer.jsx";
import FormResults from "./pages/FormResults.jsx";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forms/:id/edit" element={<FormBuilder />} />
        <Route path="/forms/:id/view" element={<FormViewer />} />
        <Route path="/forms/:id/results" element={<FormResults />} />
      </Routes>
    </>
  );
}
