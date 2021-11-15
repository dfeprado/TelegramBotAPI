import { TelegramBotSvc } from './TelegramBot/TelegramBotSvc'
import { Chat } from './TelegramBot/Types/Chat'
import NodeHTTPS from './Utils/NodeHTTPS'
import {Client} from 'pg'

async function main() {
    const token = process.env.TBOT_TOKEN || ''
    if (!token) {
        console.error('No token found. Do you forget to set TBOT_TOKEN environment variable?')
        return
    }

    const pgClient = await connectPG()
    pgClient.query('listen db_change;')

    const tbot = new TelegramBotSvc(token, new NodeHTTPS(), {
        async onNewChat(chat: Chat) {
            console.log(`New user with chat id: ${chat.id}`)
            try {
                await pgClient.query('insert into chat(id) values ($1)', [chat.id])
            } catch(e) {
                console.error(`Error inserting chat: ${e}`)
            }
        }
    })

    setOnDBChange(pgClient, tbot)
}

async function connectPG(): Promise<Client> {
    const cli = new Client()
    cli.on('error', e => console.log(e))
    cli.connect()
    return cli
}

function setOnDBChange(pgClient: Client, telegramBot: TelegramBotSvc) {
    pgClient.on('notification', async msg => {
        // There's only one channel. So, I do not validate it.

        if (!msg.payload)
            return

        const info = msg.payload?.split(':')
        try {
            let qryRes = await pgClient.query(`
                select to_json(t) as client
                from (
                    select id, name, employees_quantity, register_timestamp
                    from client
                    where id = $1
                ) t`,
                [info[1]]
            )

            // I do not validate if there's a result, cuz here it will exists, 100% sure!
            const client = JSON.stringify(qryRes.rows[0]['client'])

            // notify every chat about the client insertion/update
            qryRes = await pgClient.query(`select id from chat`)
            qryRes.rows.forEach(r => {
                telegramBot.sendMessage(r['id'], client)
            })
        }
        catch(e) {
            console.error(`Error while querying client: ${e}`)
        }
    })
}

main();