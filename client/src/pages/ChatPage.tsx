import { useChatStore } from "../store/useChatStore";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const ChatPage = () => {
    const { user } = useChatStore();

    return (
        <div className="w-full h-screen flex flex-col bg-[#f7f8fa] text-gray-900 dark:text-white overflow-hidden relative font-sans">
            {/* Background image */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: 'url(/bg-mesh.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.5,
                }}
            />
            <div className="fixed inset-0 z-0 premium-bg pointer-events-none opacity-30"></div>

            <div className="relative z-10 w-full h-full flex flex-col">
                {user && <SideDrawer />}
                <div className="flex w-full flex-1 p-3 md:px-5 md:pb-5 md:pt-3 gap-4 overflow-hidden">
                    {user && <MyChats />}
                    {user && <ChatBox />}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
