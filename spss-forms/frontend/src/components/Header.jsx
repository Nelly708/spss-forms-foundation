import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="header">
      <Link to="/" className="logo">📊 Forms</Link>
      <div className="spacer" />
    </div>
  );
}
