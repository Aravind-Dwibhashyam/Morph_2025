// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FamilySharedWallet {
    uint256 private constant MONTH_DURATION = 30 days;
    uint8 private constant MAX_CATEGORIES = 5;

    enum Category { 
        Food,
        Education,
        Entertainment,
        Transport,
        Others      
    }

    struct UserBudget {
        bool isChild;
        bool isActive;
        uint32 lastResetTime;
        uint128 totalMonthlyLimit;
        uint128 totalSpent;
    }

    struct VendorInfo {
        Category category;
        bool isActive;
    }

    struct CategorySpending {  
        uint128 limit;
        uint128 spent;
    }

    struct Family {
        uint256 familyId;
        address familyCreator;
        bool isActive;
        uint32 createdAt;
        address[] parents;
        address[] children;
        address[] approvedVendors;
        uint256 familyBalance;
    }

    uint256 public nextFamilyId;
    bool public isPaused;

    mapping(uint256 => Family) public families;
    mapping(address => uint256) public userToFamily; // User address to their family ID
    
    mapping(uint256 => mapping(address => bool)) public familyParents; // familyId => address => isParent
    mapping(uint256 => mapping(address => UserBudget)) public familyUsers; // familyId => address => UserBudget
    mapping(uint256 => mapping(address => mapping(Category => CategorySpending))) public familyCategorySpending; // familyId => address => category => spending
    mapping(uint256 => mapping(address => VendorInfo)) public familyVendors; // familyId => vendor => VendorInfo

    event FamilyCreated(uint256 indexed familyId, address indexed creator);
    event ParentAdded(uint256 indexed familyId, address indexed parent, address indexed addedBy);
    event ChildAdded(uint256 indexed familyId, address indexed child, address indexed addedBy);
    event ChildRemoved(uint256 indexed familyId, address indexed child, address indexed removedBy);
    event LimitSet(uint256 indexed familyId, address indexed child, Category indexed category, uint256 amount, address setBy);
    event VendorAdded(uint256 indexed familyId, address indexed vendor, Category indexed category, address addedBy);
    event VendorRemoved(uint256 indexed familyId, address indexed vendor, address indexed removedBy);
    event PaymentMade(uint256 indexed familyId, address indexed child, address indexed vendor, uint256 amount, Category category);
    event EmergencyPayment(uint256 indexed familyId, address indexed child, address indexed vendor, uint256 amount, Category category);
    event TransactionLogged(uint256 indexed familyId, address indexed child, address indexed vendor, uint256 amount, Category category, bool emergency, uint256 timestamp);
    event LimitsReset(uint256 indexed familyId, address indexed child, uint256 resetTime);
    event FundsWithdrawn(uint256 indexed familyId, address indexed to, uint256 amount, address indexed withdrawnBy);
    event ContractPaused();
    event ContractUnpaused();
    event FundsAdded(uint256 indexed familyId, address indexed from, uint256 amount);

    error OnlyParent();
    error OnlyChild();
    error OnlyActiveChild();
    error OnlyFamilyMember();
    error NotApprovedVendor();
    error ExceedsLimit();
    error InvalidCategory();
    error ChildNotFound();
    error VendorNotFound(); 
    error TransferFailed();
    error InvalidAmount();
    error ChildAlreadyExists();
    error ParentAlreadyExists();
    error ContractPausedError();
    error FamilyNotFound();
    error UserAlreadyInFamily();
    error UserNotInFamily();
    error InvalidFamilyId();

    modifier onlyParentInFamily(uint256 familyId) {
        if (!familyParents[familyId][msg.sender]) revert OnlyParent();
        _;
    }

    modifier onlyActiveChildInFamily(uint256 familyId) {
        if (userToFamily[msg.sender] != familyId || 
            !familyUsers[familyId][msg.sender].isChild || 
            !familyUsers[familyId][msg.sender].isActive) {
            revert OnlyActiveChild();
        }
        _;
    }

    modifier onlyFamilyMember(uint256 familyId) {
        if (userToFamily[msg.sender] != familyId) revert OnlyFamilyMember();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    modifier notPaused() {
        if (isPaused) revert ContractPausedError();
        _;
    }

    modifier validFamily(uint256 familyId) {
        if (familyId == 0 || familyId >= nextFamilyId || !families[familyId].isActive) {
            revert InvalidFamilyId();
        }
        _;
    }

    constructor() {
        nextFamilyId = 1; // to assign the family ID from 1
    }

    function createFamily() external payable returns (uint256 familyId) {
        if (userToFamily[msg.sender] != 0) revert UserAlreadyInFamily();
        require(msg.value >= 0.05 ether, "Not Enough Amount");
        
        familyId = nextFamilyId++;
        
        families[familyId] = Family({
            familyId: familyId,
            familyCreator: msg.sender,
            isActive: true,
            createdAt: uint32(block.timestamp),
            parents: new address[](0),
            children: new address[](0),
            approvedVendors: new address[](0),
            familyBalance: 0
        });

        // Add creator as the first parent
        familyParents[familyId][msg.sender] = true;
        families[familyId].parents.push(msg.sender);
        userToFamily[msg.sender] = familyId;

        // Initialize creator's user budget (parent is not a child)
        familyUsers[familyId][msg.sender] = UserBudget({
            isChild: false,
            isActive: true,
            lastResetTime: uint32(block.timestamp),
            totalMonthlyLimit: 0,
            totalSpent: 0
        });

        emit FamilyCreated(familyId, msg.sender);
    }

    function addFunds(uint256 familyId) external payable validFamily(familyId) onlyParentInFamily(familyId){
        require(msg.value > 0, "Must send Ether");
        // Update family and contract balance
        families[familyId].familyBalance += msg.value;
        emit FundsAdded(familyId, msg.sender, msg.value);
    }


    function addParentToFamily(uint256 familyId, address newParent) external validFamily(familyId) onlyParentInFamily(familyId) {
        if (userToFamily[newParent] != 0) revert UserAlreadyInFamily();
        if (familyParents[familyId][newParent]) revert ParentAlreadyExists();

        familyParents[familyId][newParent] = true;
        families[familyId].parents.push(newParent);
        userToFamily[newParent] = familyId;

        familyUsers[familyId][newParent] = UserBudget({
            isChild: false,
            isActive: true,
            lastResetTime: uint32(block.timestamp),
            totalMonthlyLimit: 0,
            totalSpent: 0
        });

        emit ParentAdded(familyId, newParent, msg.sender);
    }

    function addChildToFamily(uint256 familyId, address child) external validFamily(familyId) onlyParentInFamily(familyId) {
        if (userToFamily[child] != 0) revert UserAlreadyInFamily();
        if (familyUsers[familyId][child].isActive) revert ChildAlreadyExists();

        familyUsers[familyId][child] = UserBudget({
            isChild: true,
            isActive: true,
            lastResetTime: uint32(block.timestamp),
            totalMonthlyLimit: 0,
            totalSpent: 0
        });

        families[familyId].children.push(child);
        userToFamily[child] = familyId;

        emit ChildAdded(familyId, child, msg.sender);
    }

    function removeChildFromFamily(uint256 familyId, address child) 
        external 
        validFamily(familyId) 
        onlyParentInFamily(familyId) 
    {
        if (!familyUsers[familyId][child].isChild || !familyUsers[familyId][child].isActive) {
            revert ChildNotFound();
        }

        familyUsers[familyId][child].isActive = false;
        userToFamily[child] = 0;

        address[] storage children = families[familyId].children;
        for (uint256 i = 0; i < children.length; i++) {
            if (children[i] == child) {
                children[i] = children[children.length - 1];
                children.pop();
                break;
            }
        }

        emit ChildRemoved(familyId, child, msg.sender);
    }

    
    function setLimitForChild(uint256 familyId, address child, Category category, uint128 amount) 
        external 
        validFamily(familyId) 
        onlyParentInFamily(familyId) 
    {
        if (!familyUsers[familyId][child].isChild || !familyUsers[familyId][child].isActive) {
            revert ChildNotFound();
        }

        familyCategorySpending[familyId][child][category].limit = amount;
        emit LimitSet(familyId, child, category, amount, msg.sender);
    }

    function addVendorToFamily(uint256 familyId, address vendor, Category category) external validFamily(familyId) onlyParentInFamily(familyId) {
        familyVendors[familyId][vendor] = VendorInfo({
            category: category,
            isActive: true
        });

        families[familyId].approvedVendors.push(vendor);
        emit VendorAdded(familyId, vendor, category, msg.sender);
    }

    function removeVendorFromFamily(uint256 familyId, address vendor) external validFamily(familyId) onlyParentInFamily(familyId) {
        if (!familyVendors[familyId][vendor].isActive) revert VendorNotFound();

        familyVendors[familyId][vendor].isActive = false;

        address[] storage vendors = families[familyId].approvedVendors;
        for (uint256 i = 0; i < vendors.length; i++) {
            if (vendors[i] == vendor) {
                vendors[i] = vendors[vendors.length - 1];
                vendors.pop();
                break;
            }
        }

        emit VendorRemoved(familyId, vendor, msg.sender);
    }

    function makePayment(address vendor) external payable validAmount(msg.value) notPaused {
        uint256 familyId = userToFamily[msg.sender];
        require(families[familyId].familyBalance >= msg.value, "Insufficient family funds");
        if (familyId == 0) revert UserNotInFamily();
        if (!familyUsers[familyId][msg.sender].isChild || !familyUsers[familyId][msg.sender].isActive) {
            revert OnlyActiveChild();
        }

        VendorInfo storage vendorInfo = familyVendors[familyId][vendor];
        if (!vendorInfo.isActive) revert NotApprovedVendor();

        Category category = vendorInfo.category;
        _resetLimitsIfNeeded(familyId, msg.sender);
        CategorySpending storage spending = familyCategorySpending[familyId][msg.sender][category];

        if (spending.spent + msg.value > spending.limit) {
            revert ExceedsLimit();
        }

        spending.spent += uint128(msg.value);
        familyUsers[familyId][msg.sender].totalSpent += uint128(msg.value);

        families[familyId].familyBalance -= msg.value;
        spending.spent += uint128(msg.value);

        (bool success, ) = vendor.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit PaymentMade(familyId, msg.sender, vendor, msg.value, category);
        emit TransactionLogged(familyId, msg.sender, vendor, msg.value, category, false, block.timestamp);
    }

    function makeEmergencyPayment(address vendor) external payable validAmount(msg.value) notPaused {
        uint256 familyId = userToFamily[msg.sender];
        require(families[familyId].familyBalance >= msg.value, "Insufficient family funds");
        if (familyId == 0) revert UserNotInFamily();
        if (!familyUsers[familyId][msg.sender].isChild || !familyUsers[familyId][msg.sender].isActive) {
            revert OnlyActiveChild();
        }

        VendorInfo storage vendorInfo = familyVendors[familyId][vendor];
        if (!vendorInfo.isActive) revert NotApprovedVendor();

        Category category = vendorInfo.category;
        familyUsers[familyId][msg.sender].totalSpent += uint128(msg.value);

        (bool success, ) = vendor.call{value: msg.value}("");
        if (!success) revert TransferFailed();
        families[familyId].familyBalance -= msg.value;
        emit EmergencyPayment(familyId, msg.sender, vendor, msg.value, category);
        emit TransactionLogged(familyId, msg.sender, vendor, msg.value, category, true, block.timestamp);
    }

    function getRemainingLimit(uint256 familyId, address child, Category category) external view validFamily(familyId) returns (uint128 remaining) {
        CategorySpending storage spending = familyCategorySpending[familyId][child][category];
        remaining = spending.limit > spending.spent ? spending.limit - spending.spent : 0;
    }

    function getDetailedReport(uint256 familyId, address child) external view validFamily(familyId) 
        returns (
            uint128[MAX_CATEGORIES] memory spent,
            uint128[MAX_CATEGORIES] memory limits,
            uint128[MAX_CATEGORIES] memory remaining
        ) {
        if (!familyParents[familyId][msg.sender] && msg.sender != child) {
            revert OnlyParent();
        }

        for (uint8 i = 0; i < MAX_CATEGORIES; i++) {
            Category cat = Category(i);
            CategorySpending storage spending = familyCategorySpending[familyId][child][cat];

            spent[i] = spending.spent;
            limits[i] = spending.limit;
            remaining[i] = spending.limit > spending.spent ? spending.limit - spending.spent : 0;
        }
    }

    function getFamilyChildren(uint256 familyId) external view validFamily(familyId) onlyParentInFamily(familyId) returns (address[] memory) {
        return families[familyId].children;
    }

    function getFamilyParents(uint256 familyId) external view validFamily(familyId) onlyFamilyMember(familyId) returns (address[] memory) {
        return families[familyId].parents;
    }

    function getFamilyVendors(uint256 familyId) external view validFamily(familyId) onlyParentInFamily(familyId) returns (address[] memory) {
        return families[familyId].approvedVendors;
    }

    function getFamilyInfo(uint256 familyId) external view validFamily(familyId) onlyFamilyMember(familyId) 
        returns (
            uint256 id,
            address creator,
            bool active,
            uint32 createdAt,
            uint256 parentCount,
            uint256 childCount,
            uint256 vendorCount
        ) {
        Family storage family = families[familyId];
        return (
            family.familyId,
            family.familyCreator,
            family.isActive,
            family.createdAt,
            family.parents.length,
            family.children.length,
            family.approvedVendors.length
        );
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserFamily(address user) external view returns (uint256) {
        return userToFamily[user];
    }

    function pauseContract() external {
        bool isAnyParent = false;
        for (uint256 i = 1; i < nextFamilyId; i++) {
            if (familyParents[i][msg.sender]) {
                isAnyParent = true;
                break;
            }
        }
        if (!isAnyParent) revert OnlyParent();
        
        isPaused = true;
        emit ContractPaused();
    }

    function unpauseContract() external {
        bool isAnyParent = false;
        for (uint256 i = 1; i < nextFamilyId; i++) {
            if (familyParents[i][msg.sender]) {
                isAnyParent = true;
                break;
            }
        }
        if (!isAnyParent) revert OnlyParent();
        
        isPaused = false;
        emit ContractUnpaused();
    }

    function _resetLimitsIfNeeded(uint256 familyId, address child) internal {
        UserBudget storage budget = familyUsers[familyId][child];

        if (block.timestamp >= budget.lastResetTime + MONTH_DURATION) {
            for (uint8 i = 0; i < MAX_CATEGORIES; i++) {
                familyCategorySpending[familyId][child][Category(i)].spent = 0;
            }

            budget.totalSpent = 0;
            budget.lastResetTime = uint32(block.timestamp);

            emit LimitsReset(familyId, child, block.timestamp);
        }
    }

    receive() external payable {}
}