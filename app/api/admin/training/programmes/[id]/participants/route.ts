import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateProgrammeProgress } from "@/lib/training/training";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      courses: {
        include: {
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      assignments: true,
    },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  // Collect target user IDs from assignments
  const directUserIds = new Set<string>();
  const orgIds = new Set<string>();
  const learnerGroups = new Set<string>();

  for (const a of programme.assignments) {
    if (a.userId) directUserIds.add(a.userId);
    if (a.organizationId) orgIds.add(a.organizationId);
    if (a.learnerGroup) learnerGroups.add(a.learnerGroup);
  }

  const userWhereOr: any[] = [];
  if (directUserIds.size > 0) {
    userWhereOr.push({ id: { in: Array.from(directUserIds) } });
  }
  if (orgIds.size > 0) {
    userWhereOr.push({ organizationId: { in: Array.from(orgIds) } });
  }
  if (learnerGroups.size > 0) {
    userWhereOr.push({ learnerGroup: { in: Array.from(learnerGroups) as any } });
  }

  const participants = userWhereOr.length > 0
    ? await prisma.user.findMany({
        where: {
          role: "LEARNER",
          OR: userWhereOr,
        },
        select: {
          id: true,
          name: true,
          email: true,
          learnerGroup: true,
          organization: { select: { id: true, name: true, code: true } },
          isOrgVerified: true,
          createdAt: true,
        },
      })
    : [];

  const courseIds = programme.courses.map((c) => c.courseId);

  // Fetch enrollments and certificates for all participants in constituent courses
  const pUserIds = participants.map((p) => p.id);
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { in: pUserIds },
      courseId: { in: courseIds },
    },
    select: {
      userId: true,
      courseId: true,
      progressPct: true,
      isCompleted: true,
      assessmentStatus: true,
      finalScore: true,
      finalGrade: true,
    },
  });

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: { in: pUserIds },
      OR: [
        { programmeId: programme.id },
        { courseId: { in: courseIds } },
      ],
      status: "VALID",
    },
    select: {
      id: true,
      userId: true,
      courseId: true,
      programmeId: true,
      grade: true,
      issueDate: true,
    },
  });

  // Assemble participant progress
  const participantRoster = participants.map((user) => {
    const userEnrollments = enrollments.filter((e) => e.userId === user.id);
    const progResult = calculateProgrammeProgress(programme.courses, userEnrollments);
    const userCerts = certificates.filter(
      (c) => c.userId === user.id && (c.programmeId === programme.id || courseIds.includes(c.courseId))
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      learnerGroup: user.learnerGroup,
      organization: user.organization?.name || "Independent",
      isOrgVerified: user.isOrgVerified,
      overallProgressPct: progResult.overallProgressPct,
      isCompleted: progResult.isCompleted,
      completedCoursesCount: progResult.completedCoursesCount,
      totalCourses: progResult.totalCourses,
      certificateIssued: userCerts.length > 0,
      certificateId: userCerts[0]?.id || null,
      coursesProgress: progResult.coursesProgress,
    };
  });

  return NextResponse.json({
    programme: {
      id: programme.id,
      title: programme.title,
      slug: programme.slug,
      totalCourses: programme.courses.length,
    },
    participantsCount: participantRoster.length,
    participants: participantRoster,
  });
}
