import { useNavigate } from "react-router-dom";
import BillArt from "../components/home/BillArt";
import HomeHero from "../components/home/HomeHero";
import QuickLinks from "../components/home/QuickLinks";
import { homeTiles } from "../components/home/homeTiles";
import QuitDialog from "../components/ui/QuitDialog";
import useConfirmExit from "../hooks/useConfirmExit";
import { api } from "../services/api";

export default function HomePage() {
  const navigate = useNavigate();
  const exit = useConfirmExit();

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
