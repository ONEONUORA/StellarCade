#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;

use storage::*;
use types::*;

// Contract

#[contract]
pub struct LendingPoolContract;

#[contractimpl]
impl LendingPoolContract {
    // Initialize
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        set_admin(&env, &admin);
    }

    // Accessor for utilization snapshot
    pub fn get_utilization_snapshot(env: Env) -> UtilizationSnapshot {
        let borrowed = get_total_borrowed(&env);
        let supplied = get_total_supplied(&env);
        let utilization_rate = if supplied > 0 {
            ((borrowed as u64 * 10000) / supplied as u64) as u32
        } else {
            0
        };
        UtilizationSnapshot {
            total_borrowed: borrowed,
            total_supplied: supplied,
            utilization_rate,
        }
    }

    // Accessor for liquidation buffer
    pub fn get_liquidation_buffer(env: Env, user: Address) -> Option<LiquidationBuffer> {
        get_liquidation_buffer(&env, &user)
    }

    // Write functions
    pub fn update_totals(env: Env, borrowed: i128, supplied: i128) {
        set_total_borrowed(&env, borrowed);
        set_total_supplied(&env, supplied);
    }

    pub fn set_liquidation_buffer(env: Env, user: Address, buffer: LiquidationBuffer) {
        set_liquidation_buffer(&env, &user, &buffer);
    }
}