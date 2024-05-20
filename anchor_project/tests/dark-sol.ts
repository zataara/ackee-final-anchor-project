import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DarkSol } from "../target/types/dark_sol"; // Adjust the path if necessary
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
} from "@solana/spl-token";

describe("dark-sol", () => {

  // const provider = anchor.AnchorProvider.env();
  
  const provider = anchor.AnchorProvider.local("http://127.0.0.1:8899");

  anchor.setProvider(provider);

  const program = anchor.workspace.DarkSol as Program<DarkSol>;

  let user: anchor.web3.Keypair;
  let stakingState: anchor.web3.Keypair;
  let stakingAuthority: anchor.web3.Keypair;
  let lstMint: anchor.web3.PublicKey;
  let userTokenAccount: anchor.web3.PublicKey;
  let stakingPool: anchor.web3.PublicKey;
  let userLstAccount: anchor.web3.PublicKey;

  before(async () => {
    // Example validators using vote account public keys
    const validators = [
      new anchor.web3.PublicKey("CpmLkdXieV27wFFSGBBFoGBqMHrxWxQoZTYxQYQWKStk"),
      new anchor.web3.PublicKey("EVDznFshXTmQrPSptTh4KmzjRaG4rKL2U2uTzashQUct"), // Example validator vote account pubkey
    ];

    // Create accounts for the test
    user = anchor.web3.Keypair.generate();
    stakingState = anchor.web3.Keypair.generate();
    stakingAuthority = anchor.web3.Keypair.generate();

    const airdrop = async (
      connection: any,
      address: any,
      amount = 1000000000
    ) => {
      await connection.confirmTransaction(
        await connection.requestAirdrop(address, amount),
        "confirmed"
      );
    };

    // Fund the user account
    await airdrop(provider.connection, user.publicKey, 2e9);

    // Create LST mint
    lstMint = await createMint(
      program.provider.connection,
      user,
      stakingAuthority.publicKey,
      null,
      9
    );

    // Create user token account for SOL
    userTokenAccount = await createAccount(
      program.provider.connection,
      user,
      lstMint,
      user.publicKey
    );

    // Create staking pool token account
    stakingPool = await createAccount(
      program.provider.connection,
      user,
      lstMint,
      stakingAuthority.publicKey
    );

    // Create user LST token account
    userLstAccount = await createAccount(
      program.provider.connection,
      user,
      lstMint,
      user.publicKey
    );

    // Initialize the program
    await program.methods
      .initialize(validators)
      .accounts({
        stakingState: stakingState.publicKey,
        stakingAuthority: stakingAuthority.publicKey,
        lstMint: lstMint,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, stakingState, stakingAuthority])
      .rpc({ skipPreflight: true });
  });

  it("Is initialized!", async () => {
    // Check the initialization state
    const state = await program.account.stakingState.fetch(
      stakingState.publicKey
    );
    console.log("Validators:", state.validators);
    console.log("Current Validator Index:", state.currentValidatorIndex);
  });

  it("Stake tokens", async () => {
    const amount = new anchor.BN(1e9); // 1 SOL

    // Mint tokens to user's token account
    await mintTo(
      program.provider.connection,
      user,
      lstMint,
      userTokenAccount,
      user,
      1e9
    );

    // Stake tokens
    const tx = await program.methods
      .stake(amount)
      .accounts({
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        stakingPool: stakingPool,
        userLstAccount: userLstAccount,
        lstMint: lstMint,
        stakingAuthority: stakingAuthority.publicKey,
        stakeAccount: stakingState.publicKey, // Assuming stakeAccount is the same as stakingState for simplicity
        stakingState: stakingState.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        stakeHistory: anchor.web3.SYSVAR_STAKE_HISTORY_PUBKEY,
      })
      .signers([user])
      .rpc();
    console.log("Stake transaction signature", tx);
  });

  it("Unstake tokens", async () => {
    const amount = new anchor.BN(1e9); // 1 SOL

    // Unstake tokens
    const tx = await program.methods
      .unstake(amount)
      .accounts({
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        stakingPool: stakingPool,
        userLstAccount: userLstAccount,
        lstMint: lstMint,
        stakingAuthority: stakingAuthority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
    console.log("Unstake transaction signature", tx);
  });
});
