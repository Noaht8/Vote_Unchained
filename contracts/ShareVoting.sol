// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract ShareVoting {
    address public owner;
    uint256 public proposalCount;

    struct Shareholder {
        address shareholderAddresses;
        string name;
        uint256 sharesPercentage;
        bool isRegistered;
        bool approved;
        string ipfsHash;
    }

    mapping(address => Shareholder) public shareholders;
    address[] public shareholderAddresses;
    mapping(address => uint) public shareIndexMap;
    mapping(address => bool) public isShareholder;

    struct Proposal {
        string proposalId;
        string name;
        string description;
        uint256 endTime;
        uint256 totalSharesPercentage;
        uint256 forVotesPercentage;
        uint256 againstVotesPercentage;
        bool open;
        string ipfsHash;
        mapping(address => bool) voted;
    }

    mapping(string => Proposal) public proposals;
    string[] public proposalIds;
    mapping(string => uint) public indexMap;
    mapping(string => bool) public exists;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner.");
        _;
    }

    modifier onlyShareholder() {
        require(
            shareholders[msg.sender].sharesPercentage > 0 &&
                shareholders[msg.sender].approved,
            "Sender is not an approved shareholder."
        );
        _;
    }

    event Voted(
        address indexed voter,
        string indexed proposalId,
        bool inSupport
    );

    event ProposalCreated(
        address indexed creator,
        string indexed proposalId,
        string name,
        string description
    );

    event ShareholderRegistered(address indexed creator, string name);

    event ShareholderEdited(address indexed creator, uint256 shares);

    event ProposalEdited(
        address indexed creator,
        string indexed proposalId,
        string name,
        string description
    );

    constructor() {
        // Initilizing default values
        owner = msg.sender;
        proposalCount = 0;
        // boardNomineeCount = 0;
        // shareHolderCount = 0;
        // start = false;
        // end = false;
    }

    function getOwner() public view returns (address) {
        // Returns account address used to deploy contract (i.e. Owner)
        return owner;
    }

    function registerSelfAsShareholder(
        string memory _name,
        uint256 _sharesPercentage,
        string memory _hash
    ) external {
        require(
            _sharesPercentage <= 100,
            "Shares percentage cannot exceed 100."
        );

        require(!isShareholder[msg.sender], "Address is already a shareholder");

        uint256 totalSharesPercentage = getTotalSharesPercentage();

        require(
            (totalSharesPercentage + _sharesPercentage) <= 100,
            "Error in Share Percentage"
        );

        shareholders[msg.sender] = Shareholder(
            msg.sender,
            _name,
            _sharesPercentage,
            true,
            false,
            _hash
        );
        shareholderAddresses.push(msg.sender);
        shareIndexMap[msg.sender] = shareholderAddresses.length - 1;
        isShareholder[msg.sender] = true;

        emit ShareholderRegistered(msg.sender, _name);
    }

    function approveShareholder(address _shareholder) external onlyOwner {
        require(
            shareholders[_shareholder].isRegistered,
            "Not a registered shareholder."
        );
        shareholders[_shareholder].approved = true;
    }

    function disApproveShareholder(address _shareholder) external onlyOwner {
        require(
            shareholders[_shareholder].isRegistered,
            "Not a registered shareholder."
        );
        shareholders[_shareholder].approved = false;
    }

    function isRegisteredShareholder(
        address _shareholder
    ) external view returns (bool) {
        return isShareholder[_shareholder];
    }

    function isApprovedShareholder(
        address _shareholder
    ) external view returns (bool) {
        return shareholders[_shareholder].approved;
    }

    function getShareholderAddresses() public view returns (address[] memory) {
        return shareholderAddresses;
    }

    function getShareholdersCount() external view returns (uint256) {
        return shareholderAddresses.length;
    }

    function getShareholder(
        address _address
    )
        external
        view
        returns (address, string memory, uint256, bool, bool, string memory)
    {
        return (
            shareholders[_address].shareholderAddresses,
            shareholders[_address].name,
            shareholders[_address].sharesPercentage,
            shareholders[_address].isRegistered,
            shareholders[_address].approved,
            shareholders[_address].ipfsHash
        );
    }

    // Edit shareholder details after registration
    function editShareholder(
        address _shareholderAddress,
        string memory _name,
        uint256 _newShares,
        string memory _newHash
    ) external {
        require(
            isShareholder[_shareholderAddress],
            "Shareholder does not exist"
        );

        uint256 totalSharesPercentage = getTotalSharesPercentage();
        uint256 previousSharesPercentage = getShareholderShares(
            _shareholderAddress
        );

        uint256 total = totalSharesPercentage - previousSharesPercentage;

        require((total + _newShares) <= 100, "Error in Shares Percentage");

        shareholders[_shareholderAddress].name = _name;
        shareholders[_shareholderAddress].sharesPercentage = _newShares;
        shareholders[_shareholderAddress].approved = false;
        shareholders[_shareholderAddress].ipfsHash = _newHash;

        emit ShareholderEdited(_shareholderAddress, _newShares);
    }

    // Get a shareholder's shares percentage
    function getShareholderShares(
        address _shareholderAddress
    ) internal view returns (uint256) {
        require(
            isShareholder[_shareholderAddress],
            "Address is not a shareholder"
        );
        return shareholders[_shareholderAddress].sharesPercentage;
    }

    function removeShareholder(address shareholder) public {
        require(isShareholder[shareholder], "Address is not a shareholder");

        uint index = shareIndexMap[shareholder];
        uint lastIndex = shareholderAddresses.length - 1;

        if (index < lastIndex) {
            // Replace the address to be removed with the last address in the array
            address lastShareholder = shareholderAddresses[lastIndex];
            shareholderAddresses[index] = lastShareholder;
            shareIndexMap[lastShareholder] = index;
        }

        delete shareholders[shareholder];
        // Remove the last address
        shareholderAddresses.pop();
        delete shareIndexMap[shareholder];
        isShareholder[shareholder] = false;
    }

    function createProposal(
        string memory _proposalId,
        string memory _name,
        string memory _description,
        string memory _hash,
        uint256 _endTime
    ) external onlyOwner {
        //require(shareholderAddresses.length > 0, "No shareholders registered.");
        require(bytes(_name).length > 0, "Proposal name cannot be empty.");
        require(
            bytes(_description).length > 0,
            "Proposal description cannot be empty."
        );

        uint256 totalSharesPercentage = getTotalSharesPercentage();

        require(!exists[_proposalId], "Proposal ID already exists");

        require(
            msg.sender == owner || shareholders[msg.sender].approved,
            "Caller is not authorized to create proposals."
        );

        require(
            _endTime > block.timestamp,
            "The End time cannot be in the Past"
        );

        proposals[_proposalId].proposalId = _proposalId;
        proposals[_proposalId].name = _name;
        proposals[_proposalId].description = _description;
        proposals[_proposalId].endTime = _endTime;
        proposals[_proposalId].totalSharesPercentage = totalSharesPercentage;
        proposals[_proposalId].forVotesPercentage = 0;
        proposals[_proposalId].againstVotesPercentage = 0;
        proposals[_proposalId].open = true;
        proposals[_proposalId].ipfsHash = _hash;

        proposalIds.push(_proposalId);
        indexMap[_proposalId] = proposalIds.length - 1;
        exists[_proposalId] = true;
        proposalCount++;

        emit ProposalCreated(msg.sender, _proposalId, _name, _description);
    }

    function getProposalIds() public view returns (string[] memory) {
        return proposalIds;
    }

    function closeProposal(string memory _proposalId) external onlyOwner {
        require(proposals[_proposalId].open, "Proposal is already closed.");
        proposals[_proposalId].open = false;
    }

    function getProposal(
        string memory _proposalId
    )
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            string memory
        )
    {
        return (
            proposals[_proposalId].proposalId,
            proposals[_proposalId].name,
            proposals[_proposalId].description,
            proposals[_proposalId].totalSharesPercentage,
            proposals[_proposalId].forVotesPercentage,
            proposals[_proposalId].againstVotesPercentage,
            proposals[_proposalId].ipfsHash
        );
    }

    // Edit proposal details after creation
    function editProposal(
        string memory _proposalId,
        string memory _newName,
        string memory _newDescription,
        uint256 _endTime,
        string memory _newHash
    ) external onlyOwner {
        require(exists[_proposalId], "Proposal ID not found");

        proposals[_proposalId].name = _newName;
        proposals[_proposalId].description = _newDescription;
        proposals[_proposalId].endTime = _endTime;
        proposals[_proposalId].ipfsHash = _newHash;

        emit ProposalEdited(msg.sender, _proposalId, _newName, _newDescription);
    }

    function deleteProposal(string memory _proposalId) external onlyOwner {
        require(exists[_proposalId], "Proposal ID not found");

        delete proposals[_proposalId];

        uint index = indexMap[_proposalId];
        uint lastIndex = proposalIds.length - 1;

        // Move the last element to the place of the element to delete
        string memory lastProposalId = proposalIds[lastIndex];
        proposalIds[index] = lastProposalId;
        indexMap[lastProposalId] = index;

        // Remove the last element
        proposalIds.pop();

        // Remove the value from the mappings
        delete indexMap[_proposalId];
        delete exists[_proposalId];
        proposalCount--;
    }

    function vote(
        string memory _proposalId,
        bool _inSupport
    ) external onlyShareholder {
        require(
            isShareholder[msg.sender],
            "Address is not a registered shareholder"
        );
        require(
            proposals[_proposalId].open,
            "Voting is closed for this proposal."
        );
        require(
            !proposals[_proposalId].voted[msg.sender],
            "Shareholder has already voted on this proposal."
        );
        require(
            block.timestamp <= proposals[_proposalId].endTime,
            "Voting on Proposal has Ended"
        );

        uint256 voterSharesPercentage = shareholders[msg.sender]
            .sharesPercentage;

        if (_inSupport) {
            proposals[_proposalId].forVotesPercentage += voterSharesPercentage;
        } else {
            proposals[_proposalId]
                .againstVotesPercentage += voterSharesPercentage;
        }

        proposals[_proposalId].voted[msg.sender] = true;

        emit Voted(msg.sender, _proposalId, _inSupport);
    }

    function checkWinner(
        string memory _proposalId
    ) external view returns (string memory) {
        require(
            proposals[_proposalId].open == false,
            "Voting is still open for this proposal."
        );

        uint256 forVotes = proposals[_proposalId].forVotesPercentage;
        uint256 againstVotes = proposals[_proposalId].againstVotesPercentage;

        if (forVotes > againstVotes) {
            return "Proposal passed";
        } else if (againstVotes > forVotes) {
            return "Proposal rejected";
        } else {
            return "Proposal tied";
        }
    }

    function getVoteStatus(
        address _shareholder,
        string memory _proposalId
    ) external view returns (bool hasVoted, bool inSupport) {
        hasVoted = proposals[_proposalId].voted[_shareholder];
        inSupport = hasVoted
            ? (proposals[_proposalId].forVotesPercentage >
                proposals[_proposalId].againstVotesPercentage)
            : false;
    }

    function getTotalSharesPercentage() internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < shareholderAddresses.length; i++) {
            total += shareholders[shareholderAddresses[i]].sharesPercentage;
        }
        return total;
    }
}
