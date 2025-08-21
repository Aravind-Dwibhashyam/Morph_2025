// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";   
import {FamilySharedWallet} from "../src/Morph.sol";

contract FamilySharedWalletTest is Test {
    FamilySharedWallet public wallet;
    
    // Test accounts
    address public parent1;
    address public parent2;
    address public child1;
    address public child2;
    address public vendor1;
    address public vendor2;
    address public nonMember;
    
    uint256 public constant FAMILY_CREATION_FEE = 0.05 ether;
    uint256 public constant INITIAL_FUNDING = 1 ether;
    
    // Events for testing
    event FamilyCreated(uint256 indexed familyId, address indexed creator);
    event ChildAdded(uint256 indexed familyId, address indexed child, address indexed addedBy);
    event LimitSet(uint256 indexed familyId, address indexed child, FamilySharedWallet.Category indexed category, uint256 amount, address setBy);
    event VendorAdded(uint256 indexed familyId, address indexed vendor, FamilySharedWallet.Category indexed category, address addedBy);
    event PaymentMade(uint256 indexed familyId, address indexed child, address indexed vendor, uint256 amount, FamilySharedWallet.Category category);
    event EmergencyPayment(uint256 indexed familyId, address indexed child, address indexed vendor, uint256 amount, FamilySharedWallet.Category category);
    
    function setUp() public {
        wallet = new FamilySharedWallet();
        
        // Create test accounts that have inital ETH
        parent1 = makeAddr("parent1");
        parent2 = makeAddr("parent2");
        child1 = makeAddr("child1");
        child2 = makeAddr("child2");
        vendor1 = makeAddr("vendor1");
        vendor2 = makeAddr("vendor2");
        nonMember = makeAddr("nonMember");
        
        // Fund these accounts
        vm.deal(parent1, 10 ether);
        vm.deal(parent2, 10 ether);
        vm.deal(child1, 1 ether);
        vm.deal(child2, 1 ether);
        vm.deal(vendor1, 1 ether);
        vm.deal(vendor2, 1 ether);
        vm.deal(nonMember, 1 ether);
    }
    
    function test_FamilyCreation() public {
        vm.startPrank(parent1);
        
        // Test family creation with sufficient funds
        vm.expectEmit(true, true, false, true);
        emit FamilyCreated(1, parent1);
        
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Verify family creation first
        assertEq(familyId, 1);
        assertEq(wallet.getUserFamily(parent1), 1);
        
        // Verify family info
        (uint256 id, address creator, bool active, uint32 createdAt, uint256 parentCount, uint256 childCount, uint256 vendorCount, uint256 familyBalance) = wallet.getFamilyInfo(1);
        assertEq(id, 1);
        assertEq(creator, parent1);
        assertTrue(active);
        assertEq(parentCount, 1);
        assertEq(childCount, 0);
        assertEq(vendorCount, 0);
        
        vm.stopPrank();
    }
    
    function test_FamilyCreationInsufficientFunds() public {
        vm.startPrank(parent1);
        
        // let's test family creation with insufficient funds
        vm.expectRevert("Not Enough Amount");
        wallet.createFamily{value: 0.01 ether}();
        
        vm.stopPrank();
    }
    
    function test_FamilyCreationAlreadyInFamily() public {
        vm.startPrank(parent1);
        
        // Create first family
        wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Try to create another family
        vm.expectRevert(FamilySharedWallet.UserAlreadyInFamily.selector);
        wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        vm.stopPrank();
    }
    
    function test_AddFunds() public {
        vm.startPrank(parent1);
        
        // Create family first
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Add funds to family
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        // Verify family balance updated
        (, , , , , , , uint256 familyBalance) = wallet.getFamilyInfo(familyId);
        assertEq(familyBalance, INITIAL_FUNDING);
        
        vm.stopPrank();
    }
    
    function test_AddParentToFamily() public {
        vm.startPrank(parent1);
        
        // Create family
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Add second parent
        wallet.addParentToFamily(familyId, parent2);
        
        // Verify parent added
        assertEq(wallet.getUserFamily(parent2), familyId);
        
        // Verify parent count increased
        (, , , , uint256 parentCount, , , ) = wallet.getFamilyInfo(familyId);
        assertEq(parentCount, 2);
        
        vm.stopPrank();
    }
    
    function test_AddChildToFamily() public {
        vm.startPrank(parent1);
        
        // Create family
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Add child
        vm.expectEmit(true, true, true, true);
        emit ChildAdded(familyId, child1, parent1);
        
        wallet.addChildToFamily(familyId, child1);
        
        // Verify child added
        assertEq(wallet.getUserFamily(child1), familyId);
        
        // Verify child count increased
        (, , , , , uint256 childCount, , ) = wallet.getFamilyInfo(familyId);
        assertEq(childCount, 1);
        
        vm.stopPrank();
    }
    
    function test_RemoveChildFromFamily() public {
        vm.startPrank(parent1);
        
        // Create family and add child
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        
        // Remove child
        wallet.removeChildFromFamily(familyId, child1);
        
        // Verify child removed
        assertEq(wallet.getUserFamily(child1), 0);
        
        // Verify child count decreased
        (, , , , , uint256 childCount, , ) = wallet.getFamilyInfo(familyId);
        assertEq(childCount, 0);
        
        vm.stopPrank();
    }
    
    function test_SetLimitForChild() public {
        vm.startPrank(parent1);
        
        // Create family and add one child
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        
        // Set spending limit for the children
        uint128 limit = 0.1 ether;
        vm.expectEmit(true, true, true, true);
        emit LimitSet(familyId, child1, FamilySharedWallet.Category.Food, limit, parent1);
        
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, limit);
        
        // Verify the limit set
        uint128 remaining = wallet.getRemainingLimit(familyId, child1, FamilySharedWallet.Category.Food);
        assertEq(remaining, limit);
        
        vm.stopPrank();
    }
    
    function test_AddVendorToFamily() public {
        vm.startPrank(parent1);
        
        // Create family
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        // Adding vendors now
        vm.expectEmit(true, true, true, true);
        emit VendorAdded(familyId, vendor1, FamilySharedWallet.Category.Food, parent1);
        
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        
        // Verify if the vendor count has increased
        (, , , , , , uint256 vendorCount, ) = wallet.getFamilyInfo(familyId);
        assertEq(vendorCount, 1);
        
        vm.stopPrank();
    }
    
    function test_MakePayment() public {
        vm.startPrank(parent1);
        
        
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 0.5 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        vm.stopPrank();
        
        // Child makes payment now
        vm.startPrank(child1);
        uint256 paymentAmount = 0.1 ether;
        
        vm.expectEmit(true, true, true, true);
        emit PaymentMade(familyId, child1, vendor1, paymentAmount, FamilySharedWallet.Category.Food);
        
        wallet.makePayment{value: paymentAmount}(vendor1);
        
        // Verify payment processed
        uint128 remaining = wallet.getRemainingLimit(familyId, child1, FamilySharedWallet.Category.Food);
        assertEq(remaining, 0.4 ether);
        
        // Verify vendor received payment
        assertEq(vendor1.balance, 1 ether + paymentAmount);
        
        vm.stopPrank();
    }
    
    function test_MakePaymentExceedsLimit() public {
        vm.startPrank(parent1);
        
        // Setup
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 0.1 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        vm.stopPrank();
        
        // Child tries to exceed limit
        vm.startPrank(child1);
        
        vm.expectRevert(FamilySharedWallet.ExceedsLimit.selector);
        wallet.makePayment{value: 0.2 ether}(vendor1);
        
        vm.stopPrank();
    }
    
    function test_MakeEmergencyPayment() public {
        vm.startPrank(parent1);
        
        // Setup
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 0.1 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        vm.stopPrank();
        
        // Child makes emergency payment and hence bypassing the limits
        vm.startPrank(child1);
        uint256 emergencyAmount = 0.5 ether; // Exceeds normal limit
        
        vm.expectEmit(true, true, true, true);
        emit EmergencyPayment(familyId, child1, vendor1, emergencyAmount, FamilySharedWallet.Category.Food);
        
        wallet.makeEmergencyPayment{value: emergencyAmount}(vendor1);
        
        // Verify emergency payment processed despite exceeding limit
        assertEq(vendor1.balance, 1 ether + emergencyAmount);
        
        vm.stopPrank();
    }
    
    function test_UnauthorizedAccess() public {
        vm.startPrank(parent1);
        
        // Create family
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        
        vm.stopPrank();
        
        // Non-member tries to add child
        vm.startPrank(nonMember);
        
        vm.expectRevert(FamilySharedWallet.OnlyParent.selector);
        wallet.addChildToFamily(familyId, child1);
        
        vm.stopPrank();
        
        // Non-child tries to make payment
        vm.startPrank(nonMember);
        
        vm.expectRevert(FamilySharedWallet.OnlyActiveChild.selector);
        wallet.makePayment{value: 0.1 ether}(vendor1);
        
        vm.stopPrank();
    }
    
    function test_VendorLimits() public {
        vm.startPrank(parent1);
        
        // Setup
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 1 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        // Set vendor spending limit
        uint128 vendorLimit = 0.2 ether;
        wallet.setVendorLimit(familyId, vendor1, vendorLimit);
        
        vm.stopPrank();
        
        // Child makes payment within vendor limit
        vm.startPrank(child1);
        wallet.makePayment{value: 0.1 ether}(vendor1);
        
        // Child tries to exceed vendor limit
        vm.expectRevert(FamilySharedWallet.ExceedsLimit.selector);
        wallet.makePayment{value: 0.15 ether}(vendor1);
        
        vm.stopPrank();
    }
    
    function test_MonthlyLimitReset() public {
        vm.startPrank(parent1);
        
        // Setup
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 0.5 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        vm.stopPrank();
        
        // Child spends near limit
        vm.startPrank(child1);
        wallet.makePayment{value: 0.4 ether}(vendor1);
        
        // Verify remaining limit
        uint128 remaining = wallet.getRemainingLimit(familyId, child1, FamilySharedWallet.Category.Food);
        assertEq(remaining, 0.1 ether);
        
        // Fast forward 31 days
        vm.warp(block.timestamp + 31 days);
        
        // Make another payment (should reset limits)
        wallet.makePayment{value: 0.3 ether}(vendor1);
        
        // Verify limit was reset
        uint128 newRemaining = wallet.getRemainingLimit(familyId, child1, FamilySharedWallet.Category.Food);
        assertEq(newRemaining, 0.2 ether); // 0.5 - 0.3 = 0.2
        
        vm.stopPrank();
    }
    
    function test_ContractPauseUnpause() public {
        vm.startPrank(parent1);
        
        // Create family
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        // Pause contract
        wallet.pauseContract();
        
        vm.stopPrank();
        
        // Try to make payment while paused
        vm.startPrank(child1);
        
        vm.expectRevert(FamilySharedWallet.ContractPausedError.selector);
        wallet.makePayment{value: 0.1 ether}(vendor1);
        
        vm.stopPrank();
        
        // Unpause contract
        vm.startPrank(parent1);
        wallet.unpauseContract();
        
        vm.stopPrank();
        
        // Payment should work again
        vm.startPrank(child1);
        wallet.makePayment{value: 0.1 ether}(vendor1);
        
        vm.stopPrank();
    }
    
    function test_GetDetailedReport() public {
        vm.startPrank(parent1);
        
        // Setup
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 0.5 ether);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Education, 0.3 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: INITIAL_FUNDING}(familyId);
        
        vm.stopPrank();
        
        // Child makes some payments
        vm.startPrank(child1);
        wallet.makePayment{value: 0.2 ether}(vendor1);
        
        vm.stopPrank();
        
        // Parent gets detailed report
        vm.startPrank(parent1);
        
        (uint128[5] memory spent, uint128[5] memory limits, uint128[5] memory remaining) = wallet.getDetailedReport(familyId, child1);
        
        assertEq(spent[0], 0.2 ether); // Food category
        assertEq(limits[0], 0.5 ether);
        assertEq(remaining[0], 0.3 ether);
        
        assertEq(spent[1], 0); // Education category
        assertEq(limits[1], 0.3 ether);
        assertEq(remaining[1], 0.3 ether);
        
        vm.stopPrank();
    }
    
    function test_InsufficientFamilyFunds() public {
        vm.startPrank(parent1);
        
        // Setup with minimal funds
        uint256 familyId = wallet.createFamily{value: FAMILY_CREATION_FEE}();
        wallet.addChildToFamily(familyId, child1);
        wallet.setLimitForChild(familyId, child1, FamilySharedWallet.Category.Food, 1 ether);
        wallet.addVendorToFamily(familyId, vendor1, FamilySharedWallet.Category.Food);
        wallet.addFunds{value: 0.05 ether}(familyId); // Very small amount
        
        vm.stopPrank();
        
        // Child tries to spend more than family balance
        vm.startPrank(child1);
        
        vm.expectRevert("Insufficient family funds");
        wallet.makePayment{value: 0.1 ether}(vendor1);
        
        vm.stopPrank();
    }
}
