export interface EnergyPerTransaction {
    hash: string;
    size: number;
    energyKwh: number;
}

export interface RawBlock {
    hash: string;
    ver: number;
    prev_block: string;
    mrkl_root: string;
    time: number;
    bits: number;
    fee: number;
    nonce: number;
    n_tx: number;
    size: number;
    block_index: number;
    main_chain: boolean;
    height: number;
    weight: number;
    tx: Transaction[];
    next_block?: string[];
}

interface Transaction {
    hash: string;
    ver: number;
    vin_sz: number;
    vout_sz: number;
    size: number;
    weight?: number;
    fee?: number;
    relayed_by?: string;
    lock_time: number;
    tx_index: number;
    double_spend: boolean;
    time: number;
    inputs: TxInput[];
    out: TxOutput[];
}

interface TxInput {
    sequence: number;
    witness?: string;
    script: string;
    index?: number;
    prev_out?: TxOutput;
}

interface TxOutput {
    type?: number;
    spent: boolean;
    value: number;
    spending_outpoints?: SpendingOutpoint[];
    n: number;
    tx_index: number;
    script: string;
    addr?: string;
}

interface SpendingOutpoint {
    n: number;
    tx_index: number;
}

export interface BlockSummary {
    hash: string;
    height: number;
    time: number; // Timestamp
    block_index: number;
};

export interface DailyEnergyUsage {
    date: string;
    totalEnergyKwh: number;
}

export enum CachableComponents {
    Block = "block",
    DailyBlocks = "dailyBlocks",
    DailySummary = "dailySummary",
}

export type CacheCountResponse = { count: number };