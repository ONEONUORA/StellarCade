# jackpot-pool

Shared prize pool contract that tracks contributor shares and exposes
read-only snapshots for frontend pool health and next-draw funding status.

## Round Lifecycle

1. Admin calls `init` with a token and minimum draw target.
2. Contributors call `contribute` to add tokens to the pool.
3. Frontend polls `contributor_breakdown` and `funding_snapshot` to show
   live pool health without any off-chain aggregation.
4. Admin calls `reset_round` after a payout to clear round accounting.

## Public Methods

### `init`
Initialise the jackpot pool.

```rust
pub fn init(env: Env, admin: Address, token: Address, min_draw_target: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |
| `min_draw_target` | `i128` |

#### Return Type

`Result<(), Error>`

### `contribute`
Contribute tokens to the jackpot pool.

Tracks per-address totals, global totals, and the top contributor.

```rust
pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contributor` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `reset_round`
Admin resets the pool after a payout. Clears contribution counters for the
round; the round number is incremented.

```rust
pub fn reset_round(env: Env, admin: Address) -> Result<u32, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<u32, Error>` — new round number.

### `contributor_breakdown`
Return aggregated contributor metrics for the current round.

`top_contributor_share_bps` is computed as
`(top_contribution × 10_000) / total_contributed` (integer division).
Returns zeroed fields when the pool has not been seeded.

```rust
pub fn contributor_breakdown(env: Env) -> ContributorSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ContributorSummary`

#### `ContributorSummary` Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_contributed` | `i128` | Total tokens contributed this round |
| `contributor_count` | `u32` | Unique contributor addresses this round |
| `top_contributor_share_bps` | `u32` | Top contributor's share in basis points (0–10_000) |

### `funding_snapshot`
Return a funding snapshot for the next draw.

`shortfall` is `max(0, minimum_target − current_funded)`.
`is_funded` is `true` when `current_funded >= minimum_target` and
`minimum_target > 0`.

```rust
pub fn funding_snapshot(env: Env) -> FundingSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`FundingSnapshot`

#### `FundingSnapshot` Fields

| Field | Type | Description |
|-------|------|-------------|
| `minimum_target` | `i128` | Minimum tokens needed to trigger a draw |
| `current_funded` | `i128` | Tokens currently held in the pool |
| `shortfall` | `i128` | Tokens still needed to reach `minimum_target` |
| `is_funded` | `bool` | `true` when fully funded |
