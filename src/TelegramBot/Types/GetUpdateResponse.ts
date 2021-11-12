import { Update } from './Update';

export interface GetUpdateResponse {
    ok: boolean;
    description?: string;
    result: Update[];
}
