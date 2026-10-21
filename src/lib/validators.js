import { z } from "zod";
import { findDistrict } from "./districts";
import { isValidPhone } from "./format";
import { strings } from "./strings";

// No eval: the CSP (public/_headers) has no 'unsafe-eval', and zod's JIT probe would log a violation.
z.config({ jitless: true });

// Mirrors the limits and checks in place_order (supabase/README.md). The server
// stays the authority; these only give clear messages before a round trip.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const e = strings.checkout.errors;

/**
 * Checkout form schema. `districtRequired(zoneId)` says whether the chosen
 * zone asks for a district (zones come from the DB, so the caller decides).
 */
export function createCheckoutSchema(districtRequired = () => false) {
  return z
    .object({
      name: z.string().trim().min(2, e.name).max(80, e.nameLong),
      phone: z.string().trim().refine(isValidPhone, strings.form.invalidPhone),
      address: z.string().trim().min(5, e.address).max(300, e.addressLong),
      zoneId: z.string().min(1, e.zone),
      district: z.string().trim(),
      email: z.string().trim().max(254, e.email).refine((v) => !v || EMAIL.test(v), e.email),
      note: z.string().trim().max(500, e.note),
      // Honeypot: real customers never see it, so it stays empty.
      website: z.string(),
    })
    .superRefine((values, ctx) => {
      if (districtRequired(values.zoneId) && !findDistrict(values.district)) {
        ctx.addIssue({ code: "custom", path: ["district"], message: e.district });
      }
    });
}

const c = strings.contact.errors;

/** Contact form schema. Mirrors the contact_messages checks; phone/email are optional but one is required. */
export const contactSchema = z
  .object({
    name: z.string().trim().min(1, c.name).max(80, c.nameLong),
    phone: z.string().trim().refine((v) => !v || isValidPhone(v), strings.form.invalidPhone),
    email: z.string().trim().max(254, c.email).refine((v) => !v || EMAIL.test(v), c.email),
    message: z.string().trim().min(1, c.message).max(2000, c.messageLong),
    // Honeypot: real visitors never see it, so it stays empty.
    website: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.phone && !values.email) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: c.reach });
    }
  });
