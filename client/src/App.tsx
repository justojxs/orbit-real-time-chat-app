import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import { useChatStore } from "./store/useChatStore";

function App() {
  const { setUser, initSocket } = useChatStore();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (userInfo) {
      setUser(userInfo);
      initSocket(userInfo);
    }
  }, [setUser, initSocket]);

  return (
    <div className="App min-h-screen bg-background text-foreground flex">
      <BrowserRouter>
        <Routes>
          <Route path="/" Component={HomePage} />
          <Route path="/chats" Component={ChatPage} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
