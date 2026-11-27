import { Module } from "@medusajs/framework/utils";
import IntegrationLogModuleService from "./service";

export const INTEGRATION_LOG_MODULE = "integration_log";

export default Module(INTEGRATION_LOG_MODULE, {
  service: IntegrationLogModuleService,
});
