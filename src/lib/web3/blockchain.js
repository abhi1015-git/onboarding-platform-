import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

// Configuration
const network = import.meta.env.VITE_SOLANA_NETWORK || 'testnet';
const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.testnet.solana.com';
const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID);
const opts = {
    preflightCommitment: "processed"
};

// IDL
const idl = {
    "version": "0.1.0",
    "name": "solana_program",
    "instructions": [
        {
            "name": "initializeEmployee",
            "accounts": [
                { "name": "employeeAccount", "isMut": true, "isSigner": false },
                { "name": "authority", "isMut": true, "isSigner": true },
                { "name": "systemProgram", "isMut": false, "isSigner": false }
            ],
            "args": [
                { "name": "employeeHash", "type": { "array": ["u8", 32] } },
                { "name": "companyId", "type": "string" }
            ]
        }
    ]
};

export const getConnection = () => {
    return new Connection(rpcUrl, opts.preflightCommitment);
};

export const getProvider = (wallet) => {
    const connection = getConnection();
    const provider = new AnchorProvider(connection, wallet, opts);
    return provider;
};

export const getProgram = (provider) => {
    return new Program(idl, programId, provider);
};

// Operational Wallet Wrapper (Compatible with AnchorProvider)
// HYBRID MODE: Uses env key for local dev, delegates to bridge in production
class OperationalWallet {
    constructor(keypair) {
        this.keypair = keypair;
        this.publicKey = keypair.publicKey;
        this.payer = keypair;
    }

    async signTransaction(tx) {
        tx.partialSign(this.keypair);
        return tx;
    }

    async signAllTransactions(txs) {
        return txs.map(tx => {
            tx.partialSign(this.keypair);
            return tx;
        });
    }
}

export const getDevnetWallet = () => {
    // Try to get the operational key from environment
    const envSecret = import.meta.env.VITE_SOLANA_OPERATIONAL_PRIVATE_KEY;

    if (envSecret) {
        try {
            const secret = new Uint8Array(JSON.parse(envSecret));
            const keypair = web3.Keypair.fromSecretKey(secret);
            console.log("✅ Operational Wallet loaded from environment");
            return new OperationalWallet(keypair);
        } catch (e) {
            console.error("❌ Failed to parse operational key:", e);
        }
    }

    // Fallback: Throw error for local dev without key
    throw new Error("SOLANA_OPERATIONAL_PRIVATE_KEY not found in environment. Please check your .env.local file.");
};

export const verifyCandidateOnChain = async (wallet = null, employeeData) => {
    console.log(">> BLOCKCHAIN VERIFICATION INITIATED...");

    try {
        console.log(">> Preparing Payload:", employeeData);

        // Try production bridge first (for deployed environments)
        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employeeData })
            });

            // Check if we got a valid response
            if (response.ok) {
                const result = await response.json();
                console.log(">> Secure Signature Received (Bridge):", result.signature);
                return {
                    signature: result.signature,
                    explorerUrl: result.explorerUrl,
                    status: "Fortress Verified"
                };
            }
        } catch (bridgeError) {
            console.log(">> Bridge not available, using local signing...");
        }

        // FALLBACK: Local Development Mode - Direct Blockchain Access
        console.log(">> LOCAL DEV MODE: Using direct blockchain signing");

        const actualWallet = getDevnetWallet();
        const provider = getProvider(actualWallet);
        const program = getProgram(provider);

        // Generate employee hash
        const employeeHash = new Uint8Array(32);
        crypto.getRandomValues(employeeHash);

        const [employeePda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode("employee"), employeeHash],
            programId
        );

        console.log(">> Sending transaction to Testnet...");
        console.log(">> PDA:", employeePda.toString());

        // Build and send transaction
        const txBuilder = program.methods
            .initializeEmployee(Array.from(employeeHash), "LK-" + (employeeData.name || "CANDIDATE").substring(0, 10))
            .accounts({
                employeeAccount: employeePda,
                authority: actualWallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            });

        // Add signer if we have the keypair (local dev mode)
        const tx = actualWallet.payer
            ? await txBuilder.signers([actualWallet.payer]).rpc()
            : await txBuilder.rpc();

        const explorerUrl = `https://solscan.io/tx/${tx}?cluster=testnet`;
        console.log(">> Transaction Signature:", tx);
        console.log(">> View on Explorer:", explorerUrl);

        return {
            signature: tx,
            explorerUrl,
            status: "Local Dev Verified"
        };

    } catch (error) {
        console.error(">> Verification Error:", error);

        // Detailed error messages
        if (error.message?.includes("0x1")) {
            throw new Error("Insufficient funds for rent. Please add Testnet SOL to your wallet.");
        }
        if (error.message?.includes("0x0")) {
            throw new Error("Account already exists or Program ID mismatch.");
        }
        if (error.message?.includes("custom program error: 0x1771")) {
            throw new Error("Unauthorized signer. Only the Operational Wallet can sign transactions.");
        }

        throw new Error(error.message || "Blockchain verification failed.");
    }
};
