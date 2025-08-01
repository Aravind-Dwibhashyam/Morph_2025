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

    address public immutable parent;
    mapping(address => bool) public parents;
    bool public isPaused;

    mapping(address => UserBudget) public users;
    mapping(address => mapping(Category => CategorySpending)) public categorySpending;
    mapping(address => VendorInfo) public vendors;

    address[] public children;
    address[] public approvedVendors;

    event ChildAdded(address indexed child);
    event ChildRemoved(address indexed child);
    event LimitSet(address indexed child, Category indexed category, uint256 amount);
    event VendorAdded(address indexed vendor, Category indexed category);
    event VendorRemoved(address indexed vendor);
    event PaymentMade(address indexed child, address indexed vendor, uint256 amount, Category indexed category);
    event EmergencyPayment(address indexed child, address indexed vendor, uint256 amount, Category indexed category);
    event TransactionLogged(address indexed child, address indexed vendor, uint256 amount, Category indexed category, bool emergency, uint256 timestamp);
    event LimitsReset(address indexed child, uint256 resetTime);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event ContractPaused();
    event ContractUnpaused();
    event ParentAdded(address newParent);

    error OnlyParent();
    error OnlyChild();
    error OnlyActiveChild();
    error NotApprovedVendor();
    error ExceedsLimit();
    error InvalidCategory();
    error ChildNotFound();
    error VendorNotFound(); 
    error TransferFailed();
    error InvalidAmount();
    error ChildAlreadyExists();
    error ContractPausedError();

    modifier onlyParent() {
        if (!parents[msg.sender]) revert OnlyParent();
        _;
    }

    modifier onlyActiveChild() {
        if (!users[msg.sender].isChild || !users[msg.sender].isActive) {
            revert OnlyActiveChild();
        }
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

    constructor() {
        parent = msg.sender;
        parents[msg.sender] = true;
        users[parent].isActive = true;
    }

    function addParent(address newParent) external onlyParent {
        parents[newParent] = true;
        emit ParentAdded(newParent);
    }

    function pauseContract() external onlyParent {
        isPaused = true;
        emit ContractPaused();
    }

    function unpauseContract() external onlyParent {
        isPaused = false;
        emit ContractUnpaused();
    }

    function addChild(address child) external onlyParent {
        if (users[child].isActive) revert ChildAlreadyExists();

        users[child] = UserBudget({
            isChild: true,
            isActive: true,
            lastResetTime: uint32(block.timestamp),
            totalMonthlyLimit: 0,
            totalSpent: 0
        });

        children.push(child);
        emit ChildAdded(child);
    }

    function removeChild(address child) external onlyParent {
        if (!users[child].isChild || !users[child].isActive) {
            revert ChildNotFound();
        }

        users[child].isActive = false;

        for (uint256 i = 0; i < children.length; i++) {
            if (children[i] == child) {
                children[i] = children[children.length - 1];
                children.pop();
                break;
            }
        }

        emit ChildRemoved(child);
    }

    function setLimit(address child, Category category, uint128 amount) external onlyParent {
        if (!users[child].isChild || !users[child].isActive) {
            revert ChildNotFound();
        }

        categorySpending[child][category].limit = amount;
        emit LimitSet(child, category, amount);
    }

    function addVendor(address vendor, Category category) external onlyParent {
        vendors[vendor] = VendorInfo({
            category: category,
            isActive: true
        });

        approvedVendors.push(vendor);
        emit VendorAdded(vendor, category);
    }

    function removeVendor(address vendor) external onlyParent {
        if (!vendors[vendor].isActive) revert VendorNotFound();

        vendors[vendor].isActive = false;

        for (uint256 i = 0; i < approvedVendors.length; i++) {
            if (approvedVendors[i] == vendor) {
                approvedVendors[i] = approvedVendors[approvedVendors.length - 1];
                approvedVendors.pop();
                break;
            }
        }

        emit VendorRemoved(vendor);
    }

    function makePayment(address vendor) external payable onlyActiveChild validAmount(msg.value) notPaused {
        VendorInfo storage vendorInfo = vendors[vendor];
        if (!vendorInfo.isActive) revert NotApprovedVendor();

        Category category = vendorInfo.category;
        _resetLimitsIfNeeded(msg.sender);
        CategorySpending storage spending = categorySpending[msg.sender][category];

        if (spending.spent + msg.value > spending.limit) {
            revert ExceedsLimit();
        }

        spending.spent += uint128(msg.value);
        users[msg.sender].totalSpent += uint128(msg.value);

        (bool success, ) = vendor.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit PaymentMade(msg.sender, vendor, msg.value, category);
        emit TransactionLogged(msg.sender, vendor, msg.value, category, false, block.timestamp);
    }

    function makeEmergencyPayment(address vendor) external payable onlyActiveChild validAmount(msg.value) notPaused {
        VendorInfo storage vendorInfo = vendors[vendor];
        if (!vendorInfo.isActive) revert NotApprovedVendor();

        Category category = vendorInfo.category;
        users[msg.sender].totalSpent += uint128(msg.value);

        (bool success, ) = vendor.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit EmergencyPayment(msg.sender, vendor, msg.value, category);
        emit TransactionLogged(msg.sender, vendor, msg.value, category, true, block.timestamp);
    }

    function getRemainingLimit(address child, Category category) external view returns (uint128 remaining) {
        CategorySpending storage spending = categorySpending[child][category];
        remaining = spending.limit - spending.spent;
    }

    function getDetailedReport(address child) external view returns (
        uint128[MAX_CATEGORIES] memory spent,
        uint128[MAX_CATEGORIES] memory limits,
        uint128[MAX_CATEGORIES] memory remaining
    ) {
        if (msg.sender != parent && !parents[msg.sender] && msg.sender != child) {
            revert OnlyParent();
        }

        for (uint8 i = 0; i < MAX_CATEGORIES; i++) {
            Category cat = Category(i);
            CategorySpending storage spending = categorySpending[child][cat];

            spent[i] = spending.spent;
            limits[i] = spending.limit;
            remaining[i] = spending.limit > spending.spent ? spending.limit - spending.spent : 0;
        }
    }

    function getAllChildren() external view onlyParent returns (address[] memory) {
        return children;
    }

    function getAllVendors() external view onlyParent returns (address[] memory) {
        return approvedVendors;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _resetLimitsIfNeeded(address child) internal {
        UserBudget storage budget = users[child];

        if (block.timestamp >= budget.lastResetTime + MONTH_DURATION) {
            for (uint8 i = 0; i < MAX_CATEGORIES; i++) {
                categorySpending[child][Category(i)].spent = 0;
            }

            budget.totalSpent = 0;
            budget.lastResetTime = uint32(block.timestamp);

            emit LimitsReset(child, block.timestamp);
        }
    }

    receive() external payable {}
}
