#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (StreakLadderClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(StreakLadder, ());
    let client = StreakLadderClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn bucket_summary_and_demotion_risk_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_600);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &3, &10, &25, &1_000, &false);
    client.assign_player(&admin, &user, &3, &14, &1_000);

    let summary = client.streak_bucket_summary(&3);
    assert!(summary.exists);
    assert_eq!(summary.state, BucketState::Active);
    assert_eq!(summary.player_count, 1);
    assert_eq!(summary.min_streak, 10);

    let risk = client.demotion_risk(&user);
    assert!(risk.player_found);
    assert!(risk.bucket_found);
    assert_eq!(risk.bucket_id, 3);
    assert_eq!(risk.demotion_at, 2_000);
    assert_eq!(risk.seconds_until_demotion, 400);
    assert_eq!(risk.risk_level, DemotionRiskLevel::Low);
    assert!(!risk.would_demote_now);
}

#[test]
fn paused_bucket_and_missing_player_reads_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_500);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &8, &5, &9, &400, &false);
    client.assign_player(&admin, &user, &8, &6, &1_300);
    client.upsert_bucket(&admin, &8, &5, &9, &400, &true);

    let summary = client.streak_bucket_summary(&8);
    assert_eq!(summary.state, BucketState::Paused);

    let blocked = client.demotion_risk(&user);
    assert_eq!(blocked.risk_level, DemotionRiskLevel::Blocked);
    assert!(blocked.bucket_paused);

    let other_user = Address::generate(&env);
    let missing = client.demotion_risk(&other_user);
    assert!(!missing.player_found);
    assert_eq!(missing.bucket_id, 0);
}
