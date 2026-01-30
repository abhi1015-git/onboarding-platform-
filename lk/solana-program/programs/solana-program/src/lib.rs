use anchor_lang::prelude::*;

declare_id!("9sYR8qpGVRQoVH9iA4MfSnArdDQtQq3wTopD6nSBiBbg");

// The Operational Wallet Public Key (The Runner)
const OPERATIONAL_AUTHORITY: &str = "8JH6NqkLfQVJQajGnGtoHMwBbgQguBKHbrCDH9ywiizd";

#[program]
pub mod solana_program {
    use super::*;

    pub fn initialize_employee(ctx: Context<InitializeEmployee>, employee_hash: [u8; 32], company_id: String) -> Result<()> {
        let employee = &mut ctx.accounts.employee_account;
        employee.employee_hash = employee_hash;
        employee.company_id = company_id;
        employee.onboarding_status = OnboardingStatus::Pending;
        employee.created_at = Clock::get()?.unix_timestamp;
        employee.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn record_document_proof(ctx: Context<RecordDocumentProof>, document_hash: [u8; 32]) -> Result<()> {
        let proof = &mut ctx.accounts.document_proof;
        proof.document_hash = document_hash;
        proof.verified = false;
        proof.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(employee_hash: [u8; 32], company_id: String)]
pub struct InitializeEmployee<'info> {
    #[account(
        init,
        seeds = [b"employee", employee_hash.as_ref()],
        bump,
        payer = authority,
        // Space calculation: 8 (discriminator) + 32 (hash) + 64 (max string) + 1 (enum) + 8 (timestamp) + 32 (pubkey)
        space = 8 + 32 + 64 + 1 + 8 + 32
    )]
    pub employee_account: Account<'info, EmployeeAccount>,
    
    #[account(
        mut,
        constraint = authority.key().to_string() == OPERATIONAL_AUTHORITY @ ErrorCode::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(document_hash: [u8; 32])]
pub struct RecordDocumentProof<'info> {
    #[account(
        init,
        seeds = [b"proof", document_hash.as_ref()],
        bump,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 32 + 8
    )]
    pub document_proof: Account<'info, DocumentProof>,
    
    #[account(
        mut,
        constraint = authority.key().to_string() == OPERATIONAL_AUTHORITY @ ErrorCode::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct EmployeeAccount {
    pub employee_hash: [u8; 32],
    pub company_id: String,
    pub onboarding_status: OnboardingStatus,
    pub created_at: i64,
    pub authority: Pubkey,
}

#[account]
pub struct DocumentProof {
    pub employee_hash: [u8; 32],
    pub document_hash: [u8; 32], 
    pub verified: bool,
    pub verified_by: Pubkey,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OnboardingStatus {
    Pending,
    Verified,
    Rejected,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Only the authorized Operational Wallet (The Runner) can perform this action.")]
    UnauthorizedSigner,
}
