import { isIdnHostname } from "idn-hostname";
import { isHostname } from "./rfc1123.js";

/**
 * @import * as API from "./index.d.ts"
 */

/** @type API.isAsciiIdn */
export const isAsciiIdn = (hostname) => {
  return isHostname(hostname) && isIdn(hostname);
};

/** @type API.isIdn */
export const isIdn = (hostname) => {
  try {
    return isIdnHostname(hostname);
  } catch (_error) {
    return false;
  }
};
