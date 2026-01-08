import { addFormat } from "../lib/keywords.js";
import "./lite.js";

import idnEmail from "./handlers/idn-email.js";
import hostname from "./handlers/hostname.js";
import idnHostname from "./handlers/idn-hostname.js";


addFormat(idnEmail);
addFormat(hostname);
addFormat(idnHostname);
