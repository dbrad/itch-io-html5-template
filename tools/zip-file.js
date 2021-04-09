const fs = require("fs");
const archiver = require("archiver");

const distDir = process.cwd() + "\\dist";
const output = fs.createWriteStream(distDir + "\\game.zip");
const archive = archiver("zip", { zlib: { level: 9, memLevel: 9 } });

archive.pipe(output);
archive.directory("dist\\src", false);
archive.finalize();