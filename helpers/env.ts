import * as z from 'zod';
import { config } from 'dotenv';

config();

export const ENV_SCHEMA = z.object({
    BLOCK_NUMBER: z.coerce.number().optional(),
    CHAIN_ID: z.coerce.number(),
    ALL_CHAIN: z.coerce.boolean().optional(),
});

export type Env = z.infer<typeof ENV_SCHEMA>;
export const env = ENV_SCHEMA.parse(process.env);
