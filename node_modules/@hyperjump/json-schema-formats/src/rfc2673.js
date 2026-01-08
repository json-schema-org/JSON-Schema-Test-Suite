/**
 * @import * as API from "./index.d.ts"
 */

const decOctet = `(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])`;
const ipV4Address = `${decOctet}\\.${decOctet}\\.${decOctet}\\.${decOctet}`;

/**
 * @type API.isIPv4
 * @function
 */
export const isIPv4 = RegExp.prototype.test.bind(new RegExp(`^${ipV4Address}$`));
