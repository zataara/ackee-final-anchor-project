import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { DarkSol } from "../target/types/dark_sol";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

describe("dark-sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  let connection = provider.connection;
  const program = anchor.workspace.DarkSol as Program<DarkSol>;

  let senderFakeSol: web3.PublicKey;
  let senderDarkSol: web3.PublicKey;
  let solStorage: web3.PublicKey;
  let darkSol: web3.PublicKey;
  let receipt: web3.PublicKey;
  let wallet: anchor.web3.Keypair;
  let fakeSol;

  async function printState() {
    if (senderFakeSol) {
      let balance = await connection.getTokenAccountBalance(senderFakeSol);
      console.log("User fakeSOL amount:", balance.value.amount);
    } else {
      console.log("senderFakeSol is undefined");
    }

    if (senderDarkSol) {
      let balance = await connection.getTokenAccountBalance(senderDarkSol);
      console.log("User darkSOL amount:", balance.value.amount);
    } else {
      console.log("senderDarkSol is undefined");
    }

    if (solStorage) {
      let balance = await connection.getTokenAccountBalance(solStorage);
      console.log("Fake SOL amount in vault:", balance.value.amount);
    } else {
      console.log("solStorage is undefined");
    }
  }

  before(async () => {
    wallet = web3.Keypair.generate();
    let tx = await connection.requestAirdrop(
      wallet.publicKey,
      web3.LAMPORTS_PER_SOL * 500
    );

    await connection.confirmTransaction({
      signature: tx,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });

    fakeSol = await createMint(connection, wallet, wallet.publicKey, null, 18);

    senderFakeSol = await createAssociatedTokenAccount(
      connection,
      wallet,
      fakeSol,
      provider.wallet.publicKey
    );

    let amount: number = 500;

    await mintTo(
      connection,
      wallet,
      fakeSol,
      senderFakeSol,
      wallet.publicKey,
      amount
    );

    [darkSol] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("darksol"), fakeSol.toBuffer()],
      program.programId
    );

    [solStorage] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("storage"), fakeSol.toBuffer()],
      program.programId
    );

    [receipt] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        fakeSol.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  it("initializes", async () => {

    console.log("Initializing...");
    let balance = await connection.getTokenAccountBalance(senderFakeSol);
    console.log("User token amount:", balance.value.amount);
    console.log("");

    const initTxHash = await program.methods
      .initialize()
      .accounts({
        fakeSol,
        darkSol,
        solStorage,
        payer: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: token.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc({ skipPreflight: true });

    console.log("Initialized hash: ", initTxHash);

    await program.methods
      .initUser()
      .accounts({
        fakeSol,
        receipt,
        sender: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: true });

    senderDarkSol = await createAssociatedTokenAccount(
      connection,
      wallet,
      darkSol,
      provider.wallet.publicKey
    );
  });

  it("Stakes Successfully", async () => {
    let stake = {
      fakeSol,
      darkSol,
      solStorage,
      sender: provider.wallet.publicKey,
      senderFakeSol,
      senderDarkSol,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      receipt,
    };

    console.log("Initializing Stake");
    const stakingTxHash: string = await program.methods
      .stake(new anchor.BN(225))
      .accounts(stake)
      .rpc({ skipPreflight: true });
    console.log("Staking Transaction Hash:", stakingTxHash);
    await printState();
  });

  it("Unstakes Successfully", async () => {
    let unstake = {
      fakeSol,
      darkSol,
      solStorage,
      sender: provider.wallet.publicKey,
      senderFakeSol,
      senderDarkSol,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      receipt,
    };

    console.log("Initializing Unstake");
    const unstakingTxHash: string = await program.methods
      .unstake()
      .accounts(unstake)
      .rpc({ skipPreflight: true });
    console.log("Unstaking Transaction Hash:", unstakingTxHash);
    await printState();
  });
});
