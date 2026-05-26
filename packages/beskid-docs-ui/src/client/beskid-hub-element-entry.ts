/** Registers `<beskid-hub>` and attaches delegated hub behavior. */
import { registerBeskidHubElement } from "../custom-elements/beskid-hub-element";
import { initBeskidHub, initBeskidHubAfterBlazor } from "./beskid-hub";

registerBeskidHubElement();
initBeskidHub();
initBeskidHubAfterBlazor();
