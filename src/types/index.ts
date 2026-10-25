export type Locale = "pl" | "en" | "ro";

export type ContractType = "permanent" | "zero_hours" | "agency" | "fixed_term";

export interface UserProfile {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  homeAddress: string;
  employerName: string;
  companyNumber: string;
  employerAddress: string;
  jobTitle: string;
  startDate: string; // YYYY-MM-DD
  hourlyRate: number;
  hoursPerWeek: number;
  contractType: ContractType;
  industry: string;
  isPro: boolean;
  proExpiryDate?: string;
  role: "user" | "admin";
  onboarded: boolean;
  city?: string;
  registeredAt?: string;
  free_access?: boolean;
  subscriptionStatus?: "active_pro" | "free_access" | "free" | "past_due";
  sessionsToday?: number;
  sessionsLast7Days?: number;
  sessionsTotal?: number;
  dailyQueriesCount?: number;
  chatQueriesCount?: number;
  formalCasesCount?: number;
  lastPasswordResetToken?: string;
  lastPasswordResetAt?: string;
}

export interface CaseNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface WorkplaceCase {
  id: string;
  title: string;
  description: string;
  sector: string;
  employer: string;
  status: "open" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
}

export interface TemplateField {
  key: string;
  labelEn: string;
  labelPl: string;
  labelRo: string;
  placeholder: string;
  defaultValue: string;
}

export interface LegalTemplate {
  id: string;
  titleEn: string;
  titlePl: string;
  titleRo: string;
  statutoryReference: string;
  category: string;
  descriptionEn: string;
  descriptionPl: string;
  descriptionRo: string;
  fields: TemplateField[];
  defaults: Record<string, string>;
  letter: string;
}

export type SentLetterCategoryTag =
  | "Grievance"
  | "Settlement"
  | "Contract"
  | "Wages"
  | "Dismissal"
  | "Sick Pay"
  | "Data & GDPR";

export interface SentLetter {
  id: string;
  templateId: string;
  title: string;
  titlePl?: string;
  categoryLabelPl?: string;
  caseSummaryPl?: string;
  recipient: string;
  date: string;
  content: string;
  primaryTag?: SentLetterCategoryTag;
  tags?: SentLetterCategoryTag[];
  statutoryReference?: string;
}

export interface ForumComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole?: string;
  title: string;
  content: string;
  tag: string;
  upvotes: number;
  userUpvoted?: boolean;
  createdAt: string;
  comments: ForumComment[];
}

export type NetworkStatus = "online" | "offline" | "reconnecting";

export interface SavedLetterDraft {
  templateId: string;
  formValues: Record<string, string>;
  renderedLetter: string | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  threadId?: string;
  status?: "sent" | "queued" | "sending";
  isSystemBroadcast?: boolean;
  systemMessageType?: "broadcast" | "direct";
  senderLabel?: string;
}

export type UnsavedChatIconType =
  | "wages"
  | "grievance"
  | "sick_pay"
  | "dismissal"
  | "contract"
  | "settlement"
  | "data"
  | "general";

export interface RecentUnsavedChat {
  id: string;
  title: string;
  preview: string;
  dateISO: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "25.10.2026"
  updatedAtTime: string; // e.g. "14:25"
  iconType: UnsavedChatIconType;
  messages: ChatMessage[];
  messageCount: number;
}

export interface AuditItem {
  issue: string;
  severity: "info" | "warning" | "error";
  recommendation: string;
}

export interface AuditResult {
  valid: boolean;
  summary: string;
  calculatedHourly?: number;
  holidayPayStatus?: string;
  minimumWageCompliance?: boolean;
  items: AuditItem[];
}

export interface UserDocument {
  id: string;
  name: string;
  type: "payslip" | "contract" | "hr_letter" | "other";
  uploadDate: string;
  fileSize: string;
  auditResult?: AuditResult;
}

export interface WorkplaceNote {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  date: string;
  unread: boolean;
}

export interface SentimentFlagItem {
  fieldKey: string;
  originalText: string;
  severity: "inflammatory" | "cautionary";
  category: string;
  reason: string;
  suggestedReplacement: string;
}

export interface LetterSentimentResult {
  overallStatus: "professional" | "cautionary" | "inflammatory";
  toneScore: number;
  summary: string;
  flaggedItems: SentimentFlagItem[];
  analyzedAt: string;
}

export interface LegalRightItem {
  id: string;
  title: string;
  statute: string;
  explanation: string;
  category:
    | "wages"
    | "dismissal"
    | "sick_pay"
    | "working_time"
    | "grievance"
    | "data_protection";
}

export interface LegalDeadlineItem {
  id: string;
  label: string;
  timeframe: string;
  urgency: "critical" | "important" | "standard";
  authority: string;
  explanation: string;
}

export interface ConversationLegalSummary {
  topicSummary: string;
  isBaseline: boolean;
  rights: LegalRightItem[];
  deadlines: LegalDeadlineItem[];
  recommendedTemplateIds: string[];
  updatedAt: string;
  source: "ai" | "local";
}

export interface AdminManagedUser extends UserProfile {
  city: string;
  registeredAt: string;
  free_access: boolean;
  subscriptionStatus: "active_pro" | "free_access" | "free" | "past_due";
  sessionsToday: number;
  sessionsLast7Days: number;
  sessionsTotal: number;
  dailyQueriesCount: number;
  chatQueriesCount: number;
  formalCasesCount: number;
}

export interface PromoCodeItem {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  expiresAt: string; // YYYY-MM-DD
  description: string;
  usedCount: number;
  createdAt: string;
}

export interface MarketingPopupConfig {
  isActive: boolean;
  title: string;
  content: string;
  mediaUrl: string;
  ctaText?: string;
  updatedAt: string;
}

export interface AdminChatDeliveryLog {
  id: string;
  targetType: "broadcast" | "direct";
  targetUserId?: string;
  targetUserName?: string;
  title: string;
  message: string;
  sentAt: string;
}

export type PendingSyncActionType =
  | "chat_message"
  | "letter_save"
  | "case_create"
  | "note_save"
  | "profile_sync";

export interface PendingSyncAction {
  id: string;
  type: PendingSyncActionType;
  title: string;
  subtitle: string;
  createdAt: string;
  status: "queued" | "syncing";
  linkedMessageId?: string;
}

export interface OfflineSettingsConfig {
  backgroundSyncEnabled: boolean;
  autoCacheTemplatesAndLetters: boolean;
  syncOnMeteredConnection: boolean;
  lastSyncedAt: string;
}

