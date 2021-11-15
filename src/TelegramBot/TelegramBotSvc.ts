import HTTPS from './AbstractDependencies/HTTPS';
import NewChatObserver from './AbstractDependencies/NewChatObserver';
import { GetUpdateResponse } from './Types/GetUpdateResponse';
import { Message } from './Types/Message';

const TELEGRAM_BOT_API_URL_ENDPOINT = 'https://api.telegram.org/';

/**
 * Sending message type
 */
interface SendMessage {
    chat_id: number;
    text: string;
}

/**
 * Sending message type builder
 * @param chatID Desired chat destination
 * @param text Desired message content
 * @returns SendMessage type
 */
function SendMessage(chatID: number, text: string): SendMessage {
    const r = {} as SendMessage
    r.chat_id = chatID
    r.text = text

    return r
}

export class TelegramBotSvc {
    private baseUrl: string;
    private getUpdatesUrl: string;
    private sendMessageUrl: string;
    private updateOffset = 0;
    private knownUsers = new Set<number>();
    private httpClient: HTTPS
    private newChatObserver: NewChatObserver

    constructor(token: string, httpClient: HTTPS, newChatObserver: NewChatObserver) {
        this.baseUrl = `${TELEGRAM_BOT_API_URL_ENDPOINT}bot${token}`;
        this.getUpdatesUrl = `${this.baseUrl}/getUpdates?limit=10`;
        this.sendMessageUrl = `${this.baseUrl}/sendMessage`;

        this.httpClient = httpClient
        this.newChatObserver = newChatObserver

        this.getUpdates();
    }

    private async getUpdates() {
        const offsetedUrl = this.updateOffset ? `${this.getUpdatesUrl}&offset=${this.updateOffset}` : this.getUpdatesUrl;
        try {
            const res = await this.httpClient.get(offsetedUrl)
            this.parse(res.content)
            this.getUpdates() // TBot API uses long polling. So, we need to call a new request at every end of last request
        }
        catch (e) {
            console.error(`Error while getting Telegram updates: ${e}`)
        }
    }

    private parse(update: string) {
        try {
            const json = JSON.parse(update);
            this.getNewUsers(json);
        }
        catch (e) {
            console.error(`Error while parsing update content: ${e}`);
        }
    }

    private getNewUsers(content: GetUpdateResponse) {
        if (!content.ok) {
            console.error(content.description);
            return;
        }

        if (!content.result.length)
            return;

        for (const update of content.result) {
            if (!update.message || !this.isStartMessage(update.message))
                continue;

            this.newChatObserver.onNewChat(update.message.chat)
            // this.knownUsers.add(update.message.chat.id);
            // console.log(`New user ${update.message.chat.id}`);
        }

        this.setUpdateOffset(content);
    }

    private isStartMessage(msg: Message) {
        return msg.text === '/start';
    }

    private setUpdateOffset(content: GetUpdateResponse) {
        this.updateOffset = content.result[content.result.length - 1].update_id + 1;
    }

    sendToAllUsers(text: string) {
        for (const user of this.knownUsers) {
            const message = JSON.stringify(SendMessage(user, text));
            this.httpClient.post(
                this.sendMessageUrl, 
                {'Content-Type': 'application/json', 'Content-Length': message.length}, 
                message
            ).then(res => {
                    console.log(`Message to user ${user}: ${res}`)
            }).catch(e => {
                    console.error(`Error while sending message to ${user}: ${e}`)
            })
        }
    }
}