import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from './idl.json';

/**
 * ⚠️ SECURITY NOTE: In a production app, the private key should NEVER be stored in the frontend.
 * This is implemented here for demonstration/test purposes using the provided deployer key.
 */
const DEPLOYER_SECRET = new Uint8Array([226, 28, 86, 215, 149, 130, 93, 162, 114, 218, 134, 144, 217, 151, 71, 175, 78, 13, 83, 199, 136, 0, 49, 123, 40, 84, 243, 143, 78, 48, 171, 87, 117, 238, 240, 205, 145, 95, 103, 58, 42, 91, 93, 43, 140, 176, 233, 49, 187, 231, 189, 49, 136, 166, 190, 46, 11, 57, 250, 231, 7, 201, 95, 100]);
const PROGRAM_ID = new web3.PublicKey(idl.address);

export const notarizeEmployeeOnChain = async (candidateEmail, companyId) => {
    try {
        const connection = new web3.Connection(import.meta.env.VITE_SOLANA_RPC_URL || "https://api.testnet.solana.com", "confirmed");
        // Get private key from environment variable
        let secretKey;
        try {
            const privateKeyStr = import.meta.env.VITE_SOLANA_OPERATIONAL_PRIVATE_KEY;
            if (privateKeyStr) {
                secretKey = new Uint8Array(JSON.parse(privateKeyStr));
            } else {
                secretKey = DEPLOYER_SECRET;
            }
        } catch (e) {
            console.warn("Failed to parse VITE_SOLANA_OPERATIONAL_PRIVATE_KEY, using default", e);
            secretKey = DEPLOYER_SECRET;
        }

        const deployerKeypair = web3.Keypair.fromSecretKey(secretKey);
        const wallet = new anchor.Wallet(deployerKeypair);
        const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
        const program = new anchor.Program(idl, PROGRAM_ID, provider);

        // Generate a deterministic hash based on email
        const encoder = new TextEncoder();
        const data = encoder.encode(candidateEmail + Date.now()); // Using Date.now for uniqueness in test
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const employeeHash = new Uint8Array(hashBuffer);

        // Derive PDA
        const [employeePda] = web3.PublicKey.findProgramAddressSync(
            [encoder.encode("employee"), employeeHash],
            PROGRAM_ID
        );

        const tx = await program.methods
            .initializeEmployee(Array.from(employeeHash), companyId)
            .accounts({
                employeeAccount: employeePda,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        return {
            success: true,
            signature: tx,
            pda: employeePda.toString(),
            explorerUrl: `https://solscan.io/tx/${tx}?cluster=testnet`
        };
    } catch (error) {
        console.error("Solana Notarization Error:", error);
        throw error;
    }
};

export const notarizeDocumentOnChain = async (documentUrl) => {
    try {
        const connection = new web3.Connection(import.meta.env.VITE_SOLANA_RPC_URL || "https://api.testnet.solana.com", "confirmed");

        // Get private key from environment variable
        let secretKey;
        try {
            const privateKeyStr = import.meta.env.VITE_SOLANA_OPERATIONAL_PRIVATE_KEY;
            if (privateKeyStr) {
                secretKey = new Uint8Array(JSON.parse(privateKeyStr));
            } else {
                secretKey = DEPLOYER_SECRET;
            }
        } catch (e) {
            secretKey = DEPLOYER_SECRET;
        }

        const deployerKeypair = web3.Keypair.fromSecretKey(secretKey);
        const wallet = new anchor.Wallet(deployerKeypair);
        const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
        const program = new anchor.Program(idl, PROGRAM_ID, provider);

        const encoder = new TextEncoder();
        const data = encoder.encode(documentUrl + Date.now());
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const docHash = new Uint8Array(hashBuffer);

        const [proofPda] = web3.PublicKey.findProgramAddressSync(
            [encoder.encode("proof"), docHash],
            PROGRAM_ID
        );

        const tx = await program.methods
            .recordDocumentProof(Array.from(docHash))
            .accounts({
                documentProof: proofPda,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        return {
            success: true,
            signature: tx,
            pda: proofPda.toString(),
            explorerUrl: `https://solscan.io/tx/${tx}?cluster=testnet`
        };
    } catch (error) {
        console.error("Solana Doc Proof Error:", error);
        throw error;
    }
};
