use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};
use solana_program::stake::instruction as stake_instruction;
use solana_program::stake::state::{Authorized, Lockup};
use solana_program::system_instruction;
use solana_program::pubkey::Pubkey;
use solana_program::rent::Rent;
use solana_program::clock::Clock;
use solana_program::stake::state::StakeStateV2;

declare_id!("2jRqt1Vbo3AvefEuort5LvaoRPA7TQcR6KWaFDztTrdA");

#[program]
mod dark_sol {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>, validators: Vec<Pubkey>) -> Result<()> {
    let state = &mut ctx.accounts.staking_state;
    state.validators = validators;
    state.current_validator_index = 0;
    Ok(())
}

pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
  // 1. Transfer SOL from the user's account to the staking pool account
  let cpi_accounts = Transfer {
      from: ctx.accounts.user_token_account.to_account_info(),
      to: ctx.accounts.staking_pool.to_account_info(),
      authority: ctx.accounts.user.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  token::transfer(cpi_ctx, amount)?;

  // 2. Create a new staking account
  let stake_account_key = Pubkey::create_with_seed(
    &ctx.accounts.user.key,
    "stake",
    &ctx.accounts.staking_pool.key(),
).map_err(|e| ProgramError::from(e))?;
  let stake_account_rent = Rent::get()?.minimum_balance(StakeStateV2::size_of());
  let ix = system_instruction::create_account_with_seed(
      &ctx.accounts.user.key,
      &stake_account_key,
      &ctx.accounts.staking_pool.key(),
      "stake",
      stake_account_rent,
      StakeStateV2::size_of() as u64,
      &solana_program::stake::program::id(),
  );

  solana_program::program::invoke(
      &ix,
      &[
          ctx.accounts.user.to_account_info(),
          ctx.accounts.staking_pool.to_account_info(),
      ],
  )?;

  // 3. Get the current validator to delegate to
  let state = &mut ctx.accounts.staking_state;
  let validator = state.validators[state.current_validator_index as usize];
  state.current_validator_index = (state.current_validator_index + 1) % state.validators.len() as u64;

  // 4. Delegate the stake to the validator
  let authorized = Authorized {
      staker: ctx.accounts.staking_pool.key(),
      withdrawer: ctx.accounts.staking_pool.key(),
  };
  let lockup = Lockup::default();
  let ix = stake_instruction::initialize(
      &stake_account_key,
      &authorized,
      &lockup,
  );

  solana_program::program::invoke(
      &ix,
      &[
          ctx.accounts.stake_account.to_account_info(),
          ctx.accounts.rent.to_account_info(),
          ctx.accounts.system_program.to_account_info(),
      ],
  )?;

  let ix = stake_instruction::delegate_stake(
      &stake_account_key,
      &ctx.accounts.staking_pool.key(),
      &validator,
  );

  solana_program::program::invoke(
      &ix,
      &[
          ctx.accounts.stake_account.to_account_info(),
          ctx.accounts.clock.to_account_info(),
          ctx.accounts.stake_history.to_account_info(),
          ctx.accounts.staking_pool.to_account_info(),
      ],
  )?;

  // 5. Mint LST tokens to the user's account
  let cpi_accounts = MintTo {
      mint: ctx.accounts.lst_mint.to_account_info(),
      to: ctx.accounts.user_lst_account.to_account_info(),
      authority: ctx.accounts.staking_authority.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  token::mint_to(cpi_ctx, amount)?;

  Ok(())
}

pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
  // Burn LST tokens from the user's account
  let cpi_accounts = Burn {
      mint: ctx.accounts.lst_mint.to_account_info(),
      from: ctx.accounts.user_lst_account.to_account_info(),
      authority: ctx.accounts.user.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  token::burn(cpi_ctx, amount)?;

  // Withdraw SOL from the staking pool account to the user's account
  let cpi_accounts = Transfer {
      from: ctx.accounts.staking_pool.to_account_info(),
      to: ctx.accounts.user_token_account.to_account_info(),
      authority: ctx.accounts.staking_authority.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  token::transfer(cpi_ctx, amount)?;

  Ok(())
}
}

#[derive(Accounts)]
pub struct Initialize<'info> {
#[account(init, payer = user, space = 8 + 32 + 1024)]
pub staking_state: Account<'info, StakingState>,
#[account(init, payer = user, space = 8 + 32)]
pub staking_authority: Account<'info, StakingAuthority>,
#[account(init, mint::decimals = 9, mint::authority = staking_authority, payer = user)]
pub lst_mint: Account<'info, Mint>,
#[account(mut)]
pub user: Signer<'info>,
pub system_program: Program<'info, System>,
pub token_program: Program<'info, Token>,
pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
#[account(mut)]
pub user: Signer<'info>,
#[account(mut)]
pub user_token_account: Account<'info, TokenAccount>,
#[account(mut)]
pub staking_pool: Account<'info, TokenAccount>,
#[account(mut)]
pub user_lst_account: Account<'info, TokenAccount>,
#[account(mut)]
pub lst_mint: Account<'info, Mint>,
#[account(mut)]
pub staking_authority: Account<'info, StakingAuthority>,
 /// CHECK: This is not dangerous because we are creating the stake account with a seed and only use it to perform staking instructions.
#[account(mut)]
pub stake_account: AccountInfo<'info>,
#[account(mut)]
pub staking_state: Account<'info, StakingState>,
pub token_program: Program<'info, Token>,
pub system_program: Program<'info, System>,
pub rent: Sysvar<'info, Rent>,
pub clock: Sysvar<'info, Clock>,
pub stake_history: Sysvar<'info, StakeHistory>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
#[account(mut)]
pub user: Signer<'info>,
#[account(mut)]
pub user_token_account: Account<'info, TokenAccount>,
#[account(mut)]
pub staking_pool: Account<'info, TokenAccount>,
#[account(mut)]
pub user_lst_account: Account<'info, TokenAccount>,
#[account(mut)]
pub lst_mint: Account<'info, Mint>,
#[account(mut)]
pub staking_authority: Account<'info, StakingAuthority>,
pub token_program: Program<'info, Token>,
}

#[account]
pub struct StakingAuthority {
pub authority: Pubkey,
}

#[account]
pub struct StakingState {
pub validators: Vec<Pubkey>,
pub current_validator_index: u64,
}