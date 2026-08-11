import { AUTH_APP_IDS } from "@beskid/auth-client";
import { z } from "zod";

export const pairingAppIdSchema = z.enum(AUTH_APP_IDS);
