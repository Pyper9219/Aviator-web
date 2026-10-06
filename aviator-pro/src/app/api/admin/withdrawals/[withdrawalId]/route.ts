import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminUserIds, getAuthenticatedUserId, isAdminUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { WithdrawalError } from "@/lib/withdrawals";

interface RouteContext {
  params: Promise<{ withdrawalId: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const adminId = await getAuthenticatedUserId(req);
  if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (getAdminUserIds().length === 0) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 503 });
  }
  if (!isAdminUserId(adminId)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { withdrawalId } = await context.params;
  if (!mongoose.isValidObjectId(withdrawalId)) {
    return NextResponse.json({ error: "Invalid withdrawal ID" }, { status: 400 });
  }

  let session: mongoose.ClientSession | undefined;
  try {
    const body = await req.json();
    const action = body.action;
    if (action !== "approve" && action !== "reject" && action !== "mark-paid") {
      return NextResponse.json({ error: "Unsupported withdrawal action" }, { status: 400 });
    }
    const rejectionReason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Provide a reason for rejecting this request" }, { status: 400 });
    }

    await connectToDatabase();
    session = await mongoose.startSession();
    let updated: unknown;
    const dbSession = session;

    await dbSession.withTransaction(async () => {
      const withdrawal = await Withdrawal.findById(withdrawalId).session(dbSession);
      if (!withdrawal) throw new WithdrawalError("Withdrawal request not found", 404);

      if (action === "mark-paid") {
        if (withdrawal.status !== "APPROVED") {
          throw new WithdrawalError("Only approved withdrawals can be marked paid", 409);
        }
        if (withdrawal.paidAt) throw new WithdrawalError("This withdrawal is already marked paid", 409);

        const debit = await User.updateOne(
          { _id: withdrawal.userId, lockedBalanceUSD: { $gte: withdrawal.amountUSD } },
          { $inc: { lockedBalanceUSD: -withdrawal.amountUSD } },
          { session: dbSession }
        );
        if (debit.modifiedCount !== 1) {
          throw new WithdrawalError("Reserved funds are missing; payout was not recorded", 409);
        }

        withdrawal.paidAt = new Date();
        withdrawal.paidBy = adminId;
      } else {
        if (withdrawal.status !== "PENDING") {
          throw new WithdrawalError("Only pending withdrawals can be approved or rejected", 409);
        }

        if (action === "approve") {
          withdrawal.status = "APPROVED";
        } else {
          const refund = await User.updateOne(
            { _id: withdrawal.userId, lockedBalanceUSD: { $gte: withdrawal.amountUSD } },
            {
              $inc: {
                lockedBalanceUSD: -withdrawal.amountUSD,
                balanceUSD: withdrawal.amountUSD,
                withdrawableBalanceUSD: withdrawal.amountUSD
              }
            },
            { session: dbSession }
          );
          if (refund.modifiedCount !== 1) {
            throw new WithdrawalError("Reserved funds are missing; request was not rejected", 409);
          }
          withdrawal.status = "REJECTED";
          withdrawal.rejectionReason = rejectionReason;
        }

        withdrawal.reviewedBy = adminId;
        withdrawal.reviewedAt = new Date();
      }

      await withdrawal.save({ session: dbSession });
      updated = withdrawal.toObject();
    });

    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    if (error instanceof WithdrawalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update withdrawal request", error);
    return NextResponse.json({ error: "Unable to update withdrawal request" }, { status: 503 });
  } finally {
    await session?.endSession();
  }
}
