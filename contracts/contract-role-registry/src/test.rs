#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{symbol_short, Env};

#[test]
fn test_init_and_admin() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_already_initialized() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_role_assignment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    assert_eq!(client.has_role(&target, &role), false);

    client.assign_role(&target, &role);
    assert_eq!(client.has_role(&target, &role), true);

    client.revoke_role(&target, &role);
    assert_eq!(client.has_role(&target, &role), false);
}

#[test]
#[should_panic]
fn test_unauthorized_assignment() {
    let env = Env::default();
    // Do not mock auths: require_auth() should fail.

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    // This should panic because admin auth is missing.
    client.assign_role(&target, &role);
}
#[test]
fn test_bulk_role_assignment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target1 = Address::generate(&env);
    let target2 = Address::generate(&env);
    let role1 = symbol_short!("GAME");
    let role2 = symbol_short!("ADMIN");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let mut assignments = soroban_sdk::Vec::new(&env);
    assignments.push_back((target1.clone(), role1.clone()));
    assignments.push_back((target2.clone(), role2.clone()));

    assert_eq!(client.has_role(&target1, &role1), false);
    assert_eq!(client.has_role(&target2, &role2), false);

    client.bulk_assign_role(&assignments);

    assert_eq!(client.has_role(&target1, &role1), true);
    assert_eq!(client.has_role(&target2, &role2), true);

    client.bulk_revoke_role(&assignments);

    assert_eq!(client.has_role(&target1, &role1), false);
    assert_eq!(client.has_role(&target2, &role2), false);
}

#[test]
#[should_panic]
fn test_unauthorized_bulk_assignment() {
    let env = Env::default();
    // Do not mock auths: require_auth() should fail.

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let mut assignments = soroban_sdk::Vec::new(&env);
    assignments.push_back((target, role));

    // This should panic because admin auth is missing.
    client.bulk_assign_role(&assignments);
}
