#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Role(Address, Symbol),
}

#[contractevent(topics = ["role_assigned"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleAssigned {
    #[topic]
    pub target: Address,
    #[topic]
    pub role: Symbol,
}

#[contractevent(topics = ["role_revoked"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleRevoked {
    #[topic]
    pub target: Address,
    #[topic]
    pub role: Symbol,
}

#[contract]
pub struct ContractRoleRegistry;

#[contractimpl]
impl ContractRoleRegistry {
    /// Initializes the contract with an admin.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Assigns a role to a given address. Requires admin authorization.
    pub fn assign_role(env: Env, target: Address, role: Symbol) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        let key = DataKey::Role(target.clone(), role.clone());
        if !env.storage().persistent().has(&key) {
            env.storage().persistent().set(&key, &());

            RoleAssigned { target, role }.publish(&env);
        }
    }

    /// Revokes a role. Requires admin authorization.
    pub fn revoke_role(env: Env, target: Address, role: Symbol) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        let key = DataKey::Role(target.clone(), role.clone());
        if env.storage().persistent().has(&key) {
            env.storage().persistent().remove(&key);

            RoleRevoked { target, role }.publish(&env);
        }
    }

    /// Public query method verifying if the target has the specific role.
    pub fn has_role(env: Env, target: Address, role: Symbol) -> bool {
        env.storage().persistent().has(&DataKey::Role(target, role))
    }

    /// Retrieves the current admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized")
    }
    /// Assigns multiple roles in bulk. Requires admin authorization.
    pub fn bulk_assign_role(env: Env, assignments: Vec<(Address, Symbol)>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        for (target, role) in assignments.into_iter() {
            let key = DataKey::Role(target.clone(), role.clone());
            if !env.storage().persistent().has(&key) {
                env.storage().persistent().set(&key, &());
                RoleAssigned { target, role }.publish(&env);
            }
        }
    }

    /// Revokes multiple roles in bulk. Requires admin authorization.
    pub fn bulk_revoke_role(env: Env, revocations: Vec<(Address, Symbol)>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        for (target, role) in revocations.into_iter() {
            let key = DataKey::Role(target.clone(), role.clone());
            if env.storage().persistent().has(&key) {
                env.storage().persistent().remove(&key);
                RoleRevoked { target, role }.publish(&env);
            }
        }
    }
}
#[cfg(test)]
mod test;
