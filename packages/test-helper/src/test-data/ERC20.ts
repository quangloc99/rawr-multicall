import { CHAIN_ID_MAPPING } from '../chainId';

export const ERC20: Record<
    number,
    {
        blockNumber: number;
        tokenAddresses: string[];
        holders: string[];
    }
> = {
    [CHAIN_ID_MAPPING.ETHEREUM]: {
        blockNumber: 17670778,
        tokenAddresses: [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // usdc
            '0x808507121b80c02388fad14726482e061b8da827', // pendle
        ],
        holders: ['0xa3a7b6f88361f48403514059f1f16c8e78d60eec', '0x28c6c06298d514db089934071355e5743bf21d60'],
    },
    [CHAIN_ID_MAPPING.ARBITRUM]: {
        blockNumber: 110135034,
        tokenAddresses: [
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // usdt,
            '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8', // pendle
        ],
        holders: ['0xb38e8c17e38363af6ebdcb3dae12e0243582891d', '0xf89d7b9c864f589bbf53a82105107622b35eaa40'],
    },
};
