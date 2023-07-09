import { buildRawMulticallContract, createCall } from '../src';
import { Interface, JsonRpcProvider, ethers } from 'ethers';
import { ERC20Abi } from './abi';

describe('buildRawMulticallContract', () => {
    let provider: JsonRpcProvider;

    beforeAll(() => {
        provider = new JsonRpcProvider();
    });

    describe('erc20', () => {
        const iface = new Interface(ERC20Abi);
        const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const pendle = '0x808507121b80c02388fad14726482e061b8da827';

        const holder = ['0xa3a7b6f88361f48403514059f1f16c8e78d60eec', '0x28c6c06298d514db089934071355e5743bf21d60'];

        it('simple', async () => {
            const callData = iface.encodeFunctionData('balanceOf', [holder[0]]);
            const sendData = buildRawMulticallContract([createCall(pendle, callData)]);
            expect(callData).toMatchSnapshot();
            expect(sendData).toMatchSnapshot();
            const res = await provider.call({
                data: sendData.byteCode,
            });
            expect(res).toMatchSnapshot();
        });
    });
});
