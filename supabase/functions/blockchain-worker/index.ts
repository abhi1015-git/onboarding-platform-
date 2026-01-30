import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as web3 from "https://esm.sh/@solana/web3.js@1.98.4"
import * as anchor from "https://esm.sh/@project-serum/anchor@0.26.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { employeeData } = await req.json()

        // Phase 2: RECONSTRUCTING FROM TRIPLE LOCK
        const partA = Deno.env.get("SOLANA_PART_A")
        const partB = Deno.env.get("SOLANA_PART_B")
        const partC = Deno.env.get("SOLANA_PART_C")

        if (!partA || !partB || !partC) {
            throw new Error("Operational Key parts are missing in Environment.")
        }

        const secret = [...JSON.parse(partA), ...JSON.parse(partB), ...JSON.parse(partC)]
        const keypair = web3.Keypair.fromSecretKey(new Uint8Array(secret))

        const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed")
        const programId = new web3.PublicKey(Deno.env.get("SOLANA_PROGRAM_ID"))

        // Initialize Provider/Program
        const wallet = {
            publicKey: keypair.publicKey,
            signTransaction: (tx) => { tx.partialSign(keypair); return Promise.resolve(tx); },
            signAllTransactions: (txs) => { txs.forEach(t => t.partialSign(keypair)); return Promise.resolve(txs); }
        }

        // Note: IDL would be needed here for a full Anchor implementation
        // For this worker, we'll use a raw transaction or a pre-defined IDL

        return new Response(
            JSON.stringify({
                message: "Key successfully reconstructed and ready for signing",
                signer: keypair.publicKey.toString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
