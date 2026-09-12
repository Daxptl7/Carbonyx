import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  isConnected: boolean;
  error: string | null;
}

export async function connectMetaMask(): Promise<{ address: string; signer: JsonRpcSigner; chainId: number }> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet.');
  }

  const provider = new BrowserProvider((window as any).ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found in MetaMask.');
  }

  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    address: accounts[0],
    signer,
    chainId: Number(network.chainId)
  };
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
