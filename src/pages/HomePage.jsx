import { useNavigate } from "react-router-dom";
import ActionTile from "../components/home/ActionTile";
import HeroTile from "../components/home/HeroTile";
import { homeTiles } from "../components/home/homeTiles";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bento">
      <HeroTile onClick={() => navigate("/bills/new")} />
      {homeTiles.map((tile) => (
        <ActionTile key={tile.path} {...tile} onClick={() => navigate(tile.path)} />
      ))}
    </div>
  );
}
