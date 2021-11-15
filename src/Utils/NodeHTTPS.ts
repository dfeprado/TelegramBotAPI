import HTTPS, {HTTPSHeaders, HTTPSResponse} from "../TelegramBot/AbstractDependencies/HTTPS";
import https from 'https'

export default class NodeHTTPS implements HTTPS {
    get(url: string): Promise<HTTPSResponse> {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let responseBody = '';
    
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
    
                res.on('end', () => {
                    resolve({status: res.statusCode || 0, content: responseBody})
                });
    
                res.on('error', (e) => {
                    reject(new Error(`Error while getting Telegram updates: ${e}`));
                });
            });
        })
    }
    
    post(url: string, headers: HTTPSHeaders, body: string): Promise<HTTPSResponse> {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                headers
            };

            const req = https.request(url, options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
    
                res.on('end', () => {
                    resolve({status: res.statusCode || 0, content: responseBody})
                });
    
                res.on('error', (e) => {
                    reject(new Error(`Error while posting: ${e}`))
                });
            });
    
            req.write(body);
            req.end();
        })
    }

}