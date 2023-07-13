import * as z from 'zod';
import { config } from 'dotenv';

config();

export const TEST_ENV_SCHEMA = z.object({
    BLOCK_NUMBER: z.coerce.number().optional(),
    CHAIN_ID: z.coerce.number().optional(),
});

export type TestEnv = z.infer<typeof TEST_ENV_SCHEMA>;
export const testEnv = TEST_ENV_SCHEMA.parse(process.env);
