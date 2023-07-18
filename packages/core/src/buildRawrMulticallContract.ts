import { Call } from './Call';
import { Bytes, hexToBytes, toBytes, utf8ToBytes } from './Bytes';
import * as ins from './instructions';
import { buildContract, InstructionContextParams } from './buildContract';
import { SIGN_BIT, LENGTH_SHIFT, LENGTH_SIZE_bytes, FREE_MEMORY_START, AddressZero } from './constants';
import { CalldataJoiner, groupedCalldataJoiner } from './CalldataJoiner';
import { prefixSum, zip } from './util';
import { assertDefined, NoPredeployContractError } from './errors';
import { Address, LabeledAddress, RawAddressString, calculateCreateAddress, calculateCreate2Address } from './Address';
import { registeredPredeployContracts } from './registerPredeployContract';
import { BuildRawrMulticallContext } from './BuildRawrMulticallContext';
import { keccak256 } from 'ethereum-cryptography/keccak';
// import { generateAddress, generateAddress2 } from '@ethereumjs/util';

export type BuildRawrMulticallContractParams = InstructionContextParams & {
    calldataJoiner?: CalldataJoiner;
    predeployContracts?: Partial<Record<LabeledAddress['label'], Bytes | string>>;
    create2SaltPrefix?: string;
    sender?: {
        from?: RawAddressString;
        nonce?: number;
    };
};

export function buildRawrMulticallContract<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    params?: BuildRawrMulticallContractParams
) {
    const { instructions, totalValue } = buildRawMulticallInstructions(calls, params);
    const contractData = buildContract(instructions, params);
    return {
        ...contractData,
        totalValue,
    };
}

