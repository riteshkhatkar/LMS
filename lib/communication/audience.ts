/**
 * Learn LMS — Audience Targeting & Confidentiality Engine (Phase 6)
 * ORELSE (https://www.orelse.ai)
 *
 * Implements cohort resolution, suppression filtering, and
 * strict naval clearance confidentiality guards.
 */

import { PrismaClient, LearnerGroup, User } from "@prisma/client";
import { RecipientTarget } from "./delivery";
import crypto from "crypto";

export interface AudienceDefinition {
  sendToAll?: boolean;
  cohorts?: LearnerGroup[];
  organizationId?: string;
  courseId?: string;
  category?: "general" | "courses" | "training";
}

/**
 * Pure evaluation function to verify cohort clearance rules
 * Enforces: Naval Officer communications are never leaked to civilian cohorts,
 * and civilian-only campaigns do not broadcast to restricted naval units.
 */
export function isUserEligibleForCohort(
  userLearnerGroup: LearnerGroup | null | undefined,
  targetCohorts: LearnerGroup[] | undefined,
  sendToAll: boolean = false
): boolean {
  if (sendToAll) {
    return true;
  }

  if (!targetCohorts || targetCohorts.length === 0) {
    return false;
  }

  // If targeting specifically NAVAL_OFFICER, only NAVAL_OFFICER is eligible
  const isNavalTarget = targetCohorts.includes(LearnerGroup.NAVAL_OFFICER);
  const isSolelyNaval = isNavalTarget && targetCohorts.length === 1;

  if (isSolelyNaval) {
    return userLearnerGroup === LearnerGroup.NAVAL_OFFICER;
  }

  // If target cohorts do NOT include NAVAL_OFFICER, naval officers are excluded for segregation
  if (!isNavalTarget && userLearnerGroup === LearnerGroup.NAVAL_OFFICER) {
    return false;
  }

  if (!userLearnerGroup) {
    return false;
  }

  return targetCohorts.includes(userLearnerGroup);
}

/**
 * Pure helper to verify if subscription preferences permit the campaign category
 */
export function isSubscriptionPermitted(
  subscription: {
    isSubscribed: boolean;
    generalNews: boolean;
    courseAlerts: boolean;
    trainingAnnouncements: boolean;
  } | null | undefined,
  category: "general" | "courses" | "training" = "general"
): boolean {
  if (!subscription) return true; // Default opt-in
  if (!subscription.isSubscribed) return false;

  switch (category) {
    case "courses":
      return subscription.courseAlerts;
    case "training":
      return subscription.trainingAnnouncements;
    case "general":
    default:
      return subscription.generalNews;
  }
}

/**
 * Generate a cryptographically secure opaque unsubscribe token
 */
export function generateUnsubscribeToken(email: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(`${email}_${salt}_${Date.now()}`).digest("hex");
  return `unsub_${hash.substring(0, 32)}`;
}

/**
 * Resolves audience recipients against the PostgreSQL database
 */
export async function resolveAudienceRecipients(
  prisma: PrismaClient,
  audience: AudienceDefinition
): Promise<RecipientTarget[]> {
  const category = audience.category || "general";
  const recipients: RecipientTarget[] = [];
  const seenEmails = new Set<string>();

  // 1. Resolve registered platform users
  const userWhere: any = {
    isActive: true,
  };

  if (audience.organizationId) {
    userWhere.organizationId = audience.organizationId;
  }

  if (audience.courseId) {
    userWhere.enrollments = {
      some: {
        courseId: audience.courseId,
      },
    };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    include: {
      newsletterSubscription: true,
    },
  });

  for (const user of users) {
    // Check cohort filter
    if (audience.cohorts && audience.cohorts.length > 0) {
      if (!isUserEligibleForCohort(user.learnerGroup, audience.cohorts, audience.sendToAll)) {
        continue;
      }
    }

    // Check subscription status
    const sub = user.newsletterSubscription;
    if (sub && !isSubscriptionPermitted(sub, category)) {
      continue; // Suppressed by user choice
    }

    // Ensure unsubscribe token exists
    let token = sub?.unsubscribeToken;
    if (!token) {
      token = generateUnsubscribeToken(user.email);
      await prisma.newsletterSubscription.upsert({
        where: { email: user.email },
        update: { userId: user.id },
        create: {
          email: user.email,
          userId: user.id,
          unsubscribeToken: token,
          consentSource: "SYSTEM_RESOLVED",
        },
      });
    }

    if (!seenEmails.has(user.email)) {
      seenEmails.add(user.email);
      recipients.push({
        email: user.email,
        userId: user.id,
        name: user.name,
        unsubscribeToken: token,
      });
    }
  }

  // 2. If general broadcast and not cohort/course restricted, include verified public subscribers
  const isCohortRestricted = audience.cohorts && audience.cohorts.length > 0;
  const isNavalOrCourseRestricted = isCohortRestricted || !!audience.courseId || !!audience.organizationId;

  if (!isNavalOrCourseRestricted && (audience.sendToAll || category === "general")) {
    const publicSubs = await prisma.newsletterSubscription.findMany({
      where: {
        userId: null,
        isSubscribed: true,
      },
    });

    for (const sub of publicSubs) {
      if (isSubscriptionPermitted(sub, category) && !seenEmails.has(sub.email)) {
        seenEmails.add(sub.email);
        recipients.push({
          email: sub.email,
          userId: null,
          unsubscribeToken: sub.unsubscribeToken,
        });
      }
    }
  }

  return recipients;
}
