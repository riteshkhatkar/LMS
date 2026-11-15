import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sanitizeCsvValue } from "@/lib/training/csv";
import { calculateProgrammeProgress } from "@/lib/training/training";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const programmeId = searchParams.get("programmeId");

  const where: any = {};
  if (programmeId) {
    where.OR = [{ id: programmeId }, { slug: programmeId }];
  }

  const programmes = await prisma.trainingProgramme.findMany({
    where,
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
      organization: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Programme Title",
    "Programme Slug",
    "Target Classification",
    "Programme Status",
    "Learner Name",
    "Learner Email",
    "Learner Group",
    "Organization",
    "Organization Verified",
    "Constituent Courses Count",
    "Overall Progress (%)",
    "Programme Completed",
    "Certificate Issued",
  ];

  const rows: string[] = [headers.map(sanitizeCsvValue).join(",")];

  for (const prog of programmes) {
    const directUserIds = new Set<string>();
    const orgIds = new Set<string>();
    const learnerGroups = new Set<string>();

    for (const a of prog.assignments) {
      if (a.userId) directUserIds.add(a.userId);
      if (a.organizationId) orgIds.add(a.organizationId);
      if (a.learnerGroup) learnerGroups.add(a.learnerGroup);
    }

    const userWhereOr: any[] = [];
    if (directUserIds.size > 0) userWhereOr.push({ id: { in: Array.from(directUserIds) } });
    if (orgIds.size > 0) userWhereOr.push({ organizationId: { in: Array.from(orgIds) } });
    if (learnerGroups.size > 0) userWhereOr.push({ learnerGroup: { in: Array.from(learnerGroups) as any } });

    if (userWhereOr.length === 0) continue;

    const participants = await prisma.user.findMany({
      where: { role: "LEARNER", OR: userWhereOr },
      select: {
        id: true,
        name: true,
        email: true,
        learnerGroup: true,
        isOrgVerified: true,
        organization: { select: { name: true } },
      },
    });

    const courseIds = prog.courses.map((c) => c.courseId);
    const pIds = participants.map((p) => p.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: { in: pIds }, courseId: { in: courseIds } },
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

    const certs = await prisma.certificate.findMany({
      where: {
        userId: { in: pIds },
        OR: [{ programmeId: prog.id }, { courseId: { in: courseIds } }],
        status: "VALID",
      },
      select: { userId: true },
    });
    const certUserSet = new Set(certs.map((c) => c.userId));

    for (const user of participants) {
      const userEnrollments = enrollments.filter((e) => e.userId === user.id);
      const progress = calculateProgrammeProgress(prog.courses, userEnrollments);
      const hasCert = certUserSet.has(user.id);

      const row = [
        prog.title,
        prog.slug,
        prog.targetGroup || "ALL",
        prog.status,
        user.name,
        user.email,
        user.learnerGroup || "GENERAL",
        user.organization?.name || "Independent",
        user.isOrgVerified ? "Yes" : "No",
        prog.courses.length,
        progress.overallProgressPct,
        progress.isCompleted ? "Yes" : "No",
        hasCert ? "Yes" : "No",
      ];

      rows.push(row.map(sanitizeCsvValue).join(","));
    }
  }

  const csvContent = rows.join("\r\n");
  const filename = `learn-lms-training-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
