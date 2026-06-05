// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeadVault v2
 * @notice Trustless Dead Man's Switch — LitVM LiteForge Testnet
 * @dev v2 adds: 0.21 zkLTC creation fee, 0.21 zkLTC claim fee,
 *      grace period after deadline, treasury wallet, heir/cosigner-only trigger
 */
contract DeadVault is ReentrancyGuard, Pausable, Ownable {

    uint256 public constant MIN_INTERVAL   = 1 days;
    uint256 public constant MAX_INTERVAL   = 365 days;
    uint256 public constant CLAIM_TIMELOCK = 3 days;
    uint256 public constant MAX_HEIRS      = 10;
    uint256 public constant BASIS_POINTS   = 10_000;

    uint256 public VAULT_CREATION_FEE = 0.21 ether;
    uint256 public CLAIM_FEE          = 0.21 ether;
    address public treasury           = 0x1af0e38B4B627BB5d7a071B20E103aEa0380452A;

    enum VaultStatus { Active, Claimable, Released, Revoked }

    struct Heir {
        address wallet;
        uint256 shareBps;
        string  label;
        bool    claimed;
    }

    struct ClaimRequest {
        address initiatedBy;
        uint256 initiatedAt;
        bool    coSignerApproved;
        uint256 approvedAt;
        bool    executed;
    }

    struct Vault {
        uint256 id;
        address owner;
        string  name;
        string  encryptedDataCID;
        string  encryptedSymKey;
        string  secretType;
        uint256 intervalSeconds;
        uint256 gracePeriodSeconds;
        uint256 lastCheckIn;
        uint256 deadline;
        address coSigner;
        Heir[]  heirs;
        VaultStatus  status;
        ClaimRequest claimRequest;
        uint256 createdAt;
    }

    uint256 private _vaultCounter;
    mapping(uint256 => Vault)     private _vaults;
    mapping(address => uint256[]) private _ownerVaults;
    mapping(address => uint256[]) private _heirVaults;
    mapping(address => uint256[]) private _coSignerVaults;

    event VaultCreated(uint256 indexed vaultId, address indexed owner, string name, uint256 intervalSeconds, uint256 gracePeriodSeconds, uint256 heirCount);
    event CheckedIn(uint256 indexed vaultId, address indexed owner, uint256 newDeadline);
    event VaultClaimable(uint256 indexed vaultId, address indexed triggeredBy, uint256 claimableAt);
    event ClaimInitiated(uint256 indexed vaultId, address indexed heir, uint256 timelockExpiry);
    event ClaimCoSigned(uint256 indexed vaultId, address indexed coSigner, uint256 approvedAt);
    event VaultReleased(uint256 indexed vaultId, address indexed heir, uint256 shareBps);
    event VaultRevoked(uint256 indexed vaultId, address indexed owner);
    event FeePaid(uint256 indexed vaultId, address indexed payer, uint256 amount, string feeType);

    error NotOwner(uint256 vaultId);
    error NotHeir(uint256 vaultId);
    error NotCoSigner(uint256 vaultId);
    error VaultNotActive(uint256 vaultId);
    error VaultNotClaimable(uint256 vaultId);
    error GracePeriodNotOver(uint256 vaultId, uint256 claimableAt);
    error DeadlineNotPassed(uint256 vaultId, uint256 deadline);
    error TimelockNotExpired(uint256 timelockExpiry);
    error AlreadyClaimed(uint256 vaultId);
    error AlreadyCoSigned(uint256 vaultId);
    error InvalidInterval();
    error InvalidGracePeriod();
    error InvalidHeirs();
    error InvalidShareTotal(uint256 total);
    error EmptyEncryptedData();
    error ClaimNotInitiated(uint256 vaultId);
    error MaxHeirsExceeded();
    error InsufficientFee(uint256 required, uint256 sent);
    error NotHeirOrCoSigner(uint256 vaultId);

    constructor() Ownable(msg.sender) {}

    modifier onlyVaultOwner(uint256 vaultId) {
        if (_vaults[vaultId].owner != msg.sender) revert NotOwner(vaultId);
        _;
    }
    modifier onlyHeir(uint256 vaultId) {
        if (!_isHeir(vaultId, msg.sender)) revert NotHeir(vaultId);
        _;
    }
    modifier onlyCoSigner(uint256 vaultId) {
        if (_vaults[vaultId].coSigner != msg.sender) revert NotCoSigner(vaultId);
        _;
    }
    modifier vaultActive(uint256 vaultId) {
        if (_vaults[vaultId].status != VaultStatus.Active) revert VaultNotActive(vaultId);
        _;
    }

    function createVault(
        string  calldata name,
        string  calldata encryptedDataCID,
        string  calldata encryptedSymKey,
        string  calldata secretType,
        uint256          intervalSeconds,
        uint256          gracePeriodSeconds,
        address          coSigner,
        address[] calldata heirWallets,
        uint256[] calldata heirShares,
        string[]  calldata heirLabels
    ) external payable whenNotPaused returns (uint256 vaultId) {
        if (msg.value < VAULT_CREATION_FEE) revert InsufficientFee(VAULT_CREATION_FEE, msg.value);
        if (intervalSeconds < MIN_INTERVAL || intervalSeconds > MAX_INTERVAL) revert InvalidInterval();
        if (gracePeriodSeconds > 365 days) revert InvalidGracePeriod();
        if (bytes(encryptedDataCID).length == 0) revert EmptyEncryptedData();
        if (heirWallets.length == 0 || heirWallets.length != heirShares.length || heirWallets.length != heirLabels.length) revert InvalidHeirs();
        if (heirWallets.length > MAX_HEIRS) revert MaxHeirsExceeded();

        uint256 totalShares;
        for (uint256 i = 0; i < heirShares.length; i++) { totalShares += heirShares[i]; }
        if (totalShares != BASIS_POINTS) revert InvalidShareTotal(totalShares);

        (bool sent,) = treasury.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        vaultId = ++_vaultCounter;
        Vault storage v = _vaults[vaultId];
        v.id                 = vaultId;
        v.owner              = msg.sender;
        v.name               = name;
        v.encryptedDataCID   = encryptedDataCID;
        v.encryptedSymKey    = encryptedSymKey;
        v.secretType         = secretType;
        v.intervalSeconds    = intervalSeconds;
        v.gracePeriodSeconds = gracePeriodSeconds;
        v.lastCheckIn        = block.timestamp;
        v.deadline           = block.timestamp + intervalSeconds;
        v.coSigner           = coSigner;
        v.status             = VaultStatus.Active;
        v.createdAt          = block.timestamp;

        for (uint256 i = 0; i < heirWallets.length; i++) {
            v.heirs.push(Heir({ wallet: heirWallets[i], shareBps: heirShares[i], label: heirLabels[i], claimed: false }));
            _heirVaults[heirWallets[i]].push(vaultId);
        }
        _ownerVaults[msg.sender].push(vaultId);
        _coSignerVaults[coSigner].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, name, intervalSeconds, gracePeriodSeconds, heirWallets.length);
        emit FeePaid(vaultId, msg.sender, msg.value, "vault_creation");
    }

    function checkIn(uint256 vaultId) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        Vault storage v = _vaults[vaultId];
        v.lastCheckIn = block.timestamp;
        v.deadline    = block.timestamp + v.intervalSeconds;
        emit CheckedIn(vaultId, msg.sender, v.deadline);
    }

    function triggerClaimable(uint256 vaultId) external vaultActive(vaultId) {
        Vault storage v = _vaults[vaultId];
        if (!_isHeir(vaultId, msg.sender) && v.coSigner != msg.sender) revert NotHeirOrCoSigner(vaultId);
        if (block.timestamp <= v.deadline) revert DeadlineNotPassed(vaultId, v.deadline);
        uint256 claimAt = v.deadline + v.gracePeriodSeconds;
        if (block.timestamp < claimAt) revert GracePeriodNotOver(vaultId, claimAt);
        v.status = VaultStatus.Claimable;
        emit VaultClaimable(vaultId, msg.sender, claimAt);
    }

    function initiateClaim(uint256 vaultId) external payable onlyHeir(vaultId) nonReentrant {
        if (msg.value < CLAIM_FEE) revert InsufficientFee(CLAIM_FEE, msg.value);
        Vault storage v = _vaults[vaultId];
        if (v.status != VaultStatus.Claimable) revert VaultNotClaimable(vaultId);
        (bool sent,) = treasury.call{value: msg.value}("");
        require(sent, "Fee transfer failed");
        v.claimRequest = ClaimRequest({ initiatedBy: msg.sender, initiatedAt: block.timestamp, coSignerApproved: false, approvedAt: 0, executed: false });
        emit ClaimInitiated(vaultId, msg.sender, block.timestamp + CLAIM_TIMELOCK);
        emit FeePaid(vaultId, msg.sender, msg.value, "claim_initiation");
    }

    function approveClaim(uint256 vaultId) external payable onlyCoSigner(vaultId) nonReentrant {
        if (msg.value < CLAIM_FEE) revert InsufficientFee(CLAIM_FEE, msg.value);
        Vault storage v = _vaults[vaultId];
        if (v.status != VaultStatus.Claimable) revert VaultNotClaimable(vaultId);
        if (v.claimRequest.initiatedAt == 0) revert ClaimNotInitiated(vaultId);
        if (v.claimRequest.coSignerApproved) revert AlreadyCoSigned(vaultId);
        (bool sent,) = treasury.call{value: msg.value}("");
        require(sent, "Fee transfer failed");
        v.claimRequest.coSignerApproved = true;
        v.claimRequest.approvedAt       = block.timestamp;
        emit ClaimCoSigned(vaultId, msg.sender, block.timestamp);
        emit FeePaid(vaultId, msg.sender, msg.value, "claim_approval");
    }

    function executeRelease(uint256 vaultId) external onlyHeir(vaultId) nonReentrant {
        Vault storage v = _vaults[vaultId];
        if (v.status != VaultStatus.Claimable) revert VaultNotClaimable(vaultId);
        if (!v.claimRequest.coSignerApproved) revert ClaimNotInitiated(vaultId);
        uint256 timelockExpiry = v.claimRequest.approvedAt + CLAIM_TIMELOCK;
        if (block.timestamp < timelockExpiry) revert TimelockNotExpired(timelockExpiry);
        for (uint256 i = 0; i < v.heirs.length; i++) {
            if (v.heirs[i].wallet == msg.sender) {
                if (v.heirs[i].claimed) revert AlreadyClaimed(vaultId);
                v.heirs[i].claimed = true;
                emit VaultReleased(vaultId, msg.sender, v.heirs[i].shareBps);
                break;
            }
        }
        bool allClaimed = true;
        for (uint256 i = 0; i < v.heirs.length; i++) { if (!v.heirs[i].claimed) { allClaimed = false; break; } }
        if (allClaimed) v.status = VaultStatus.Released;
    }

    function revokeVault(uint256 vaultId) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        _vaults[vaultId].status = VaultStatus.Revoked;
        emit VaultRevoked(vaultId, msg.sender);
    }

    function updateEncryptedData(uint256 vaultId, string calldata newCID, string calldata newSymKey) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        _vaults[vaultId].encryptedDataCID = newCID;
        _vaults[vaultId].encryptedSymKey  = newSymKey;
    }
    function updateInterval(uint256 vaultId, uint256 newIntervalSeconds) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        if (newIntervalSeconds < MIN_INTERVAL || newIntervalSeconds > MAX_INTERVAL) revert InvalidInterval();
        _vaults[vaultId].intervalSeconds = newIntervalSeconds;
        _vaults[vaultId].deadline = _vaults[vaultId].lastCheckIn + newIntervalSeconds;
    }
    function updateCoSigner(uint256 vaultId, address newCoSigner) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        _vaults[vaultId].coSigner = newCoSigner;
        _coSignerVaults[newCoSigner].push(vaultId);
    }
    function updateGracePeriod(uint256 vaultId, uint256 newGracePeriodSeconds) external onlyVaultOwner(vaultId) vaultActive(vaultId) {
        if (newGracePeriodSeconds > 365 days) revert InvalidGracePeriod();
        _vaults[vaultId].gracePeriodSeconds = newGracePeriodSeconds;
    }

    function setTreasury(address newTreasury) external onlyOwner { treasury = newTreasury; }
    function setVaultCreationFee(uint256 newFee) external onlyOwner { VAULT_CREATION_FEE = newFee; }
    function setClaimFee(uint256 newFee) external onlyOwner { CLAIM_FEE = newFee; }

    function getVault(uint256 vaultId) external view returns (uint256,address,string memory,string memory,string memory,string memory,uint256,uint256,uint256,uint256,address,VaultStatus,uint256,uint256) {
        Vault storage v = _vaults[vaultId];
        return (v.id,v.owner,v.name,v.encryptedDataCID,v.encryptedSymKey,v.secretType,v.intervalSeconds,v.gracePeriodSeconds,v.lastCheckIn,v.deadline,v.coSigner,v.status,v.createdAt,v.heirs.length);
    }
    function getHeirs(uint256 vaultId) external view returns (Heir[] memory) { return _vaults[vaultId].heirs; }
    function getClaimRequest(uint256 vaultId) external view returns (ClaimRequest memory) { return _vaults[vaultId].claimRequest; }
    function getOwnerVaults(address owner) external view returns (uint256[] memory) { return _ownerVaults[owner]; }
    function getHeirVaults(address heir) external view returns (uint256[] memory) { return _heirVaults[heir]; }
    function getCoSignerVaults(address coSigner) external view returns (uint256[] memory) { return _coSignerVaults[coSigner]; }
    function isClaimable(uint256 vaultId) external view returns (bool) {
        Vault storage v = _vaults[vaultId];
        if (v.status == VaultStatus.Claimable) return true;
        if (v.status != VaultStatus.Active) return false;
        return block.timestamp >= v.deadline + v.gracePeriodSeconds;
    }
    function claimableAt(uint256 vaultId) external view returns (uint256) { return _vaults[vaultId].deadline + _vaults[vaultId].gracePeriodSeconds; }
    function totalVaults() external view returns (uint256) { return _vaultCounter; }
    function timeUntilDeadline(uint256 vaultId) external view returns (uint256) {
        uint256 dl = _vaults[vaultId].deadline;
        if (block.timestamp >= dl) return 0;
        return dl - block.timestamp;
    }
    function getVaultCreationFee() external view returns (uint256) { return VAULT_CREATION_FEE; }
    function getClaimFee() external view returns (uint256) { return CLAIM_FEE; }

    function _isHeir(uint256 vaultId, address addr) internal view returns (bool) {
        Heir[] storage heirs = _vaults[vaultId].heirs;
        for (uint256 i = 0; i < heirs.length; i++) { if (heirs[i].wallet == addr) return true; }
        return false;
    }
}
