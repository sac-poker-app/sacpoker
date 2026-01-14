import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import ShareView from "@/react-app/pages/ShareView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:tournamentId" element={<ShareView />} />
      </Routes>
    </Router>
  );
}
