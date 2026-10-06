import { useState } from "react";
import { Outlet, Link } from "react-router-dom";

function Layout() {
  const [hasVideo, setHasVideo] = useState(true);

  return (
    <>
      {/* Animated background. Drop a file at public/bg.mp4 to use your own video. */}
      <div className="bg" aria-hidden="true">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
        {hasVideo && (
          <video
            className="bg-video"
            src={`${import.meta.env.BASE_URL}bg.mp4`}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setHasVideo(false)}
          />
        )}
        <div className="bg-overlay" />
      </div>

      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-title-link">
            <h1>
              <span className="logo-ball" /> PokéDex <span>Mini</span>
            </h1>
          </Link>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default Layout;
