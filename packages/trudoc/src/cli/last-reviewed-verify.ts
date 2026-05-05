#!/usr/bin/env node
import { resolveTrudocWebsiteRoot } from './site-root';
import { runLastReviewedVerify } from '../verify/last-reviewed';

runLastReviewedVerify(resolveTrudocWebsiteRoot(process.argv, import.meta.url));
