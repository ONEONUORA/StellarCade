#![no_std]

use soroban_sdk::{contracttype, Address, Env, Vec};

// Types for lending-pool contract

#[contracttype]
pub struct UtilizationSnapshot {
    pub total_borrowed: i128,
    pub total_supplied: i128,
    pub utilization_rate: u32, // in basis points
}

#[contracttype]
pub struct LiquidationBuffer {
    pub user: Address,
    pub buffer_amount: i128,
    pub is_safe: bool,
}