import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS } from "../utils/config";
import DeadVaultABI from "../abi/DeadVault.json";

const contractConfig = { address: CONTRACT_ADDRESS, abi: DeadVaultABI.abi };

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
export function useVaultCreationFee() {
  return useReadContract({ ...contractConfig, functionName:"getVaultCreationFee" });
}
export function useClaimFee() {
  return useReadContract({ ...contractConfig, functionName:"getClaimFee" });
}

function useWrite(functionName) {
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  return { write:(args,value)=>writeContract({...contractConfig,functionName,args,value}), hash, isPending, isConfirming, isSuccess, error };
}

export function useCreateVault() {
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  const createVault=(args)=>writeContract({
    ...contractConfig, functionName:"createVault",
    args:[args.name,args.encryptedDataCID,args.encryptedSymKey,args.secretType,BigInt(args.intervalSeconds),BigInt(args.gracePeriodSeconds),args.coSigner,args.heirWallets,args.heirShares.map(BigInt),args.heirLabels],
    value: parseEther("0.21"),
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
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  const initiateClaim=(id)=>writeContract({...contractConfig,functionName:"initiateClaim",args:[BigInt(id)],value:parseEther("0.21")});
  return {initiateClaim,hash,isPending,isConfirming,isSuccess,error};
}
export function useApproveClaim() {
  const {writeContract,data:hash,isPending,error}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});
  const approveClaim=(id)=>writeContract({...contractConfig,functionName:"approveClaim",args:[BigInt(id)],value:parseEther("0.21")});
  return {approveClaim,hash,isPending,isConfirming,isSuccess,error};
}
export function useExecuteRelease() {
  const {write,...rest}=useWrite("executeRelease");
  return {executeRelease:(id)=>write([BigInt(id)]),...rest};
}
export function useRevokeVault() {
  const {write,...rest}=useWrite("revokeVault");
  return {revokeVault:(id)=>write([BigInt(id)]),...rest};
}
