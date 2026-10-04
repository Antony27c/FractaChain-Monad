export const DEV_ACCOUNTS = [
  { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", label: "Emisor (verificado)" },
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", label: "Inversor A (verificado)" },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", label: "Inversor B (sin verificar)" },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", label: "Inversor C (sin verificar)" },
] as const satisfies readonly { address: `0x${string}`; label: string }[];

export const DEV_ACCOUNT_KEY = "shardchain.devAccount";
