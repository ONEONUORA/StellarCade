# contract-role-registry

## Public Methods

### `init`
Initializes the contract with an admin.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `assign_role`
Assigns a role to a given address. Requires admin authorization.

```rust
pub fn assign_role(env: Env, target: Address, role: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

### `revoke_role`
Revokes a role. Requires admin authorization.

```rust
pub fn revoke_role(env: Env, target: Address, role: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

### `has_role`
Public query method verifying if the target has the specific role.

```rust
pub fn has_role(env: Env, target: Address, role: Symbol) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

#### Return Type

`bool`

### `get_admin`
Retrieves the current admin address.

```rust
pub fn get_admin(env: Env) -> Address
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Address`

### `bulk_assign_role`
Assigns multiple roles in bulk. Requires admin authorization.

```rust
pub fn bulk_assign_role(env: Env, assignments: Vec<(Address, Symbol)>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `assignments` | `Vec<(Address` |

### `bulk_revoke_role`
Revokes multiple roles in bulk. Requires admin authorization.

```rust
pub fn bulk_revoke_role(env: Env, revocations: Vec<(Address, Symbol)>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `revocations` | `Vec<(Address` |

