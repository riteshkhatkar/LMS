import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const user = await getSession();

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
      include: {
        gradingRules: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      courseId: course.id,
      courseTitle: course.title,
      rules: course.gradingRules,
      activeRule: course.gradingRules.find((r) => r.isActive) || course.gradingRules[0] || null,
    });
  } catch (error) {
    console.error("Fetch grading rules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const user = await getSession();

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
      include: {
        gradingRules: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const { passThreshold, gradeBMin, gradeBMax, gradeAThreshold } = body;

    const pass = Number(passThreshold);
    const bMin = Number(gradeBMin);
    const bMax = Number(gradeBMax);
    const aThresh = Number(gradeAThreshold);

    // Validation against gaps, inverted ranges, or overlapping brackets
    if (isNaN(pass) || isNaN(bMin) || isNaN(bMax) || isNaN(aThresh)) {
      return NextResponse.json(
        { error: "All threshold values must be valid numeric percentages." },
        { status: 400 }
      );
    }

    if (pass <= 0 || pass > 100 || aThresh > 100) {
      return NextResponse.json(
        { error: "Thresholds must be between 1% and 100%." },
        { status: 400 }
      );
    }

    if (pass > bMin || bMin > bMax || bMax > aThresh) {
      return NextResponse.json(
        {
          error:
            "Invalid grading bracket configuration. Thresholds must satisfy: Pass Threshold <= Grade B Min <= Grade B Max <= Grade A Threshold.",
        },
        { status: 400 }
      );
    }

    // Determine next version number
    const latestVersion = course.gradingRules[0]?.version ?? 0;
    const nextVersion = latestVersion + 1;

    // Transaction: Deactivate previous rules and publish the new rule version
    const newRule = await prisma.$transaction(async (tx) => {
      await tx.gradingRule.updateMany({
        where: { courseId: course.id },
        data: { isActive: false },
      });

      return await tx.gradingRule.create({
        data: {
          courseId: course.id,
          passThreshold: pass,
          gradeBMin: bMin,
          gradeBMax: bMax,
          gradeAThreshold: aThresh,
          version: nextVersion,
          isActive: true,
          isDefault: false,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Grading Rule version ${newRule.version} published successfully. New attempts will use this version.`,
      rule: newRule,
    });
  } catch (error) {
    console.error("Publish grading rule error:", error);
    return NextResponse.json({ error: "Failed to publish grading rule" }, { status: 500 });
  }
}
