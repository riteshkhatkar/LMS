import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { markAllNotificationsAsRead } from "@/lib/communication/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsAsRead(prisma, session.id);

  return NextResponse.json({ success: true, message: "All notifications marked as read." });
}
