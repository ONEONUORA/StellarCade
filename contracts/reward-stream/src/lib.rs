#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{StreamData, StreamHealthSummary, WithdrawalReadiness};

#[contract]
pub struct RewardStream;

#[contractimpl]
impl RewardStream {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
        }
    }

    pub fn configure_stream(
        env: Env,
        admin: Address,
        stream_id: u64,
        total_allocated: i128,
        total_withdrawn: i128,
        unlock_time: u64,
        paused: bool,
    ) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_stream(
                &env,
                &StreamData {
                    stream_id,
                    total_allocated,
                    total_withdrawn,
                    unlock_time,
                    paused,
                },
            );
        }
    }

    pub fn stream_health_summary(env: Env) -> StreamHealthSummary {
        if let Some(s) = storage::get_stream(&env) {
            StreamHealthSummary {
                is_configured: true,
                stream_id: s.stream_id,
                total_allocated: s.total_allocated,
                total_withdrawn: s.total_withdrawn,
                remaining: (s.total_allocated - s.total_withdrawn).max(0),
                paused: s.paused,
            }
        } else {
            StreamHealthSummary {
                is_configured: false,
                stream_id: 0,
                total_allocated: 0,
                total_withdrawn: 0,
                remaining: 0,
                paused: false,
            }
        }
    }

    pub fn withdrawal_readiness(env: Env, now: u64) -> WithdrawalReadiness {
        if let Some(s) = storage::get_stream(&env) {
            let remaining = (s.total_allocated - s.total_withdrawn).max(0);
            let unlocked = now >= s.unlock_time;
            let ready = !s.paused && unlocked && remaining > 0;
            let blocked_reason_code = if s.paused {
                1
            } else if !unlocked {
                2
            } else if remaining == 0 {
                3
            } else {
                0
            };
            WithdrawalReadiness {
                stream_id: s.stream_id,
                is_ready: ready,
                claimable_now: if ready { remaining } else { 0 },
                blocked_reason_code,
            }
        } else {
            WithdrawalReadiness {
                stream_id: 0,
                is_ready: false,
                claimable_now: 0,
                blocked_reason_code: 4,
            }
        }
    }
}
