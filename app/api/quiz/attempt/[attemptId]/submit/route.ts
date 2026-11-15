import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { evaluateAttempt } from "@/lib/assessment/scoring";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to another learner's assessment" },
        { status: 403 }
      );
    }

    // Evaluate attempt authoritatively on the server
    const result = await evaluateAttempt(attemptId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json(
      { error: "An error occurred while evaluating your assessment" },
      { status: 500 }
    );
  }
}
