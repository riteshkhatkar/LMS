export type Locale = "en" | "hi" | "mr";
export type LearnerGroup = "FPO" | "FPC" | "STUDENT" | "NAVAL_OFFICER";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseLanguage = "en" | "hi" | "mr" | "en-hi" | "en-mr";
export type LessonMediaType = "video" | "pdf" | "text";
export type PublishStatus = "draft" | "published" | "archived";
export type CertificateStatus =
  | "PENDING"
  | "SIGNING"
  | "SIGNED"
  | "ANCHOR_PENDING"
  | "ANCHORED"
  | "VALID"
  | "ISSUANCE_FAILED"
  | "REVOCATION_PENDING"
  | "REVOKED"
  | "SUPERSEDED"
  | "NOT_FOUND"
  | "VERIFY_ERROR";

export interface LessonSummary {
  id: string;
  title: string;
  mediaType: LessonMediaType;
  durationMinutes: number;
  isPreview: boolean;
  hasQuiz: boolean;
}

export interface SectionSummary {
  id: string;
  title: string;
  lessons: LessonSummary[];
  hasQuiz: boolean;
}

export interface InstructorProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  isDemo: boolean;
}

export interface AssessmentPolicy {
  requiredContentPercent: number;
  finalQuizQuestions: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  passingScorePercent: number;
  certificateOnPass: boolean;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  description: string;
  learningOutcomes: string[];
  prerequisites: string[];
  audienceGroups: LearnerGroup[];
  category: string;
  topicTags: string[];
  level: CourseLevel;
  language: CourseLanguage;
  durationMinutes: number;
  instructor: InstructorProfile;
  thumbnail: string;
  sections: SectionSummary[];
  quizCount: number;
  assessmentPolicy: AssessmentPolicy;
  certificateAvailable: boolean;
  publishStatus: PublishStatus;
  publishedAt: string;
  lastUpdated: string;
  enrollmentCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: "general" | "course" | "feature";
}

export interface CourseFilters {
  audience?: LearnerGroup[];
  category?: string;
  language?: CourseLanguage;
  level?: CourseLevel;
  search?: string;
  certificateAvailable?: boolean;
}

export interface CertificateVerifyResult {
  status: CertificateStatus;
  certificateId?: string;
  issuer?: string;
  courseName?: string;
  issueDate?: string;
  grade?: string | null;
  outcome?: string;
  ledgerMode: "mock" | "real" | "local_evm" | "public_testnet";
  ledgerLabel: string;
  revocationReason?: string | null;
  chainUrl?: string;
}
