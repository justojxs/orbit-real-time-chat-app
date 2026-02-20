import { useChatStore } from "../store/useChatStore";
import SingleChat from "./SingleChat";
import WelcomeScreen from "./WelcomeScreen";

const ChatBox = ({ fetchAgain, setFetchAgain }: { fetchAgain: boolean, setFetchAgain: any }) => {
    const { selectedChat } = useChatStore();

    return (
        <div
            className={`${selectedChat ? "flex" : "hidden md:flex"} 
                items-center flex-col glass-panel w-full md:w-[68%] rounded-[2rem] border-white/5 h-full relative overflow-hidden`}
        >
            {selectedChat ? (
                <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
            ) : (
                <WelcomeScreen />
            )}
        </div>
    );
};

export default ChatBox;
