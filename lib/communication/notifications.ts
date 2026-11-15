/**
 * Learn LMS — In-App Notifications Engine (Phase 6)
 * ORELSE (https://www.orelse.ai)
 *
 * Provides deduplicated notification creation, broadcast dispatches,
 * and read-status tracking.
 */

import { PrismaClient, Announcement, LearnerGroup } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  eventType: string;
  title: string;
  body: string;
  destination?: string;
  deduplicationKey?: string;
}

/**
 * Creates an in-app notification if user preferences permit,
 * respecting deduplication keys.
 */
export async function createNotification(
  prisma: PrismaClient,
  params: CreateNotificationParams
) {
  const { userId, eventType, title, body, destination, deduplicationKey } = params;

  // 1. Check user notification preferences
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (pref && !pref.inAppEnabled) {
    return null; // In-app notifications turned off by user
  }

  // Check event-specific switches
  if (pref) {
    if (eventType.includes("ANNOUNCEMENT") && !pref.announcements) return null;
    if (eventType.includes("COURSE") && !pref.courseUpdates) return null;
    if (eventType.includes("MESSAGE") && !pref.messages) return null;
    if (eventType.includes("ASSESSMENT") && !pref.assessmentAlerts) return null;
  }

  // 2. If deduplication key exists, upsert to avoid duplicate records
  if (deduplicationKey) {
    return prisma.notification.upsert({
      where: { deduplicationKey },
      update: {}, // Don't overwrite if already created
      create: {
        userId,
        eventType,
        title,
        body,
        destination,
        deduplicationKey,
      },
    });
  }

  // 3. Otherwise create normally
  return prisma.notification.create({
    data: {
      userId,
      eventType,
      title,
      body,
      destination,
    },
  });
}

/**
 * Broadcasts course announcement notifications to enrolled learners
 */
export async function broadcastCourseAnnouncement(
  prisma: PrismaClient,
  announcement: Announcement
) {
  if (!announcement.courseId) return;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: announcement.courseId,
    },
    select: { userId: true },
  });

  const course = await prisma.course.findUnique({
    where: { id: announcement.courseId },
    select: { title: true, slug: true },
  });

  for (const enr of enrollments) {
    await createNotification(prisma, {
      userId: enr.userId,
      eventType: "COURSE_ANNOUNCEMENT",
      title: `Announcement: ${announcement.title}`,
      body: announcement.excerpt,
      destination: `/courses/${course?.slug || announcement.courseId}`,
      deduplicationKey: `notif_announcement_${announcement.id}_${enr.userId}`,
    });
  }
}

/**
 * Broadcasts platform announcement notifications to targeted or all users
 */
export async function broadcastPlatformAnnouncement(
  prisma: PrismaClient,
  announcement: Announcement
) {
  const where: any = { isActive: true };

  if (announcement.targetGroup) {
    where.learnerGroup = announcement.targetGroup;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  for (const u of users) {
    await createNotification(prisma, {
      userId: u.id,
      eventType: "PLATFORM_ANNOUNCEMENT",
      title: announcement.title,
      body: announcement.excerpt,
      destination: "/learn/notifications",
      deduplicationKey: `notif_platform_${announcement.id}_${u.id}`,
    });
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(
  prisma: PrismaClient,
  notificationId: string,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Guard against cross-user tampering
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(
  prisma: PrismaClient,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Gets count of unread notifications for a user
 */
export async function getUnreadNotificationCount(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
