import { TelegramBotSvc } from './TelegramBot/TelegramBotSvc'
import NodeHTTPS from './Utils/NodeHTTPS'

function main() {
    const token = process.env.TBOT_TOKEN || ''
    if (!token) {
        console.error('No token found. Do you forget to set TBOT_TOKEN environment variable?')
        return
    }

    const tbot = new TelegramBotSvc(token, new NodeHTTPS())

    setTimeout(() => tbot.sendToAllUsers('Hello, World!'), 3000)
}

main()