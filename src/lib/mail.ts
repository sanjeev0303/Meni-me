const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

export type EmailAttachment = {
  filename: string;
  content: string; // base64
  type?: string;
};

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailResult = {
  ok: boolean;
  skipped?: boolean;
};

const buildRecipientList = (value: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  }

  return value.trim().length > 0 ? [value.trim()] : [];
};

export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
  const recipients = buildRecipientList(options.to);

  if (!recipients.length) {
    console.warn("[mail] No recipients provided for email send.");
    return { ok: false, skipped: true };
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn("[mail] Missing RESEND_API_KEY or RESEND_FROM_EMAIL. Skipping email send.");
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.type ?? "application/octet-stream",
      })),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Failed to send email: ${response.status} ${response.statusText} ${details}`.trim());
  }

  return { ok: true };
};
