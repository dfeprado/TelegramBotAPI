export interface HTTPSResponse {
    status: number
    content: string
}

export interface HTTPSHeaders {
    [name: string]: string | number
}

export default interface HTTPS {
    get(url: string): Promise<HTTPSResponse>
    post(url: string, headers: HTTPSHeaders, body: string): Promise<HTTPSResponse>
}