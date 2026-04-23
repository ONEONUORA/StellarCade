#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Env as _};
use soroban_sdk::{Address, Env};

#[test]
fn test_get_utilization_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingPoolContract);
    let client = LendingPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    client.update_totals(&1000, &2000);

    let snapshot = client.get_utilization_snapshot();
    assert_eq!(snapshot.total_borrowed, 1000);
    assert_eq!(snapshot.total_supplied, 2000);
    assert_eq!(snapshot.utilization_rate, 5000); // 50%
}

#[test]
fn test_get_liquidation_buffer_missing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingPoolContract);
    let client = LendingPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let buffer = client.get_liquidation_buffer(&user);
    assert!(buffer.is_none());
}