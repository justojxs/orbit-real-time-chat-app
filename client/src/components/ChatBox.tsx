import { useChatStore } from "../store/useChatStore";
import SingleChat from "./SingleChat";
import WelcomeScreen from "./WelcomeScreen";

const ChatBox = () => {
    const { selectedChat } = useChatStore();

    return (
        <div
            className={`${selectedChat ? "flex" : "hidden md:flex"} 
                items-center flex-col w-full md:w-[68%] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm border border-gray-200/60 dark:border-white/[0.04] rounded-2xl h-full relative overflow-hidden shadow-sm`}
        >
            {selectedChat ? (
                <SingleChat />
            ) : (
                <WelcomeScreen />
            )}
        </div>
    );
};

export default ChatBox;
