import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Instructor access required" }, { status: 403 });
  }

  // Find courses instructed by this instructor
  const instructedCourses = await prisma.course.findMany({
    where: { instructorId: session.id },
    select: { id: true },
  });
  const courseIds = instructedCourses.map((c) => c.id);

  // Find programmes containing these courses, or created for instructor's organization, or if admin all programmes
  const where: any = {};
  if (session.role !== "ADMIN") {
    where.OR = [
      { courses: { some: { courseId: { in: courseIds } } } },
      ...(session.organizationId ? [{ organizationId: session.organizationId }] : []),
    ];
  }

  const programmes = await prisma.trainingProgramme.findMany({
    where,
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              instructorId: true,
              durationMinutes: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { name: true, code: true } },
      assignments: true,
      _count: {
        select: { certificates: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    programmes: programmes.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      targetGroup: p.targetGroup,
      status: p.status,
      estimatedDurationMinutes: p.estimatedDurationMinutes,
      isRestricted: p.isRestricted,
      organization: p.organization?.name || null,
      courses: p.courses.map((c) => ({
        id: c.course.id,
        title: c.course.title,
        slug: c.course.slug,
        isMine: c.course.instructorId === session.id,
        isRequired: c.isRequired,
        sortOrder: c.sortOrder,
      })),
      assignmentsCount: p.assignments.length,
      certificatesCount: p._count.certificates,
    })),
  });
}
