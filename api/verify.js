const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');

// IDL for the Solana Program
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

module.exports = async (req, res) => {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { employeeData } = req.body;
        if (!employeeData) throw new Error("Missing employee data");

        // 2. THE TRIPLE LOCK: Reconstruct Operational Key from Vault
        const partA = process.env.SOLANA_PART_A;
        const partB = process.env.SOLANA_PART_B;
        const partC = process.env.SOLANA_PART_C;

        if (!partA || !partB || !partC) {
            throw new Error("Operational Key segments missing in Vercel Environment.");
        }

        const secret = [...JSON.parse(partA), ...JSON.parse(partB), ...JSON.parse(partC)];
        const keypair = Keypair.fromSecretKey(new Uint8Array(secret));

        // 3. Solana Connection
        const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.testnet.solana.com", "confirmed");
        const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID || "9sYR8qpGVRQoVH9iA4MfSnArdDQtQq3wTopD6nSBiBbg");

        // 4. Setup Anchor Provider/Program
        const wallet = new anchor.Wallet(keypair);
        const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
        const program = new anchor.Program(idl, programId, provider);

        // 5. Execute On-Chain Verification
        const employeeHash = new Uint8Array(32);
        // Use a simple random for demo or derive from email
        for (let i = 0; i < 32; i++) employeeHash[i] = Math.floor(Math.random() * 256);

        const [employeePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("employee"), Buffer.from(employeeHash)],
            programId
        );

        const tx = await program.methods
            .initializeEmployee(Array.from(employeeHash), "LK-" + (employeeData.name || "CANDIDATE").substring(0, 10))
            .accounts({
                employeeAccount: employeePda,
                authority: keypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        // 6. Return Secure Result
        return res.status(200).json({
            success: true,
            signature: tx,
            explorerUrl: `https://solscan.io/tx/${tx}?cluster=testnet`,
            signer: keypair.publicKey.toString()
        });

    } catch (err) {
        console.error("Vercel Backend Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message,
            code: "BRG_ERR_500"
        });
    }
};
