import { allowFields, authenticate } from "@medusajs/framework/http";
import { defineMiddlewares } from "@medusajs/medusa";
import { adminMiddlewares } from "./admin/middlewares";
import { storeMiddlewares } from "./store/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminMiddlewares,
    ...storeMiddlewares,
    {
      matcher: "/store/impersonation/end",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/customers/me",
      middlewares: [allowFields("employee")],
    },
    {
      // PO number, blind ship and delivery instructions live in order metadata
      matcher: "/store/orders/*",
      middlewares: [allowFields("metadata")],
    },
    {
      matcher: "/store/carts",
      middlewares: [
        allowFields(
          "company",
          "company.approval_settings",
          "approvals",
          "approval_status"
        ),
      ],
    },
  ],
});
