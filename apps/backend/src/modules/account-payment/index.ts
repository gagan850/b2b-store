import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import AccountPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [AccountPaymentProviderService],
})
