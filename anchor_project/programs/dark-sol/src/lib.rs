use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};

declare_id!("CF1x7n8CDcjwJcRfPwDCecqqR2PNAmV7f79zPPU9rPip");

#[program]
mod dark_sol {
    use super::*;

    pub fn initialize(_ctx: Context<Init>) -> Result<()> {
        Ok(())
    }

    pub fn init_user(_ctx: Context<NewUser>) -> Result<()> {
        Ok(())
    }

    pub fn stake(ctx: Context<StakeUnstake>, deposit_amount: u64) -> Result<()> {
        let receipt = &mut ctx.accounts.receipt;
        if receipt.is_valid == 0 {
            receipt.is_valid = 1;
            receipt.created_ts = ctx.accounts.clock.unix_timestamp;
            receipt.amount_deposited = deposit_amount;
        } else {
            return Err(ErrorCode::AccountAlreadyStakedError.into());
        }

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_fake_sol.to_account_info(),
                to: ctx.accounts.sol_storage.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, deposit_amount)?;

        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                to: ctx.accounts.sender_dark_sol.to_account_info(),
                mint: ctx.accounts.dark_sol.to_account_info(),
                authority: ctx.accounts.dark_sol.to_account_info(),
            },
        );
        let bump = ctx.bumps.dark_sol;
        let fake_sol_key = ctx.accounts.fake_sol.key();
        let pda_sign = &[b"darksol", fake_sol_key.as_ref(), &[bump]];
        token::mint_to(mint_ctx.with_signer(&[pda_sign]), deposit_amount)?;

        Ok(())
    }

    pub fn unstake(ctx: Context<StakeUnstake>) -> Result<()> {
        let receipt = &mut ctx.accounts.receipt;
        if receipt.is_valid == 0 {
            return Err(ProgramError::InvalidAccountData.into());
        }
        let deposited_amount = receipt.amount_deposited;
        let burn_amount = deposited_amount;

        if burn_amount > 0 {
            let burn_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.dark_sol.to_account_info(),
                    from: ctx.accounts.sender_dark_sol.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            );
            token::burn(burn_ctx, burn_amount)?;
        }

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sol_storage.to_account_info(),
                to: ctx.accounts.sender_fake_sol.to_account_info(),
                authority: ctx.accounts.sol_storage.to_account_info(),
            },
        );
        let bump = ctx.bumps.sol_storage;
        let fake_sol_key = ctx.accounts.fake_sol.key();
        let pda_sign = &[b"storage", fake_sol_key.as_ref(), &[bump]];
        token::transfer(transfer_ctx.with_signer(&[pda_sign]), deposited_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Init<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub fake_sol: Account<'info, Mint>,
  #[account(
    init,
    payer = payer,
    seeds = [b"darksol", fake_sol.key().as_ref()],
    bump,
    mint::decimals = fake_sol.decimals,
    mint::authority = dark_sol,
  )]
    pub dark_sol: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = [b"storage", fake_sol.key().as_ref()],
        bump,
        token::mint = fake_sol,
        token::authority = sol_storage,
    )]
    pub sol_storage: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct NewUser<'info> {
    pub fake_sol: Account<'info, Mint>,
    #[account(init, payer = sender, seeds = [b"receipt", fake_sol.key().as_ref(), sender.key().as_ref()], bump, space = 8 + 40)]
    pub receipt: Account<'info, Receipt>,
    #[account(mut)]
    pub sender: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeUnstake<'info> {
    pub fake_sol: Account<'info, Mint>,
    #[account(mut, seeds = [b"darksol", fake_sol.key().as_ref()], bump)]
    pub dark_sol: Account<'info, Mint>,
    #[account(mut, seeds = [b"storage", fake_sol.key().as_ref()], bump)]
    pub sol_storage: Account<'info, TokenAccount>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_fake_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub sender_dark_sol: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut, seeds = [b"receipt", fake_sol.key().as_ref(), sender.key().as_ref()], bump)]
    pub receipt: Account<'info, Receipt>,
}


#[account]
#[derive(Default)]
pub struct Receipt {
    pub is_valid: u8,
    pub created_ts: i64,
    pub amount_deposited: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Account has already staked.")]
    AccountAlreadyStakedError,
}
