import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/fa";
import { getLocale } from "@/paraglide/runtime.js";

import durationPlugin from "dayjs/plugin/duration";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(durationPlugin);
dayjs.extend(relativeTimePlugin);
dayjs.extend(isBetween);

// "3 months ago" in the page's language. Changing the language reloads the page.
dayjs.locale(getLocale());
