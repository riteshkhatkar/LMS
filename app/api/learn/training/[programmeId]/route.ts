import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canUserAccessProgramme, calculateProgrammeProgress } from "@/lib/training/training";

interface Props {
  params: Promise<{ programmeId: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { programmeId } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id: programmeId }, { slug: programmeId }] },
    include: {
      courses: {
        include: {
          course: {
            include: {
              sections: {
                include: {
                  lessons: {
                    select: {
                      id: true,
                      title: true,
                      mediaType: true,
                      durationMinutes: true,
                      sortOrder: true,
                    },
                    orderBy: { sortOrder: "asc" },
                  },
                },
                orderBy: { sortOrder: "asc" },
              },
              quizzes: {
                where: { isPublished: true },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  passingPercent: true,
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { id: true, name: true, code: true } },
    },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  // CONFIDENTIALITY & CLEARANCE GUARD
  const hasAccess = canUserAccessProgramme(
    { role: session.role, learnerGroup: session.learnerGroup },
    { isRestricted: programme.isRestricted, targetGroup: programme.targetGroup }
  );

  if (!hasAccess) {
    return NextResponse.json(
      {
        error:
          "Access denied: This training programme requires operational clearance.",
      },
      { status: 403 }
    );
  }

  const courseIds = programme.courses.map((c) => c.courseId);

  // Fetch learner's enrollments and lesson progress for these courses
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.id,
      courseId: { in: courseIds },
    },
    select: {
      courseId: true,
      progressPct: true,
      isCompleted: true,
      assessmentStatus: true,
      finalScore: true,
      finalGrade: true,
    },
  });

  const progress = calculateProgrammeProgress(programme.courses, enrollments);

  // Check if user has an issued certificate
  const cert = await prisma.certificate.findFirst({
    where: {
      userId: session.id,
      OR: [{ programmeId: programme.id }, { courseId: { in: courseIds } }],
      status: "VALID",
    },
    select: {
      id: true,
      grade: true,
      issueDate: true,
    },
  });

  return NextResponse.json({
    programme: {
      id: programme.id,
      title: programme.title,
      slug: programme.slug,
      description: programme.description,
      targetGroup: programme.targetGroup,
      organization: programme.organization?.name || null,
      estimatedDurationMinutes: programme.estimatedDurationMinutes,
      isRequired: programme.isRequired,
      isRestricted: programme.isRestricted,
      certificateEnabled: programme.certificateEnabled,
      passingScorePercent: programme.passingScorePercent,
      progress: {
        totalCourses: progress.totalCourses,
        totalRequiredCourses: progress.totalRequiredCourses,
        completedCoursesCount: progress.completedCoursesCount,
        completedRequiredCount: progress.completedRequiredCount,
        overallProgressPct: progress.overallProgressPct,
        isCompleted: progress.isCompleted,
        allRequiredPassed: progress.allRequiredPassed,
      },
      certificate: cert || null,
      courses: programme.courses.map((c) => {
        const cp = progress.coursesProgress.find((p) => p.courseId === c.courseId);
        return {
          id: c.course.id,
          title: c.course.title,
          slug: c.course.slug,
          thumbnail: c.course.thumbnail,
          durationMinutes: c.course.durationMinutes,
          isRequired: c.isRequired,
          sortOrder: c.sortOrder,
          sectionsCount: c.course.sections.length,
          lessonsCount: c.course.sections.flatMap((s) => s.lessons).length,
          quizzesCount: c.course.quizzes.length,
          isEnrolled: cp?.isEnrolled || false,
          progressPct: cp?.progressPct || 0,
          isCompleted: cp?.isCompleted || false,
          assessmentStatus: cp?.assessmentStatus || "NOT_STARTED",
          finalScore: cp?.finalScore || null,
          finalGrade: cp?.finalGrade || null,
          sections: c.course.sections,
        };
      }),
    },
  });
}
