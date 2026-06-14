import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACT_ADDRESS } from "../utils/config";
import DeadVaultABI from "../abi/DeadVault.json";

const contractConfig = { address: CONTRACT_ADDRESS, abi: DeadVaultABI.abi };

// Fixed gas limit for all transactions — avoids LiteForge estimation bug
const GAS_LIMIT = 500000n;

export function useVault(vaultId) {
  return useReadContract({ ...contractConfig, functionName:"getVault", args:[vaultId], query:{enabled:!!vaultId} });
}
export function useHeirs(vaultId) {
  return useReadContract({ ...contractConfig, functionName:"getHeirs", args:[vaultId], query:{enabled:!!vaultId} });
}
export function useOwnerVaults() {
  const {address}=useAccount();
  return useReadContract({ ...contractConfig, functionName:"getOwnerVaults", args:[address], query:{enabled:!!address} });
}
export function useHeirVaults() {
  const {address}=useAccount();
  return useReadContract({ ...contractConfig, functionName:"getHeirVaults", args:[address], query:{enabled:!!address} });
}
export function useClaimRequest(vaultId) {
  return useReadContract({ ...contractConfig, functionName:"getClaimRequest", args:[vaultId], query:{enabled:!!vaultId} });
}
export function useTimeUntilDeadline(vaultId) {
  return useReadContract({ ...contractConfig, functionName:"timeUntilDeadline", args:[vaultId], query:{enabled:!!vaultId,refetchInterval:60_000} });
}
export function useTotalVaults() {
  return useReadContract({ ...contractConfig, functionName:"totalVaults" });
}

function useWrite(functionName) {
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  return { write:(args)=>writeContract({...contractConfig,functionName,args,gas:GAS_LIMIT}), hash, isPending, isConfirming, isSuccess, error };
}

export function useCreateVault() {
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  const createVault=(args)=>writeContract({
    ...contractConfig, functionName:"createVault",
    args:[args.name,args.encryptedDataCID,args.encryptedSymKey,args.secretType,BigInt(args.intervalSeconds),args.coSigner,args.heirWallets,args.heirShares.map(BigInt),args.heirLabels],
    gas: GAS_LIMIT,
  });
  return {createVault,hash,isPending,isConfirming,isSuccess,error};
}
export function useCheckIn() {
  const {write,...rest}=useWrite("checkIn");
  return {checkIn:(id)=>write([BigInt(id)]),...rest};
}
export function useTriggerClaimable() {
  const {write,...rest}=useWrite("triggerClaimable");
  return {triggerClaimable:(id)=>write([BigInt(id)]),...rest};
}
export function useInitiateClaim() {
  const {write,...rest}=useWrite("initiateClaim");
  return {initiateClaim:(id)=>write([BigInt(id)]),...rest};
}
export function useApproveClaim() {
  const {write,...rest}=useWrite("approveClaim");
  return {approveClaim:(id)=>write([BigInt(id)]),...rest};
}
export function useExecuteRelease() {
  const {write,...rest}=useWrite("executeRelease");
  return {executeRelease:(id)=>write([BigInt(id)]),...rest};
}
export function useRevokeVault() {
  const {write,...rest}=useWrite("revokeVault");
  return {revokeVault:(id)=>write([BigInt(id)]),...rest};
}
