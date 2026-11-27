import { MedusaService } from "@medusajs/framework/utils";
import { IntegrationEvent } from "./models";

class IntegrationLogModuleService extends MedusaService({ IntegrationEvent }) {}

export default IntegrationLogModuleService;
