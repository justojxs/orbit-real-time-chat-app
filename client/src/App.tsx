import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useChatStore } from "./store/useChatStore";

// Lazy load pages — ChatPage is ~80KB+ of components (SingleChat, ScrollableChat, etc.)
// This keeps the initial bundle tiny so the login page loads instantly
const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

// Minimal loading fallback — renders instantly while chunks load
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-[#0d0d12]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Loading</span>
    </div>
  </div>
);

function App() {
  const { setUser, initSocket } = useChatStore();

  useEffect(() => {
    // Warm up the backend server on page load — critical for Render/Railway cold starts
    // This fires before the user even starts typing credentials
    const API_URL = import.meta.env.VITE_API_URL || "";
    fetch(`${API_URL}/health`, { method: "GET", mode: "cors" }).catch(() => { });

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (userInfo) {
      setUser(userInfo);
      initSocket(userInfo);
    }
  }, [setUser, initSocket]);

  return (
    <div className="App min-h-screen bg-background text-foreground flex">
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" Component={HomePage} />
            <Route path="/chats" Component={ChatPage} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
