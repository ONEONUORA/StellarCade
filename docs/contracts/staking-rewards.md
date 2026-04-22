# staking-rewards

Epoch-based staking rewards contract. Distributes reward tokens proportionally
to stakers based on their share of the total staked snapshot recorded at epoch
start.

## Public Methods

### `init`
Initialise the staking rewards contract.

```rust
pub fn init(env: Env, admin: Address, staking_token: Address, reward_token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `staking_token` | `Address` |
| `reward_token` | `Address` |

#### Return Type

`Result<(), Error>`

### `start_epoch`
Admin starts a new reward epoch by depositing `total_rewards` tokens.

```rust
pub fn start_epoch(env: Env, admin: Address, total_rewards: i128, end_timestamp: u64) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `total_rewards` | `i128` |
| `end_timestamp` | `u64` |

#### Return Type

`Result<u64, Error>` — the new epoch id.

### `stake`
Stake tokens to participate in current and future reward epochs.

```rust
pub fn stake(env: Env, staker: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `unstake`
Unstake tokens. Forfeits any unclaimed rewards in the active epoch.

```rust
pub fn unstake(env: Env, staker: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `claim_rewards`
Claim the staker's proportional share from the current epoch.

Reward formula: `(staked_amount * total_rewards) / total_staked_snapshot`
(integer division; any remainder remains as carry-over for the next epoch).

```rust
pub fn claim_rewards(env: Env, staker: Address) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |

#### Return Type

`Result<i128, Error>` — amount claimed.

### `end_epoch`
Admin closes the current epoch, preventing further claims.

```rust
pub fn end_epoch(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `reward_projection`
Return a deterministic reward projection for a staker in the current epoch.

All fields are safe for frontend polling. Returns zeroed values when no epoch
has been started yet. Rounding: integer division is used; fractional tokens
are truncated and remain as carry-over.

```rust
pub fn reward_projection(env: Env, staker: Address) -> RewardProjection
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |

#### Return Type

`RewardProjection`

#### `RewardProjection` Fields

| Field | Type | Description |
|-------|------|-------------|
| `epoch_id` | `u64` | Epoch this projection applies to (`0` before any epoch) |
| `staked_amount` | `i128` | Staker's current staked amount |
| `projected_reward` | `i128` | Projected share of current epoch rewards |
| `total_claimed` | `i128` | Rewards claimed across all previous epochs |
| `lifetime_projected_total` | `i128` | `projected_reward + total_claimed` |

### `epoch_summary`
Return a summary of the current epoch's accounting state.

`pending_carry_over` is the portion of epoch rewards not yet claimed.
Returns zeroed/default values when no epoch has started.

```rust
pub fn epoch_summary(env: Env) -> EpochSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`EpochSummary`

#### `EpochSummary` Fields

| Field | Type | Description |
|-------|------|-------------|
| `epoch_id` | `u64` | Current epoch id (`0` before any epoch) |
| `total_rewards` | `i128` | Total reward tokens allocated to this epoch |
| `distributed_rewards` | `i128` | Tokens already claimed in this epoch |
| `pending_carry_over` | `i128` | `total_rewards − distributed_rewards` |
| `total_staked_snapshot` | `i128` | Total staked at epoch start |
| `is_active` | `bool` | Whether the epoch is still accepting claims |
