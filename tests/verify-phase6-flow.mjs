/**
 * Learn LMS — Phase 6 Master Verification Script
 * Tests: Newsletter Campaigns, RFC 8058 Unsubscribe, Announcements,
 * Confidentiality Isolation, Discussion Threads, and In-App Notifications.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let checksPassed = 0;
let checksFailed = 0;

function assert(condition, message) {
  if (condition) {
    checksPassed++;
    console.log(`  ✓ Check ${checksPassed}: ${message}`);
  } else {
    checksFailed++;
    console.error(`  ✗ Check FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email} with HTTP ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  const data = await res.json();
  return { user: data.user, cookie: setCookie };
}

async function runPhase6Verification() {
  console.log("==================================================================");
  console.log(" Learn LMS — Phase 6 End-to-End Verification");
  console.log(" Target:", BASE_URL);
  console.log("==================================================================\n");

  // 1. Unauthenticated Preferences Check
  console.log("Testing Public Subscription & RFC 8058 Unsubscribe...");
  const noTokenPrefRes = await fetch(`${BASE_URL}/api/newsletter/preferences`);
  assert(noTokenPrefRes.status === 404, "Unauthenticated GET /api/newsletter/preferences without token returns 404");

  // 2. Invalid Email Subscribe
  const badSubRes = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });
  assert(badSubRes.status === 400, "POST /api/newsletter/subscribe rejects invalid email with HTTP 400");

  // 3. Valid Public Subscribe
  const testEmail = `e2e.subscriber.${Date.now()}@example.org`;
  const subRes = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      generalNews: true,
      courseAlerts: true,
      trainingAnnouncements: true,
    }),
  });
  assert(subRes.status === 200, "POST /api/newsletter/subscribe succeeds with HTTP 200");
  const subData = await subRes.json();
  const unsubToken = subData.subscription.unsubscribeToken;
  assert(Boolean(unsubToken && unsubToken.startsWith("unsub_")), "Subscription returns valid opaque unsubscribeToken");

  // 4. Retrieve Preferences via Token
  const getPrefRes = await fetch(`${BASE_URL}/api/newsletter/preferences?token=${unsubToken}`);
  assert(getPrefRes.status === 200, "GET /api/newsletter/preferences?token=... succeeds with HTTP 200");
  const prefData = await getPrefRes.json();
  assert(prefData.subscription.isSubscribed === true, "Retrieved subscription isSubscribed is true");

  // 5. Update Preferences via Token
  const updatePrefRes = await fetch(`${BASE_URL}/api/newsletter/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: unsubToken,
      courseAlerts: false,
    }),
  });
  assert(updatePrefRes.status === 200, "POST /api/newsletter/preferences updates preference switches");
  const updatedPrefData = await updatePrefRes.json();
  assert(updatedPrefData.subscription.courseAlerts === false, "courseAlerts correctly set to false");

  // 6. RFC 8058 One-Click Unsubscribe GET Check
  const unsubGetRes = await fetch(`${BASE_URL}/api/newsletter/unsubscribe/${unsubToken}`);
  assert(unsubGetRes.status === 200, "GET /api/newsletter/unsubscribe/[token] returns status with HTTP 200");

  // 7. RFC 8058 One-Click Unsubscribe POST
  const unsubPostRes = await fetch(`${BASE_URL}/api/newsletter/unsubscribe/${unsubToken}`, {
    method: "POST",
  });
  assert(unsubPostRes.status === 200, "POST /api/newsletter/unsubscribe/[token] executes RFC 8058 one-click unsubscribe");
  const unsubPostData = await unsubPostRes.json();
  assert(unsubPostData.isSubscribed === false, "isSubscribed successfully transitioned to false");

  // 8. Confirm State via Preferences
  const checkAfterUnsub = await fetch(`${BASE_URL}/api/newsletter/preferences?token=${unsubToken}`);
  const postUnsubPref = await checkAfterUnsub.json();
  assert(postUnsubPref.subscription.isSubscribed === false, "Subscription status confirms unsubscribed state");

  // 9. Multi-Role Authentication
  console.log("\nAuthenticating Platform Roles...");
  const admin = await loginUser("admin@learnlms.local", "Admin@123");
  assert(admin.user.role === "ADMIN", "Admin session established (Aaditya Deshmukh)");

  const instructor = await loginUser("instructor@learnlms.local", "Instructor@123");
  assert(instructor.user.role === "INSTRUCTOR", "Instructor session established (Commander Rajesh Sharma)");

  const navalLearner = await loginUser("learner@learnlms.local", "Learner@123");
  assert(navalLearner.user.role === "LEARNER" && navalLearner.user.learnerGroup === "NAVAL_OFFICER", "Naval Learner session established (Lt. Vikram Rathore)");

  const fpoLearner = await loginUser("fpo.user@learnlms.local", "Learner@123");
  assert(fpoLearner.user.role === "LEARNER" && fpoLearner.user.learnerGroup === "FPO", "FPO Learner session established (Suresh Patil)");

  // 10. Role Protection on Newsletter Campaign Creation
  console.log("\nTesting Newsletter Campaigns & Audience Targeting...");
  const learnerCampRes = await fetch(`${BASE_URL}/api/admin/newsletters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: navalLearner.cookie },
    body: JSON.stringify({ title: "Forbidden", subject: "Test", body: "Forbidden" }),
  });
  assert(learnerCampRes.status === 403, "Learner POST /api/admin/newsletters rejected with HTTP 403 Forbidden");

  // 11. Admin Campaign Creation
  const campRes = await fetch(`${BASE_URL}/api/admin/newsletters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: admin.cookie },
    body: JSON.stringify({
      title: `E2E Newsletter Campaign ${Date.now()}`,
      subject: "ORELSE Winter Curriculum & Platform Upgrades",
      previewText: "New agricultural governance & naval technical units.",
      body: "Welcome to our comprehensive quarterly update.\n\nPlease log in to review your courses and assessments.",
      deliveryChannel: "EMAIL",
      audienceDefinition: { cohorts: ["FPO", "NAVAL_OFFICER", "STUDENT"] },
    }),
  });
  assert(campRes.status === 201, "Admin POST /api/admin/newsletters creates campaign draft with HTTP 201");
  const campData = await campRes.json();
  const campaignId = campData.campaign.id;
  assert(campData.campaign.status === "DRAFT", "New campaign created in DRAFT status");

  // 12. Admin List Campaigns
  const listCampRes = await fetch(`${BASE_URL}/api/admin/newsletters`, {
    headers: { Cookie: admin.cookie },
  });
  assert(listCampRes.status === 200, "Admin GET /api/admin/newsletters returns campaigns list");
  const listCampData = await listCampRes.json();
  assert(listCampData.campaigns.some((c) => c.id === campaignId), "Newly created campaign found in admin list");

  // 13. Campaign Preview with RFC 8058 Headers
  const prevRes = await fetch(`${BASE_URL}/api/admin/newsletters/${campaignId}/preview`, {
    method: "POST",
    headers: { Cookie: admin.cookie },
  });
  assert(prevRes.status === 200, "Admin POST /api/admin/newsletters/[id]/preview returns preview with HTTP 200");
  const prevData = await prevRes.json();
  assert(Boolean(prevData.preview.html && prevData.preview.html.includes("Learn LMS")), "Preview contains rendered HTML with Learn LMS branding");
  assert(Boolean(prevData.preview.rfc8058Headers["List-Unsubscribe"]), "Preview contains RFC 8058 List-Unsubscribe header");
  assert(prevData.preview.rfc8058Headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click", "Preview contains List-Unsubscribe-Post: List-Unsubscribe=One-Click");

  // 14. Admin Send Campaign (Local Demo Delivery)
  const sendRes = await fetch(`${BASE_URL}/api/admin/newsletters/${campaignId}/send`, {
    method: "POST",
    headers: { Cookie: admin.cookie },
  });
  assert(sendRes.status === 200, "Admin POST /api/admin/newsletters/[id]/send executes dispatch with HTTP 200");
  const sendData = await sendRes.json();
  assert(sendData.campaign.status === "COMPLETED", "Campaign transitioned to COMPLETED status");
  assert(sendData.delivery.delivered > 0, `Local demo delivery adapter delivered to ${sendData.delivery.delivered} recipients`);
  assert(sendData.delivery.adapter === "local-demo", "Delivery confirmed via LocalDemoDeliveryAdapter");

  // 15. Admin Broadcast Platform Announcement
  console.log("\nTesting Institutional & Course Announcements...");
  const platAnnRes = await fetch(`${BASE_URL}/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: admin.cookie },
    body: JSON.stringify({
      title: "Winter 2026 Operational Directives",
      excerpt: "Mandatory system updates and cryptographic credential verification protocols.",
      content: "All personnel and registered learners must review the security guidelines.",
      type: "PLATFORM",
      category: "platform",
      status: "PUBLISHED",
    }),
  });
  assert(platAnnRes.status === 201, "Admin POST /api/announcements broadcasts platform announcement");
  const platAnnData = await platAnnRes.json();
  const platformAnnId = platAnnData.announcement.id;

  // 16. Instructor Broadcast Course Announcement
  const coursesRes = await fetch(`${BASE_URL}/api/instructor/courses`, {
    headers: { Cookie: instructor.cookie },
  });
  const coursesData = await coursesRes.json();
  const targetCourse = coursesData.courses[0];
  assert(Boolean(targetCourse), "Found active target course for instructor announcement");

  const courseAnnRes = await fetch(`${BASE_URL}/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instructor.cookie },
    body: JSON.stringify({
      title: "Bridge Safety Protocol Revision",
      excerpt: "Revised radar sensor calibration standards for Naval Operations Module 2.",
      content: "Ensure compliance with naval command protocol rev 4.2 before final assessment.",
      type: "COURSE",
      category: "curriculum",
      courseId: targetCourse.id,
      targetGroup: "NAVAL_OFFICER",
      isRestricted: true,
      status: "PUBLISHED",
    }),
  });
  assert(courseAnnRes.status === 201, "Instructor POST /api/announcements broadcasts course announcement");
  const courseAnnData = await courseAnnRes.json();
  const courseAnnId = courseAnnData.announcement.id;

  // 17. Learner Rejection for Posting Announcements
  const learnerAnnRes = await fetch(`${BASE_URL}/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: navalLearner.cookie },
    body: JSON.stringify({ title: "Bad", excerpt: "Bad" }),
  });
  assert(learnerAnnRes.status === 403, "Learner POST /api/announcements rejected with HTTP 403 Forbidden");

  // 18. Naval Learner Reads Announcements
  const navalAnnListRes = await fetch(`${BASE_URL}/api/announcements`, {
    headers: { Cookie: navalLearner.cookie },
  });
  assert(navalAnnListRes.status === 200, "Naval Learner GET /api/announcements succeeds");
  const navalAnnList = await navalAnnListRes.json();
  const foundCourseAnn = navalAnnList.announcements.find((a) => a.id === courseAnnId);
  assert(Boolean(foundCourseAnn), "Naval Learner can view Naval Course Announcement");
  assert(foundCourseAnn.isRead === false, "Course announcement is initially marked isRead: false for learner");

  // 19. Mark Announcement as Read
  const markReadRes = await fetch(`${BASE_URL}/api/announcements/${courseAnnId}/read`, {
    method: "POST",
    headers: { Cookie: navalLearner.cookie },
  });
  assert(markReadRes.status === 200, "POST /api/announcements/[id]/read marks announcement read");

  // 20. Confirm isRead is now True
  const navalAnnListAfterRead = await fetch(`${BASE_URL}/api/announcements`, {
    headers: { Cookie: navalLearner.cookie },
  });
  const navalAnnListData = await navalAnnListAfterRead.json();
  const readCourseAnn = navalAnnListData.announcements.find((a) => a.id === courseAnnId);
  assert(readCourseAnn.isRead === true, "Course announcement is now confirmed isRead: true for learner");

  // 21. Clearance Confidentiality Guard (Civilian Learner Isolation)
  console.log("\nVerifying Clearance Confidentiality Guard...");
  const fpoAnnListRes = await fetch(`${BASE_URL}/api/announcements`, {
    headers: { Cookie: fpoLearner.cookie },
  });
  const fpoAnnList = await fpoAnnListRes.json();
  const fpoSeesNavalRestricted = fpoAnnList.announcements.some((a) => a.id === courseAnnId);
  assert(fpoSeesNavalRestricted === false, "Civilian FPO Learner CANNOT see naval-restricted course announcement");

  // 22. Learner Discussion Thread & Support Inquiry
  console.log("\nTesting Multi-Role Messaging & Q&A Discussions...");
  const newThreadRes = await fetch(`${BASE_URL}/api/messages/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: navalLearner.cookie },
    body: JSON.stringify({
      subject: "Inquiry on Amoy Ledger QR Verification",
      type: "SUPPORT",
      initialMessage: "How do we verify the ECDSA ES256 signature when offline?",
    }),
  });
  assert(newThreadRes.status === 201, "Learner POST /api/messages/threads creates discussion thread with HTTP 201");
  const newThreadData = await newThreadRes.json();
  const threadId = newThreadData.thread.id;

  // 23. Admin Sees and Oversees Thread
  const adminThreadsRes = await fetch(`${BASE_URL}/api/messages/threads`, {
    headers: { Cookie: admin.cookie },
  });
  assert(adminThreadsRes.status === 200, "Admin GET /api/messages/threads retrieves all discussion threads");
  const adminThreads = await adminThreadsRes.json();
  assert(adminThreads.threads.some((t) => t.id === threadId), "Admin can inspect newly created learner support thread");

  // 24. Admin Replies in Thread
  const adminReplyRes = await fetch(`${BASE_URL}/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: admin.cookie },
    body: JSON.stringify({
      body: "Hello Lt. Rathore! Offline verification uses the embedded ORELSE public key JSON from the QR code payload.",
    }),
  });
  assert(adminReplyRes.status === 201, "Admin POST /api/messages/threads/[id]/messages replies in thread with HTTP 201");

  // 25. In-App Notification Center Verification
  console.log("\nTesting In-App Notification Dispatch & Read Status...");
  const learnerNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: navalLearner.cookie },
  });
  assert(learnerNotifRes.status === 200, "Learner GET /api/notifications returns notification stream");
  const notifData = await learnerNotifRes.json();
  assert(notifData.unreadCount > 0, `Learner received unread in-app notifications (count: ${notifData.unreadCount})`);
  const replyNotif = notifData.notifications.find((n) => n.eventType === "MESSAGE_RECEIVED" && !n.isRead);
  assert(Boolean(replyNotif), "Learner received unread MESSAGE_RECEIVED notification from Admin reply");

  // 26. Mark Single Notification Read
  const markSingleNotifRes = await fetch(`${BASE_URL}/api/notifications/${replyNotif.id}/read`, {
    method: "POST",
    headers: { Cookie: navalLearner.cookie },
  });
  assert(markSingleNotifRes.status === 200, "POST /api/notifications/[id]/read marks notification read");

  // 27. Mark All Read
  const markAllNotifRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: { Cookie: navalLearner.cookie },
  });
  assert(markAllNotifRes.status === 200, "POST /api/notifications/read-all marks all notifications read");

  // 28. Confirm Unread Count is Zero
  const verifyZeroNotifs = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: navalLearner.cookie },
  });
  const zeroData = await verifyZeroNotifs.json();
  assert(zeroData.unreadCount === 0, "Confirmed unreadCount is 0 after mark-all-read");

  // 29. Notification Preferences Check
  const getNotifPrefRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    headers: { Cookie: navalLearner.cookie },
  });
  assert(getNotifPrefRes.status === 200, "GET /api/notifications/preferences returns preferences");

  // 30. Update Notification Preferences
  const updateNotifPrefRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: navalLearner.cookie },
    body: JSON.stringify({ assessmentAlerts: false }),
  });
  assert(updateNotifPrefRes.status === 200, "PUT /api/notifications/preferences updates preferences");
  const updatedNotifPref = await updateNotifPrefRes.json();
  assert(updatedNotifPref.preferences.assessmentAlerts === false, "assessmentAlerts switch toggled to false");

  // 31. Thread Status Resolution
  const resolveThreadRes = await fetch(`${BASE_URL}/api/messages/threads/${threadId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: admin.cookie },
    body: JSON.stringify({ status: "RESOLVED" }),
  });
  assert(resolveThreadRes.status === 200, "Admin PUT /api/messages/threads/[id] transitions thread status to RESOLVED");
  const resolvedThreadData = await resolveThreadRes.json();
  assert(resolvedThreadData.thread.status === "RESOLVED", "Thread status confirmed as RESOLVED");

  // 32. Cross-Tenant Tampering Guard on Announcements
  const unauthorizedDeleteRes = await fetch(`${BASE_URL}/api/announcements/${platformAnnId}`, {
    method: "DELETE",
    headers: { Cookie: navalLearner.cookie },
  });
  assert(unauthorizedDeleteRes.status === 403, "Learner attempt to DELETE announcement rejected with HTTP 403");

  console.log("\n==================================================================");
  console.log(` Phase 6 Verification Complete: ${checksPassed} checks passed, ${checksFailed} failed.`);
  console.log("==================================================================");
}

runPhase6Verification().catch((err) => {
  console.error("Verification script halted with error:", err);
  process.exit(1);
});
