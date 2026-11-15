import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { Role, LearnerGroup } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, learnerGroup, organizationName } = body;
    const name = body.name || body.fullName;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 2. Validate LearnerGroup
    const validGroups: LearnerGroup[] = [
      LearnerGroup.FPO,
      LearnerGroup.FPC,
      LearnerGroup.STUDENT,
      LearnerGroup.NAVAL_OFFICER,
    ];
    const group = validGroups.includes(learnerGroup as LearnerGroup)
      ? (learnerGroup as LearnerGroup)
      : LearnerGroup.STUDENT;

    // 3. Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // 4. Handle optional organization
    let orgId: string | null = null;
    const orgQuery = body.organizationId || organizationName;
    if (orgQuery && typeof orgQuery === "string" && orgQuery.trim()) {
      const trimmed = orgQuery.trim();
      const existingOrg = await prisma.organization.findFirst({
        where: {
          OR: [
            { id: trimmed },
            { code: trimmed.toUpperCase() },
            { name: { equals: trimmed, mode: "insensitive" } },
          ],
        },
      });

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const code = trimmed
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .substring(0, 16);
        const org = await prisma.organization.upsert({
          where: { code },
          update: {},
          create: {
            name: trimmed,
            code,
          },
        });
        orgId = org.id;
      }
    }

    // 5. Hash password and create user STRICTLY as Role.LEARNER
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: Role.LEARNER, // Enforce learner role
        learnerGroup: group,
        organizationId: orgId,
      },
    });

    // 6. Create session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      learnerGroup: user.learnerGroup,
      organizationId: user.organizationId,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          learnerGroup: user.learnerGroup,
          organizationId: user.organizationId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
