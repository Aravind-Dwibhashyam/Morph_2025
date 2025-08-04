// hooks/useUserRole.ts
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import contractABI from "@/abis/FamilySharedWallet.json";
import { Abi } from "viem";

interface UserBudgetStruct {
  isChild: boolean;
  isActive: boolean;
  lastResetTime: bigint;
  totalMonthlyLimit: bigint;
  totalSpent: bigint;
}

export function useUserRole(contractAddress: `0x${string}`) {
  const { address } = useAccount();

  // 1. Fetch familyId for current user
  const {
    data: familyIdRaw,
    isLoading: loadingFamId,
    error: errorFamId,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI.abi as Abi,   // wagmi/viem expects ABI array, not { abi: [...] }
    functionName: "getUserFamily",
    args: [address],
    query: { enabled: !!address },
  });

  // 2. If familyId exists (and >0), check isParent
  const {
    data: isParent,
    isLoading: loadingIsParent,
    error: errorIsParent,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI.abi as Abi,
    functionName: "familyParents",
    args: familyIdRaw && address ? [familyIdRaw, address] : undefined,
    query: {
      enabled: !!address && !!familyIdRaw && BigInt(familyIdRaw as any) > BigInt(0),
    },
  });

  // 3. If not parent, check child's budget struct (to know if child & active)
  const {
    data: userBudget,
    isLoading: loadingBudget,
    error: errorBudget,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI.abi as Abi,
    functionName: "familyUsers",
    args: familyIdRaw && address ? [familyIdRaw, address] : undefined,
    query: {
      enabled:
        !!address &&
        !!familyIdRaw &&
        BigInt(familyIdRaw as any) > BigInt(0) &&
        isParent === false,
    },
  });

  // -------- Logic to set role --------
  let role: "parent" | "child" | null | "loading" = "loading";
  let familyId: number | null = null;
  const userBudgetTyped = userBudget as UserBudgetStruct;

  if (loadingFamId || loadingIsParent || loadingBudget) {
    role = "loading";
  } else if (
    !address ||
    !familyIdRaw ||
    (BigInt(familyIdRaw as any) === BigInt(0))
  ) {
    role = null;
    familyId = null;
  } else if (isParent) {
    role = "parent";
    familyId = Number(familyIdRaw);
  } else if (userBudget && userBudgetTyped.isChild && userBudgetTyped.isActive) {
    role = "child";
    familyId = Number(familyIdRaw);
  } else {
    role = null;
    familyId = Number(familyIdRaw);
  }

  return { role, familyId };
}