export function buildRawMulticallInstructions<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    params?: BuildRawrMulticallContractParams
): { instructions: ins.Instruction[]; totalValue: number } {
    const {
        calldataJoiner = groupedCalldataJoiner,
        predeployContracts = {},
        sender: { from: senderAddress = AddressZero, nonce: senderNonce = 0 } = {},
        create2SaltPrefix = 'rawr-multicall:',
    } = params ?? {};

    const contractAddress = calculateCreateAddress(toBytes(senderAddress), senderNonce);

    const instructions: ins.Instruction[] = [];

    const lookupPredeployContract = (label: LabeledAddress['label']) =>
        toBytes(
            assertDefined(
                predeployContracts[label] ?? registeredPredeployContracts[label],
                () => new NoPredeployContractError(label)
            )
        );

    const context: BuildRawrMulticallContext = {
        getBuildingContractAddress: () => contractAddress,
        getLabeledAddressSalt: (label) => keccak256(utf8ToBytes(create2SaltPrefix + label)),
        getLabeledAddress: (label: LabeledAddress['label']) =>
            calculateCreate2Address(
                contractAddress,
                lookupPredeployContract(label),
                context.getLabeledAddressSalt(label)
            ),
        resolveAddress: (address) =>
            typeof address === 'string'
                ? hexToBytes(address)
                : address instanceof Uint8Array
                ? address
                : address.type === 'string'
                ? address.address
                : context.getLabeledAddress(address.label),
    };

    const LABELS = {
        // This label will be pushed in the very end.
        dataStart: 'data-start',
    };

    // extract data here to avoid multiple calls
    const callsData = calls.map((call) => ({
        data: call.getData(context),
        contractAddress: call.getContractAddress(context),
        gasLimit: call.getGasLimit(context),
        value: call.getValue(context),
        dependentLabeledContract: call.getDependentLabeledContract?.(context) ?? [],
    }));
    const uniqueLabels = Array.from(
        new Set(
            callsData.flatMap(({ contractAddress, dependentLabeledContract }) =>
                dependentLabeledContract.concat(contractAddress.type == 'labeled' ? [contractAddress.label] : [])
            )
        )
    );
    const usedPredeployContracts = new Map<LabeledAddress['label'], { bytecode: Bytes; id: number }>(
        uniqueLabels.map((label, id) => {
            const bytecode = lookupPredeployContract(label);
            return [label, { bytecode, id }];
        })
    );

    const joinedCalldata = calldataJoiner.join(callsData.map(({ data }) => data));
    const joinedPredeployContractsByteCode = calldataJoiner.join(
        Array.from(usedPredeployContracts.values(), ({ bytecode }) => bytecode)
    );
    const totalDataSize = joinedCalldata.result.length + joinedPredeployContractsByteCode.result.length;

    // memory layout
    const [predeployContractBytecodeOffset, dataOffset, RETURN_DATA_START] = prefixSum([
        FREE_MEMORY_START,
        joinedPredeployContractsByteCode.result.length,
        joinedCalldata.result.length,
    ]);

    // copy ALL data to memory
    // use CODECOPY as the data will be appended right after the creation code.
    instructions.push(
        ins.PUSH_NUMBER(totalDataSize), // size
        ins.PUSH_LABEL('data-start'), // offset. This label is mark at the end of this function.
        ins.PUSH_NUMBER(FREE_MEMORY_START), // destOffset
        ins.CODECOPY
    );

    // deploy contract
    for (const [label, { offset, size }] of zip(
        usedPredeployContracts.keys(),
        joinedPredeployContractsByteCode.parts
    )) {
        // deploy contract
        instructions.push(
            ins.PUSH(context.getLabeledAddressSalt(label)), // salt
            ins.PUSH_NUMBER(size), // size
            ins.PUSH_NUMBER(offset + predeployContractBytecodeOffset), // offset
            ins.PUSH0, // value
            ins.CREATE2,
            // we don't need the contract address. We can inject the create2 address
            ins.POP
        );
    }

    // convenient constant(s)
    instructions.push(ins.PUSH_NUMBER(SIGN_BIT), ins.PUSH_NUMBER(LENGTH_SHIFT), ins.PUSH_NUMBER(LENGTH_SIZE_bytes));

    // manipulate this number on stack instead of loading right from memory
    instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));

    // we maintain the end of the current return data
    // stack: [sign_bit, length_shift, length_size, return_data_end]

    const wrappedPushAddress = (addr: Address) => {
        if (addr.type == 'string') return [ins.PUSH_ADDRESS(addr.address)];
        return [ins.PUSH_ADDRESS(context.getLabeledAddress(addr.label))];
    };

    for (const [callData, currentPart] of zip(callsData, joinedCalldata.parts)) {
        const curDataOffset = dataOffset + currentPart.offset;
        const curDataSize = currentPart.size;

        // stack: [sign_bit, length_shift, length_size, return_data_end]
        const gasLimit = callData.gasLimit;
        const value = callData.value;

        // make call
        instructions.push(
            ins.PUSH0, // retSize
            ins.PUSH0, // retOffset
            ins.PUSH_NUMBER(curDataSize), // argsSize
            ins.PUSH_NUMBER(curDataOffset), // argsOffset
            ins.PUSH_NUMBER(value), // value
            ...wrappedPushAddress(callData.contractAddress),
            gasLimit == undefined ? ins.GAS : ins.PUSH_NUMBER(gasLimit), // gas
            ins.CALL
        );

        // stack: [sign_bit, length_shift, length_size, return_data_end, call_success]

        // write call_success + result length
        {
            // shift call_success to be the most significant bit
            instructions.push(
                ins.DUP(5), // shift=sign_bit
                ins.SHL
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success]

            instructions.push(ins.RETURNDATASIZE);
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success, current_return_data_size]

            // shift current_return_data_size to fit LENGTH_SIZE
            instructions.push(
                ins.DUP(5), // shift=length_shift
                ins.SHL
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success, shifted_current_return_data_size]

            // combine
            instructions.push(ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end, shifted_call_success + shifted_current_return_data_size]

            // write
            instructions.push(
                ins.DUP(2), // offset=return_data_end
                ins.MSTORE
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end]

            // increase return_data_end by 32
            instructions.push(ins.DUP(2), ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end]
        }

        // write the return data to memory
        {
            instructions.push(
                ins.RETURNDATASIZE, // size
                ins.PUSH0, // offset
                ins.DUP(3), // destOffset = return_data_end
                ins.RETURNDATACOPY
            );
            // stack: [sign_bit, length_shift, length_size, return_data_end]

            // Data is written. Increase return_data_end.
            instructions.push(ins.RETURNDATASIZE, ins.ADD);
            // stack: [sign_bit, length_shift, length_size, return_data_end]
        }

        // The stack state **should** be the same as the beginning of the cycle.
    }

    // stack: [sign_bit, length_shift, length_size, return_data_end]

    // return the result
    {
        // get the size
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START), ins.SWAP(1), ins.SUB);
        // stack: [sign_bit, length_shift, length_size, return_data_size]
        instructions.push(ins.PUSH_NUMBER(RETURN_DATA_START));
        // stack: [sign_bit, length_shift, length_size, return_data_size, start_of_return_data]
        instructions.push(ins.RETURN);
        // stack: [sign_bit, length_shift, length_size]
    }

    instructions.push(ins.LABEL(LABELS.dataStart, { isEmpty: true }));
    instructions.push(ins.VERBATIM(joinedPredeployContractsByteCode.result));
    instructions.push(ins.VERBATIM(joinedCalldata.result));

    const totalValue = callsData.map(({ value }) => value).reduce((a, b) => a + b, 0);
    return { instructions, totalValue };
}
