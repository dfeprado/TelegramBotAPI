import https from 'https';
import { GetUpdateResponse } from './Types/GetUpdateResponse';
import { Message } from './Types/Message';
import { newMessage } from './Types/SendMessage';

const TELEGRAM_BOT_API_URL_ENDPOINT = 'https://api.telegram.org/';

export class TelegramBotSvc {
    private baseUrl: string;
    private getUpdatesUrl: string;
    private sendMessageUrl: string;
    private updateOffset = 0;
    private knownUsers = new Set<number>();

    constructor(token: string) {
        this.baseUrl = `${TELEGRAM_BOT_API_URL_ENDPOINT}bot${token}`;
        this.getUpdatesUrl = `${this.baseUrl}/getUpdates?limit=10`;
        this.sendMessageUrl = `${this.baseUrl}/sendMessage`;

        this.getUpdates();
    }

    private getUpdates() {
        const offsetedUrl = this.updateOffset ? `${this.getUpdatesUrl}&offset=${this.updateOffset}` : this.getUpdatesUrl;
        https.get(offsetedUrl, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                this.parse(responseBody);
                this.getUpdates(); // TBot API uses long polling. So, we need to call a new request every time last one have finished.
            });

            res.on('error', (e) => {
                console.error(`Error while getting Telegram updates: ${e}`);
            });
        });
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

            this.knownUsers.add(update.message.chat.id);
            console.log(`New user ${update.message.chat.id}`);
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
            const message = JSON.stringify(newMessage(user, text));
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': message.length
                }
            };
            const req = https.request(this.sendMessageUrl, options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    console.log(`Message to ${user}: ${responseBody}`);
                });

                res.on('error', (e) => {
                    console.error(`Error while sending message to ${user}: ${e}`);
                });
            });

            req.write(message);
            req.end();
        }
    }
}
