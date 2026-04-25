use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ClaimWindowState {
    NotConfigured,
    Missing,
    Scheduled,
    Open,
    Closed,
    Paused,
}

/// Storage-backed campaign accounting used by the window and exhaustion reads.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignRecord {
    pub campaign_id: u64,
    pub budget: i128,
    pub committed_budget: i128,
    pub claimed_budget: i128,
    pub remaining_budget: i128,
    pub starts_at: u64,
    pub ends_at: u64,
    pub paused: bool,
    pub pending_claimants: u32,
    pub total_claims: u32,
}

/// Read model for frontend window banners and backend polling.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimWindowSummary {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub now: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub budget: i128,
    pub remaining_budget: i128,
    pub pending_claimants: u32,
    pub total_claims: u32,
}

/// Read model describing how close a campaign budget is to full exhaustion.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BudgetExhaustion {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub paused: bool,
    pub budget: i128,
    pub committed_budget: i128,
    pub claimed_budget: i128,
    pub remaining_budget: i128,
    pub exhaustion_bps: u32,
    pub can_record_claims: bool,
}
