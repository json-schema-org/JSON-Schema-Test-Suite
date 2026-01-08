/**
 * @import * as API from "./index.d.ts"
 */

const label = `(?!-)[A-Za-z0-9-]{1,63}(?<!-)`;
const domain = `${label}(?:\\.${label})*`;

const domainPattern = new RegExp(`^${domain}$`);

/** @type API.isHostname */
export const isHostname = (hostname) => {
  return domainPattern.test(hostname) && hostname.length < 256;
};
