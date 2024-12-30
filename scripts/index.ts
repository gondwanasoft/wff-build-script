// filepath: /e:/wff-build-script/build/scripts/index.js
const fs = require("fs");
const path = require("path");
import main from "./clockwork";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const files = fs
  .readdirSync(__dirname)
  .filter((file: any) => file.endsWith(".js") && file !== "index.js");

files.forEach((file: any) => {
  require(path.join(__dirname, file));
});
