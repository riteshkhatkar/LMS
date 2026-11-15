import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TrainingProgrammeStatus } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  // Toggle or read target status
  let newStatus: TrainingProgrammeStatus;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.status && Object.values(TrainingProgrammeStatus).includes(body.status)) {
      newStatus = body.status;
    } else {
      newStatus =
        programme.status === TrainingProgrammeStatus.PUBLISHED
          ? TrainingProgrammeStatus.DRAFT
          : TrainingProgrammeStatus.PUBLISHED;
    }
  } catch {
    newStatus =
      programme.status === TrainingProgrammeStatus.PUBLISHED
        ? TrainingProgrammeStatus.DRAFT
        : TrainingProgrammeStatus.PUBLISHED;
  }

  const updated = await prisma.trainingProgramme.update({
    where: { id: programme.id },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: "TOGGLE_TRAINING_PROGRAMME_STATUS",
      target: programme.id,
      details: { previousStatus: programme.status, newStatus },
    },
  });

  return NextResponse.json({
    message: `Programme status changed to ${newStatus}`,
    programme: updated,
  });
}
