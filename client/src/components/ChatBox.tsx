import { useChatStore } from "../store/useChatStore";
import SingleChat from "./SingleChat";
import WelcomeScreen from "./WelcomeScreen";

const ChatBox = () => {
    const { selectedChat } = useChatStore();

    return (
        <div
            className={`${selectedChat ? "flex" : "hidden md:flex"} 
                items-center flex-col glass-panel w-full md:w-[68%] rounded-[2rem] border-white/5 h-full relative overflow-hidden`}
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
