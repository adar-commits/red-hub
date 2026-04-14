export const DESIGNER_ACTIVITY_TYPES = [
  "login",
  "invoice_upload",
  "business_update",
  "commission_assignment_request",
] as const;

export type DesignerActivityType = (typeof DESIGNER_ACTIVITY_TYPES)[number];

export function isDesignerActivityType(s: string): s is DesignerActivityType {
  return (DESIGNER_ACTIVITY_TYPES as readonly string[]).includes(s);
}
