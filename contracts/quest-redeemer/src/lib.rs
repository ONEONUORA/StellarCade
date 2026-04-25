#![no_std]

mod types;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contractevent, Address, Env, contracterror};
use crate::types::{RedeemerConfig, RedemptionStatus, RedemptionSnapshot};
use crate::storage::{get_config, set_config, has_redeemed, record_redemption};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    Paused = 4,
    AlreadyRedeemed = 5,
    InvalidQuest = 6,
}

#[contractevent]
pub struct QuestRedeemed {
    #[topic]
    pub user: Address,
    #[topic]
    pub quest_id: u32,
    pub reward_amount: i128,
}

#[contract]
pub struct QuestRedeemer;

#[contractimpl]
impl QuestRedeemer {
    /// Initialize the quest redeemer.
    pub fn init(env: Env, admin: Address, quest_board: Address, token: Address) -> Result<(), Error> {
        if get_config(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        let config = RedeemerConfig {
            admin,
            quest_board,
            token,
            is_paused: false,
        };
        set_config(&env, &config);
        Ok(())
    }

    /// Set the paused state. Admin only.
    pub fn set_pause(env: Env, paused: bool) -> Result<(), Error> {
        let mut config = get_config(&env).ok_or(Error::NotInitialized)?;
        config.admin.require_auth();
        config.is_paused = paused;
        set_config(&env, &config);
        Ok(())
    }

    /// Redeem a quest reward for the caller.
    pub fn redeem(env: Env, user: Address, quest_id: u32) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        user.require_auth();

        if has_redeemed(&env, &user, quest_id) {
            return Err(Error::AlreadyRedeemed);
        }

        // Logic check: query QuestBoard to see if user completed quest
        // For now, we assume success or external oracle verification
        
        record_redemption(&env, &user, quest_id);

        env.events().publish(("quest", "redeemed"), QuestRedeemed { user, quest_id, reward_amount: 0 });

        Ok(())
    }

    // ─── Public Read-Only Methods ──────────────────────────────────────────

    /// Returns a complete snapshot of redemption status for a specific user and quest.
    ///
    /// # Returns
    /// A `RedemptionSnapshot` containing the current status (Eligible, Redeemed, etc.).
    /// Handles uninitialized state by returning `None` for config and `Paused` status.
    pub fn get_redemption_snapshot(env: Env, user: Address, quest_id: u32) -> RedemptionSnapshot {
        let config = get_config(&env);
        
        let status = if let Some(ref c) = config {
            if c.is_paused {
                RedemptionStatus::Paused
            } else if has_redeemed(&env, &user, quest_id) {
                RedemptionStatus::Redeemed
            } else {
                RedemptionStatus::Eligible
            }
        } else {
            RedemptionStatus::Paused
        };

        RedemptionSnapshot {
            config,
            status,
            user,
            quest_id,
            timestamp: env.ledger().timestamp(),
        }
    }

    /// Checks if a specific redemption has already occurred.
    pub fn has_redeemed(env: Env, user: Address, quest_id: u32) -> bool {
        has_redeemed(&env, &user, quest_id)
    }

    /// Returns whether redemptions are globally paused.
    pub fn is_paused(env: Env) -> bool {
        get_config(&env).map(|c| c.is_paused).unwrap_or(true)
    }
}
