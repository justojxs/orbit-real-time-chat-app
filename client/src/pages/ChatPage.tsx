import { useChatStore } from "../store/useChatStore";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const ChatPage = () => {
    const { user } = useChatStore();

    return (
        <div className="w-full h-screen flex flex-col bg-[#0d0d12] text-zinc-100 overflow-hidden relative font-sans">
            {/* High-End Design System Background */}
            <div className="fixed inset-0 z-0 premium-bg pointer-events-none"></div>

            <div className="relative z-10 w-full h-full flex flex-col">
                {user && <SideDrawer />}
                <div className="flex justify-between w-full flex-1 p-4 md:px-8 md:pb-8 md:pt-4 gap-6 overflow-hidden max-w-[1600px] mx-auto">
                    {user && <MyChats />}
                    {user && (
                        <ChatBox />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
