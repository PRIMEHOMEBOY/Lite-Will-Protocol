import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS } from "../utils/config";
import DeadVaultABI from "../abi/DeadVault.json";
import { useVault, useClaimRequest, useApproveClaim } from "../hooks/useDeadVault";
import Countdown from "./Countdown";

function CoSignerVaultCard({ id, index }) {
  const { data: d }     = useVault(id);
  const { data: claim } = useClaimRequest(id);
  const { approveClaim, isPending, isConfirming } = useApproveClaim();

  if (!d) return null;

  const status  = Number(d[10]);
  const vault   = { id, name: d[2], secretType: d[5], deadline: d[8], status: d[10] };
  const now     = Math.floor(Date.now() / 1000);
  const expired = now > Number(vault.deadline);

  const claimInitiated    = claim && Number(claim.initiatedAt) > 0;
  const alreadyApproved   = claim?.coSignerApproved;

  return (
    <div className="card fade-up" style={{ marginBottom: 14, animationDelay: `${index * 0.08}s`, opacity: 0 }}>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {vault.name || "Unnamed Vault"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span className="label">VLT-{String(id).padStart(4,"0")}</span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span className="label">{vault.secretType}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span className="badge badge-pending">CO-SIGNER</span>
          {alreadyApproved && <span className="badge badge-active">✓ Approved</span>}
        </div>
      </div>

      {/* Vault status messages */}
      {status === 0 && !expired && (
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          Vault is active. You will be notified when your approval is needed.
        </div>
      )}
      {status === 0 && expired && (
        <div className="alert alert-warn" style={{ marginBottom: 12 }}>
          ⚠ Vault deadline has passed. Waiting for an heir to initiate a claim.
        </div>
      )}
      {status === 1 && !claimInitiated && (
        <div className="alert alert-warn" style={{ marginBottom: 12 }}>
          Vault is claimable. Waiting for an heir to initiate a claim.
        </div>
      )}
      {status === 1 && claimInitiated && !alreadyApproved && (
        <div className="alert alert-danger" style={{ marginBottom: 12 }}>
          ⚡ An heir has initiated a claim. Your approval is required to release the vault.
        </div>
      )}
      {status === 1 && alreadyApproved && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          ✓ You have approved this claim. Waiting for the 3-day timelock to expire.
        </div>
      )}
      {status === 2 && (
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          Vault has been fully released to heirs.
        </div>
      )}

      {/* Approve button — only shown when needed */}
      {status === 1 && claimInitiated && !alreadyApproved && (
        <button
          className="btn btn-primary"
          onClick={() => approveClaim(id)}
          disabled={isPending || isConfirming}
          style={{ marginTop: 4 }}
        >
          {isPending || isConfirming
            ? <><span className="spinner"/> Confirming...</>
            : "✓ Approve Claim"
          }
        </button>
      )}
    </div>
  );
}

export default function CoSignerVaults() {
  const { address } = useAccount();

  const { data: coSignerVaultIds = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DeadVaultABI.abi,
    functionName: "getCoSignerVaults",
    args: [address],
    query: { enabled: !!address },
  });

  if (!coSignerVaultIds.length) return null;

  return (
    <>
      <div className="section-title" style={{ marginTop: 36 }}>
        <div className="section-num">✍</div>
        Vaults Where You Are Co-Signer
      </div>
      {coSignerVaultIds.map((id, i) => (
        <CoSignerVaultCard key={`cs-${String(id)}`} id={id} index={i} />
      ))}
    </>
  );
}
