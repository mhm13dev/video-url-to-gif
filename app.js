const express = require("express");
const fs = require("fs");
const { createFFmpeg, fetchFile } = require("@ffmpeg/ffmpeg");
let fileTypeFromBuffer;

const ffmpeg = createFFmpeg({ log: true });

const app = express();

app.use(express.json());

app.get("/convert", async (req, res, next) => {
  const url = req.query?.url;

  const uintFile = await fetchFile(url);

  const { ext } = await fileTypeFromBuffer(uintFile);
  const filename = "test." + ext;
  ffmpeg.FS("writeFile", filename, uintFile);

  await ffmpeg.run(
    "-t",
    "10",
    "-i",
    filename,
    "-vf",
    "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop",
    "0",
    "output.gif"
  );

  await fs.promises.writeFile(
    "./output.gif",
    ffmpeg.FS("readFile", "output.gif")
  );

  ffmpeg.FS("unlink", filename);
  ffmpeg.FS("unlink", "output.gif");
  res.json({
    status: "ok",
  });
});

(async () => {
  fileTypeFromBuffer = (await import("file-type")).fileTypeFromBuffer;
  await ffmpeg.load();

  app.listen(5000, () => {
    console.log("server listening on port 5000");
  });
})();
