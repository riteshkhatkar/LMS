import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

interface Props {
  params: Promise<{ lessonId: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const steps = await prisma.trainingStep.findMany({
    where: { lessonId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    steps: steps.map((s) => ({
      id: s.id,
      stepNumber: s.stepNumber,
      title: s.title,
      instruction: s.instruction,
      actionType: s.actionType,
      uiElementTarget: s.uiElementTarget,
      screenshotUrl: s.screenshotUrl,
      verificationBadge: s.verificationBadge,
      disclaimer: s.disclaimer,
      sortOrder: s.sortOrder,
    })),
  });
}
