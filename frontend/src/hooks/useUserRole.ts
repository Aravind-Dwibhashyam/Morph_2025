'use client';

import { useAccount, useReadContract } from "wagmi";
import FamilySharedWalletJSON from "../abis/FamilySharedWallet.json";
import { Abi } from "viem";
import { useMemo } from "react";

// --- TYPE DEFINITIONS ---
// Defines the structure of the UserBudget struct returned by the smart contract.
interface UserBudgetStruct {
  isChild: boolean;
  isActive: boolean;
  lastResetTime: bigint;
  totalMonthlyLimit: bigint;
  totalSpent: bigint;
}

// --- HOOK: useUserRole ---
// This hook determines the role ('parent', 'child', or null) of the connected user within a family.
export function useUserRole() {
  const { address: connectedAddress } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
  const FamilySharedWalletABI = FamilySharedWalletJSON.abi as Abi;

  // 1. Fetch the family ID for the current user.
  const { data: familyId, isLoading: isLoadingFamilyId } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: "getUserFamily",
    args: [connectedAddress],
    query: { enabled: !!connectedAddress },
  });

  // 2. Check if the user is a parent, but only if a valid family ID has been found.
  const { data: isParent, isLoading: isLoadingIsParent } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: "familyParents",
    args: familyId && connectedAddress ? [familyId, connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!familyId && Number(familyId) > 0,
    },
  });

  // 3. If the parent check is complete and the user is NOT a parent, check if they are a child.
  const { data: userBudget, isLoading: isLoadingBudget } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: "familyUsers",
    args: familyId && connectedAddress ? [familyId, connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!familyId && Number(familyId) > 0 && isParent === false,
    },
  });

  // 4. Determine the role based on the results of the contract calls.
  const role: "parent" | "child" | null | "loading" = useMemo(() => {
    if (isLoadingFamilyId) {
      return "loading";
    }

    if (!familyId || Number(familyId) === 0) {
      return null; // Not in a family
    }

    if (isLoadingIsParent) {
        return "loading";
    }

    if (isParent) {
      return "parent";
    }

    // If the user is NOT a parent, we must wait for the child status check to complete.
    if (isParent === false && isLoadingBudget) {
        return "loading";
    }

    // The useReadContract hook returns an array for structs. We destructure it here.
    const userBudgetArray = userBudget as readonly [boolean, boolean, number, bigint, bigint] | undefined;
    if (userBudgetArray) {
        const [isChild, isActive] = userBudgetArray;
        if (isChild && isActive) {
            return "child";
        }
    }

    // If none of the above, the user is in a family but has no active role.
    return null; 
  }, [familyId, isParent, userBudget, isLoadingFamilyId, isLoadingIsParent, isLoadingBudget]);

  // As requested, log the role to the console for debugging.
  console.log("User Role:", role);

  return { role, familyId: familyId ? Number(familyId) : null };
}
