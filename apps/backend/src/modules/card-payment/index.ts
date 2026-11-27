import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CardPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [CardPaymentProviderService],
})
