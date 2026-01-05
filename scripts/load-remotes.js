// scripts/load-remotes.js
import * as fs from "node:fs";
import { toAbsoluteIri } from "@hyperjump/uri";
import { registerSchema } from "@hyperjump/json-schema/draft-2020-12";

// Keep track of which remote URLs we've already registered
const loadedRemotes = new Set();

export const loadRemotes = (dialectId, filePath, url = "") => {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: Remotes path not found: ${filePath}`);
    return;
  }

  fs.readdirSync(filePath, { withFileTypes: true }).forEach((entry) => {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      const remotePath = `${filePath}/${entry.name}`;
      const remoteUrl = `http://localhost:1234${url}/${entry.name}`;

      // Skip if already registered
      if (loadedRemotes.has(remoteUrl)) {
        return;
      }

      const remote = JSON.parse(fs.readFileSync(remotePath, "utf8"));

      //  FIXEDhere
      if (typeof remote.$id === "string" && remote.$id.startsWith("file:")) {
        remote.$id = remote.$id.replace(/^file:/, "x-file:");
      }

      // Only register if $schema matches dialect OR there's no $schema
      if (!remote.$schema || toAbsoluteIri(remote.$schema) === dialectId) {
        registerSchema(remote, remoteUrl, dialectId);
        loadedRemotes.add(remoteUrl);
      }
    } else if (entry.isDirectory()) {
      loadRemotes(
        dialectId,
        `${filePath}/${entry.name}`,
        `${url}/${entry.name}`
      );
    }
  });
};
