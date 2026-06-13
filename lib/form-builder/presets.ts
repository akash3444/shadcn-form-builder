import { Bug, Mail, MessageSquare, Newspaper, Settings2, UserPlus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { FormField } from "./types"

export interface FormPreset {
  id: string
  name: string
  description: string
  icon: LucideIcon
  formName: string
  submitLabel: string
  fields: FormField[]
}

export const FORM_PRESETS: FormPreset[] = [
  {
    id: "contact-us",
    name: "Contact Us",
    description: "Inquiry form with subject and message",
    icon: Mail,
    formName: "Contact Us",
    submitLabel: "Send Message",
    fields: [
      {
        id: "cu-f1", type: "input", inputType: "text",
        label: "First Name", name: "firstName",
        placeholder: "John", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "cu-f2", type: "input", inputType: "text",
        label: "Last Name", name: "lastName",
        placeholder: "Doe", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "cu-f3", type: "input", inputType: "email",
        label: "Email", name: "email",
        placeholder: "john@example.com", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "cu-f4", type: "input", inputType: "tel",
        label: "Phone Number", name: "phone",
        placeholder: "+1 (555) 000-0000", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "cu-f5", type: "select",
        label: "Subject", name: "subject",
        placeholder: "Select a subject", description: "", descriptionPosition: "below-control" as const,required: true,
        options: [
          { id: "cu-f5-o1", label: "General Inquiry", value: "general-inquiry" },
          { id: "cu-f5-o2", label: "Support", value: "support" },
          { id: "cu-f5-o3", label: "Sales", value: "sales" },
          { id: "cu-f5-o4", label: "Partnership", value: "partnership" },
          { id: "cu-f5-o5", label: "Other", value: "other" },
        ],
      },
      {
        id: "cu-f6", type: "textarea",
        label: "Message", name: "message",
        placeholder: "How can we help you?", description: "", descriptionPosition: "below-control" as const,required: true, rows: 4,
      },
      {
        id: "cu-f7", type: "radio-group",
        label: "How did you hear about us?", name: "heardAboutUs",
        placeholder: "", description: "", descriptionPosition: "below-control" as const, orientation: "vertical" as const, required: false,
        options: [
          { id: "cu-f7-o1", label: "Search Engine", value: "search-engine" },
          { id: "cu-f7-o2", label: "Social Media", value: "social-media" },
          { id: "cu-f7-o3", label: "Friend or Colleague", value: "friend-or-colleague" },
          { id: "cu-f7-o4", label: "Other", value: "other" },
        ],
      },
      {
        id: "cu-f8", type: "checkbox",
        label: "Subscribe to our newsletter", name: "subscribeToNewsletter",
        placeholder: "", description: "", descriptionPosition: "below-control" as const,required: false,
      },
    ],
  },
  {
    id: "sign-up",
    name: "Sign Up",
    description: "Registration with terms and email opt-in",
    icon: UserPlus,
    formName: "Sign Up",
    submitLabel: "Create Account",
    fields: [
      {
        id: "su-f1", type: "input", inputType: "text",
        label: "First Name", name: "firstName",
        placeholder: "John", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "su-f2", type: "input", inputType: "text",
        label: "Last Name", name: "lastName",
        placeholder: "Doe", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "su-f3", type: "input", inputType: "email",
        label: "Email", name: "email",
        placeholder: "john@example.com", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "su-f4", type: "input", inputType: "password",
        label: "Password", name: "password",
        placeholder: "••••••••", description: "Must be at least 8 characters", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "su-f6", type: "checkbox",
        label: "I agree to the Terms of Service and Privacy Policy", name: "agreeToTerms",
        placeholder: "", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "su-f7", type: "switch",
        label: "Subscribe to product updates", name: "subscribeEmails",
        placeholder: "", description: "Receive news and feature announcements", descriptionPosition: "below-control" as const,required: false,
      },
    ],
  },
  {
    id: "user-feedback",
    name: "User Feedback",
    description: "Rating, comments, and follow-up opt-in",
    icon: MessageSquare,
    formName: "User Feedback",
    submitLabel: "Submit Feedback",
    fields: [
      {
        id: "uf-f4", type: "radio-group",
        label: "How likely are you to recommend us?", name: "recommendLikelihood",
        placeholder: "", description: "", descriptionPosition: "below-control" as const, orientation: "vertical" as const, required: true,
        options: [
          { id: "uf-f4-o1", label: "Definitely", value: "definitely" },
          { id: "uf-f4-o2", label: "Very Likely", value: "very-likely" },
          { id: "uf-f4-o3", label: "Unlikely", value: "unlikely" },
          { id: "uf-f4-o4", label: "Not at All", value: "not-at-all" },
        ],
      },
      {
        id: "uf-f5", type: "textarea",
        label: "Additional Comments", name: "additionalComments",
        placeholder: "Share any other thoughts...", description: "", descriptionPosition: "below-control" as const,required: false, rows: 3,
      },
      {
        id: "uf-f6", type: "switch",
        label: "Allow follow-up contact", name: "allowContact",
        placeholder: "", description: "We may reach out to discuss your feedback", descriptionPosition: "below-control" as const,required: false,
      },
    ],
  },
  {
    id: "bug-report",
    name: "Bug Report",
    description: "Severity, steps to reproduce, and reporter info",
    icon: Bug,
    formName: "Bug Report",
    submitLabel: "Submit Report",
    fields: [
      {
        id: "br-f1", type: "input", inputType: "text",
        label: "Summary", name: "summary",
        placeholder: "Brief description of the issue", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "br-f2", type: "select",
        label: "Severity", name: "severity",
        placeholder: "Select severity", description: "", descriptionPosition: "below-control" as const,required: true,
        options: [
          { id: "br-f2-o1", label: "Critical", value: "critical" },
          { id: "br-f2-o2", label: "High", value: "high" },
          { id: "br-f2-o3", label: "Medium", value: "medium" },
          { id: "br-f2-o4", label: "Low", value: "low" },
        ],
      },
      {
        id: "br-f3", type: "select",
        label: "Category", name: "category",
        placeholder: "Select category", description: "", descriptionPosition: "below-control" as const,required: false,
        options: [
          { id: "br-f3-o1", label: "UI Bug", value: "ui-bug" },
          { id: "br-f3-o2", label: "Performance", value: "performance" },
          { id: "br-f3-o3", label: "Crash", value: "crash" },
          { id: "br-f3-o4", label: "Data Loss", value: "data-loss" },
          { id: "br-f3-o5", label: "Security", value: "security" },
          { id: "br-f3-o6", label: "Other", value: "other" },
        ],
      },
      {
        id: "br-f4", type: "select",
        label: "Browser", name: "browser",
        placeholder: "Select browser", description: "", descriptionPosition: "below-control" as const,required: false,
        options: [
          { id: "br-f4-o1", label: "Chrome", value: "chrome" },
          { id: "br-f4-o2", label: "Firefox", value: "firefox" },
          { id: "br-f4-o3", label: "Safari", value: "safari" },
          { id: "br-f4-o4", label: "Edge", value: "edge" },
          { id: "br-f4-o5", label: "Other", value: "other" },
        ],
      },
      {
        id: "br-f5", type: "textarea",
        label: "Steps to Reproduce", name: "stepsToReproduce",
        placeholder: "1. Go to...\n2. Click on...\n3. See error", description: "", descriptionPosition: "below-control" as const,required: true, rows: 4,
      },
      {
        id: "br-f6", type: "textarea",
        label: "Expected Behavior", name: "expectedBehavior",
        placeholder: "What should have happened", description: "", descriptionPosition: "below-control" as const,required: false, rows: 3,
      },
      {
        id: "br-f7", type: "textarea",
        label: "Actual Behavior", name: "actualBehavior",
        placeholder: "What actually happened", description: "", descriptionPosition: "below-control" as const,required: false, rows: 3,
      },
      {
        id: "br-f8", type: "input", inputType: "email",
        label: "Your Email", name: "reporterEmail",
        placeholder: "your@email.com", description: "So we can follow up if needed", descriptionPosition: "below-control" as const,required: false,
      },
    ],
  },
  {
    id: "profile-settings",
    name: "Profile Settings",
    description: "Bio, preferences, and visibility settings",
    icon: Settings2,
    formName: "Profile Settings",
    submitLabel: "Save Changes",
    fields: [
      {
        id: "ps-f1", type: "input", inputType: "text",
        label: "First Name", name: "firstName",
        placeholder: "John", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f2", type: "input", inputType: "text",
        label: "Last Name", name: "lastName",
        placeholder: "Doe", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f3", type: "input", inputType: "text",
        label: "Username", name: "username",
        placeholder: "johndoe", description: "This is your public display name", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f4", type: "input", inputType: "email",
        label: "Email", name: "email",
        placeholder: "john@example.com", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f5", type: "textarea",
        label: "Bio", name: "bio",
        placeholder: "Tell us a little about yourself", description: "", descriptionPosition: "below-control" as const,required: false, rows: 3,
      },
      {
        id: "ps-f6", type: "input", inputType: "url",
        label: "Website", name: "website",
        placeholder: "https://yourwebsite.com", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f7", type: "select",
        label: "Timezone", name: "timezone",
        placeholder: "Select timezone", description: "", descriptionPosition: "below-control" as const,required: false,
        options: [
          { id: "ps-f7-o1", label: "UTC", value: "utc" },
          { id: "ps-f7-o2", label: "Eastern (EST/EDT)", value: "eastern" },
          { id: "ps-f7-o3", label: "Central (CST/CDT)", value: "central" },
          { id: "ps-f7-o4", label: "Mountain (MST/MDT)", value: "mountain" },
          { id: "ps-f7-o5", label: "Pacific (PST/PDT)", value: "pacific" },
          { id: "ps-f7-o6", label: "London (GMT/BST)", value: "london" },
          { id: "ps-f7-o7", label: "Central Europe (CET)", value: "cet" },
          { id: "ps-f7-o8", label: "India (IST)", value: "ist" },
          { id: "ps-f7-o9", label: "Japan (JST)", value: "jst" },
          { id: "ps-f7-o10", label: "Australia Eastern (AEST)", value: "aest" },
        ],
      },
      {
        id: "ps-f8", type: "switch",
        label: "Email Notifications", name: "emailNotifications",
        placeholder: "", description: "Receive email updates about your account activity", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "ps-f9", type: "radio-group",
        label: "Profile Visibility", name: "profileVisibility",
        placeholder: "", description: "", descriptionPosition: "below-control" as const, orientation: "vertical" as const, required: false,
        options: [
          { id: "ps-f9-o1", label: "Public", value: "public" },
          { id: "ps-f9-o2", label: "Friends Only", value: "friends-only" },
          { id: "ps-f9-o3", label: "Private", value: "private" },
        ],
      },
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Topic interests and frequency preference",
    icon: Newspaper,
    formName: "Newsletter",
    submitLabel: "Subscribe",
    fields: [
      {
        id: "nl-f1", type: "input", inputType: "text",
        label: "First Name", name: "firstName",
        placeholder: "John", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "nl-f2", type: "input", inputType: "text",
        label: "Last Name", name: "lastName",
        placeholder: "Doe", description: "", descriptionPosition: "below-control" as const,required: false,
      },
      {
        id: "nl-f3", type: "input", inputType: "email",
        label: "Email", name: "email",
        placeholder: "john@example.com", description: "", descriptionPosition: "below-control" as const,required: true,
      },
      {
        id: "nl-f4", type: "checkbox-group",
        label: "Topics of Interest", name: "topicsOfInterest",
        placeholder: "", description: "Choose your interests", descriptionPosition: "below-control" as const,required: false,
        orientation: "vertical",
        options: [
          { id: "nl-f4-o1", label: "Technology", value: "technology" },
          { id: "nl-f4-o2", label: "Design", value: "design" },
          { id: "nl-f4-o3", label: "Business", value: "business" },
          { id: "nl-f4-o4", label: "Marketing", value: "marketing" },
          { id: "nl-f4-o5", label: "Science & Research", value: "science-research" },
        ],
      },
      {
        id: "nl-f5", type: "radio-group",
        label: "Frequency Preference", name: "frequency",
        placeholder: "", description: "", descriptionPosition: "below-control" as const, orientation: "vertical" as const, required: true,
        options: [
          { id: "nl-f5-o1", label: "Daily Digest", value: "daily" },
          { id: "nl-f5-o2", label: "Weekly Roundup", value: "weekly" },
          { id: "nl-f5-o3", label: "Monthly Summary", value: "monthly" },
        ],
      },
      {
        id: "nl-f6", type: "checkbox",
        label: "I agree to receive marketing emails", name: "agreeToReceive",
        placeholder: "", description: "", descriptionPosition: "below-control" as const,required: true,
      },
    ],
  },
]
