export interface SendMessage {
    chat_id: number;
    text: string;
}

export function newMessage(chatID: number, text: string): SendMessage {
    const r = {} as SendMessage
    r.chat_id = chatID
    r.text = text

    return r
}