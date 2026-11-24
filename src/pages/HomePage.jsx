import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BillArt from "../components/home/BillArt";
import HomeHero from "../components/home/HomeHero";
import QuickLinks from "../components/home/QuickLinks";
import { homeTiles } from "../components/home/homeTiles";
import QuitDialog from "../components/ui/QuitDialog";
import useConfirmExit from "../hooks/useConfirmExit";
import { api } from "../services/api";
import { clearSession } from "../utils/activitySession";

export default function HomePage() {
  const navigate = useNavigate();
  const exit = useConfirmExit();

  // back on home, no bill is being made, and alt + i opens insights
  useEffect(() => {
    clearSession("bill");
    clearSession("challan");
    const openInsights = (event) => {
      if (event.altKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        navigate("/insights");
      }
    };
    window.addEventListener("keydown", openInsights);
    return () => window.removeEventListener("keydown", openInsights);
  }, [navigate]);

  return (
    <div className="home">
      <div className="home-left">
        <HomeHero onCreateBill={() => navigate("/bills/new")} />
        <QuickLinks links={homeTiles} onOpen={navigate} />
      </div>

      <BillArt />

      {exit.asking && <QuitDialog onYes={() => api.quitApp()} onNo={exit.stay} />}
    </div>
  );
}
