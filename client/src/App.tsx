import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ChatProvider from "./context/ChatProvider";

function App() {
  return (
    <div className="App min-h-screen bg-background text-foreground flex">
      <BrowserRouter>
        <ChatProvider>
          <Routes>
            <Route path="/" Component={HomePage} />
            <Route path="/chats" Component={ChatPage} />
          </Routes>
        </ChatProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
