import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DesignerActivityType } from "@/lib/designer-activity-types";

export type { DesignerActivityType } from "@/lib/designer-activity-types";
export { DESIGNER_ACTIVITY_TYPES, isDesignerActivityType } from "@/lib/designer-activity-types";

export type RecordDesignerActivityInput = {
  activity_type: DesignerActivityType;
  designer_code: string;
  agent_name?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Append-only audit row. Never throws — failures are logged only. */
export async function recordDesignerActivity(input: RecordDesignerActivityInput): Promise<void> {
  const code = typeof input.designer_code === "string" ? input.designer_code.trim() : "";
  if (!code) return;
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("designer_activity").insert({
      activity_type: input.activity_type,
      designer_code: code,
      agent_name: input.agent_name?.trim() || null,
      phone: input.phone?.trim() || null,
      metadata: input.metadata ?? null,
    });
    if (error) console.error("recordDesignerActivity:", error.message);
  } catch (e) {
    console.error("recordDesignerActivity:", e);
  }
}
