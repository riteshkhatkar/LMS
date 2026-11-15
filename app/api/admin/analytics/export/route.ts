import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * Sanitizes a string value to prevent CSV Formula Injection (CWE-1236).
 * Prepends a single quote if the field begins with '=', '+', '-', or '@'.
 */
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  const trimmed = str.trimStart();
  if (/^[=+\-@\t\r\n]/.test(trimmed) || /^[=+\-@\t\r\n]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const orgId = searchParams.get("organizationId");

  const where: any = {};
  if (courseId) where.courseId = courseId;
  if (orgId) where.user = { organizationId: orgId };

  // Fetch enrollments with user, course, and certificates
  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          learnerGroup: true,
          isOrgVerified: true,
          organization: { select: { name: true, code: true } },
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Query certificate status map
  const certificates = await prisma.certificate.findMany({
    select: {
      userId: true,
      courseId: true,
      id: true,
      status: true,
      grade: true,
      issueDate: true,
    },
  });

  const certMap = new Map<string, any>();
  for (const c of certificates) {
    certMap.set(`${c.userId}_${c.courseId}`, c);
  }

  // Build CSV headers
  const headers = [
    "Learner Name",
    "Learner Email",
    "Learner Classification",
    "Organization",
    "Organization Verified",
    "Course Title",
    "Course Category",
    "Course Progress (%)",
    "Completion Status",
    "Enrolled At",
    "Completed At",
    "Final Score",
    "Final Grade",
    "Certificate ID",
    "Certificate Status",
  ];

  const rows: string[] = [headers.map(sanitizeCsvValue).join(",")];

  for (const e of enrollments) {
    const cert = certMap.get(`${e.userId}_${e.courseId}`);
    const row = [
      e.user.name,
      e.user.email,
      e.user.learnerGroup || "Standard Student",
      e.user.organization?.name || "Independent",
      e.user.isOrgVerified ? "Verified" : "Unverified",
      e.course.title,
      e.course.category,
      `${Math.round(e.progressPct)}%`,
      e.isCompleted ? "Completed" : "In Progress",
      e.enrolledAt.toISOString().split("T")[0],
      e.completedAt ? e.completedAt.toISOString().split("T")[0] : "—",
      e.finalScore !== null && e.finalScore !== undefined ? `${e.finalScore}%` : "—",
      e.finalGrade || "—",
      cert ? cert.id : "—",
      cert ? cert.status : "NOT_ISSUED",
    ];
    rows.push(row.map(sanitizeCsvValue).join(","));
  }

  const csvContent = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM for Excel compatibility

  const filename = `learn_lms_report_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
