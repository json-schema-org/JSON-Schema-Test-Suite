
export default function* jsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* jsonFiles(full);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      yield full;
    }
  }
}
