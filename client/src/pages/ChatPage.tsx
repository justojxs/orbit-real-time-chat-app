import { useChatStore } from "../store/useChatStore";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const ChatPage = () => {
    const { user } = useChatStore();

    return (
        <div className="flex w-full h-screen bg-[#f7f8fa] dark:bg-[#08080c] text-gray-900 dark:text-white font-sans selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-hidden flex-col">
            {/* Background image - Light Mode */}
            <div
                className="fixed inset-0 z-0 pointer-events-none dark:hidden"
                style={{
                    backgroundImage: 'url(/bg-mesh.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.7,
                }}
            />

            {/* Background gradients - Dark Mode */}
            <div className="fixed inset-0 z-0 pointer-events-none hidden dark:block">
                <div className="absolute top-0 left-[-20%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[80px]" />
            </div>

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
