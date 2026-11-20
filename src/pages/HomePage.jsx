import { useNavigate } from "react-router-dom";
import BillArt from "../components/home/BillArt";
import HomeHero from "../components/home/HomeHero";
import QuickLinks from "../components/home/QuickLinks";
import { homeTiles } from "../components/home/homeTiles";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-left">
        <HomeHero onCreateBill={() => navigate("/bills/new")} />
        <QuickLinks links={homeTiles} onOpen={navigate} />
      </div>

      <BillArt />
    </div>
  );
}
