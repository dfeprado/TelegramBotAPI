import { Chat } from "../Types/Chat";

export default interface NewChatObserver {
    onNewChat(chat: Chat): Promise<void>
}