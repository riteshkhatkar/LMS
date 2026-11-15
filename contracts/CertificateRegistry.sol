// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @notice Privacy-preserving cryptographic commitment registry for Learn LMS / ORELSE digital credentials.
 * @dev Anchors ONLY domain-separated cryptographic commitments (bytes32).
 * Zero Personally Identifiable Information (PII), learner names, email addresses, course grades,
 * or raw verification URLs are stored on-chain or emitted in events.
 */
contract CertificateRegistry {
    // Roles & Access Control
    address public admin;
    mapping(address => bool) public isIssuer;

    // Standardized Privacy-Preserving Revocation Reason Codes (hashes of standard reason tokens)
    bytes32 public constant REASON_ADMINISTRATIVE = keccak256("REASON_ADMINISTRATIVE");
    bytes32 public constant REASON_ACADEMIC_INTEGRITY = keccak256("REASON_ACADEMIC_INTEGRITY");
    bytes32 public constant REASON_SUPERSEDED = keccak256("REASON_SUPERSEDED");
    bytes32 public constant REASON_RECIPIENT_REQUEST = keccak256("REASON_RECIPIENT_REQUEST");

    // Commitment Record: Only non-PII state
    struct CommitmentRecord {
        bool anchored;
        uint256 timestamp;
        address issuer;
        bool revoked;
        uint256 revokedAt;
        bytes32 reasonCode;
    }

    mapping(bytes32 => CommitmentRecord) private _commitments;

    // Events (Privacy-Preserving: zero PII)
    event CertificateAnchored(bytes32 indexed commitment, address indexed issuer, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed commitment, address indexed revoker, bytes32 indexed reasonCode, uint256 timestamp);
    event IssuerGranted(address indexed account);
    event IssuerRevoked(address indexed account);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }

    modifier onlyIssuer() {
        require(isIssuer[msg.sender] || msg.sender == admin, "Caller is not authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
        isIssuer[msg.sender] = true;
        emit IssuerGranted(msg.sender);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid new admin address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    function grantIssuer(address account) external onlyAdmin {
        require(account != address(0), "Invalid account");
        require(!isIssuer[account], "Account is already an authorized issuer");
        isIssuer[account] = true;
        emit IssuerGranted(account);
    }

    function revokeIssuer(address account) external onlyAdmin {
        require(isIssuer[account], "Account is not an authorized issuer");
        isIssuer[account] = false;
        emit IssuerRevoked(account);
    }

    /**
     * @notice Anchors an institutional credential commitment on-chain.
     * @param commitment The domain-separated SHA-256 salted commitment hash.
     */
    function anchorCommitment(bytes32 commitment) external onlyIssuer {
        require(commitment != bytes32(0), "Invalid commitment hash: zero bytes");
        require(!_commitments[commitment].anchored, "Commitment already anchored");

        _commitments[commitment] = CommitmentRecord({
            anchored: true,
            timestamp: block.timestamp,
            issuer: msg.sender,
            revoked: false,
            revokedAt: 0,
            reasonCode: bytes32(0)
        });

        emit CertificateAnchored(commitment, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes an anchored credential commitment with a standardized privacy-safe reason code.
     * @param commitment The domain-separated commitment hash.
     * @param reasonCode A keccak256 hash or standard reason token (no personal notes).
     */
    function revokeCommitment(bytes32 commitment, bytes32 reasonCode) external onlyIssuer {
        require(_commitments[commitment].anchored, "Commitment not found");
        require(!_commitments[commitment].revoked, "Commitment already revoked");

        _commitments[commitment].revoked = true;
        _commitments[commitment].revokedAt = block.timestamp;
        _commitments[commitment].reasonCode = reasonCode;

        emit CertificateRevoked(commitment, msg.sender, reasonCode, block.timestamp);
    }

    /**
     * @notice Checks if a commitment is anchored on-chain.
     */
    function isAnchored(bytes32 commitment) external view returns (bool) {
        return _commitments[commitment].anchored;
    }

    /**
     * @notice Checks if a commitment has been revoked.
     */
    function isRevoked(bytes32 commitment) external view returns (bool) {
        return _commitments[commitment].revoked;
    }

    /**
     * @notice Retrieves the revocation reason code for an anchored commitment.
     */
    function getRevocationReasonCode(bytes32 commitment) external view returns (bytes32) {
        return _commitments[commitment].reasonCode;
    }

    /**
     * @notice Queries the complete verification tuple for an anchored commitment.
     */
    function getCommitment(bytes32 commitment)
        external
        view
        returns (
            bool anchored,
            uint256 timestamp,
            address issuer,
            bool revoked,
            uint256 revokedAt,
            bytes32 reasonCode
        )
    {
        CommitmentRecord memory r = _commitments[commitment];
        return (r.anchored, r.timestamp, r.issuer, r.revoked, r.revokedAt, r.reasonCode);
    }
}
