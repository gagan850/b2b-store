import { model } from "@medusajs/framework/utils";
import { Employee } from "./employee";

export const Company = model.define("company", {
  id: model
    .id({
      prefix: "comp",
    })
    .primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  zip: model.text().nullable(),
  country: model.text().nullable(),
  logo_url: model.text().nullable(),
  currency_code: model.text().nullable(),
  spending_limit_reset_frequency: model
    .enum(["never", "daily", "weekly", "monthly", "yearly"])
    .default("monthly"),
  // Bill-to-account: "prepaid" means the company must pay by card at checkout
  payment_terms: model
    .enum(["prepaid", "net_15", "net_30", "net_45", "net_60"])
    .default("prepaid"),
  // Set from the ERP when an account is over its limit or past due
  credit_hold: model.boolean().default(false),
  employees: model.hasMany(() => Employee),
});
