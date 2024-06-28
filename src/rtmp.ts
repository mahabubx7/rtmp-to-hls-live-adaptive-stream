import nodeMediaServer from "node-media-server";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// HLS output directory
const hlsOutputPath = path.join(__dirname, "..", "hls");

// Ensure HLS directory exists
if (!fs.existsSync(hlsOutputPath)) {
  fs.mkdirSync(hlsOutputPath, { recursive: true });
}

// RTMP server configuration
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 3080,
    mediaroot: "../hls",
    allow_origin: "*",
  },
};

export default function rtmpServer() {
  // Start the RTMP server
  const nms = new nodeMediaServer(nmsConfig);
  nms.run();

  // Start FFmpeg process for transcoding
  nms.on("prePublish", (id, StreamPath, args) => {
    const streamKey = StreamPath.split("/")[2];

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      `rtmp://localhost/live/${streamKey}`,
      "-filter_complex",
      "[v:0]split=3[v1][v2][v3]; [v1]scale=w=640:h=360[v1out]; [v2]scale=w=842:h=480[v2out]; [v3]scale=w=1280:h=720[v3out]",
      "-map",
      "[v1out]",
      "-c:v:0",
      "libx264",
      "-b:v:0",
      "800k",
      "-maxrate:v:0",
      "856k",
      "-bufsize:v:0",
      "1200k",
      "-map",
      "[v2out]",
      "-c:v:1",
      "libx264",
      "-b:v:1",
      "1400k",
      "-maxrate:v:1",
      "1498k",
      "-bufsize:v:1",
      "2100k",
      "-map",
      "[v3out]",
      "-c:v:2",
      "libx264",
      "-b:v:2",
      "2800k",
      "-maxrate:v:2",
      "2996k",
      "-bufsize:v:2",
      "4200k",
      "-map",
      "a:0",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "44100",
      "-map",
      "a:0",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-ar",
      "44100",
      "-map",
      "a:0",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ac",
      "2",
      "-ar",
      "44100",
      "-f",
      "hls",
      "-hls_time",
      "4",
      "-hls_list_size",
      "5",
      "-hls_flags",
      "delete_segments+independent_segments",
      "-hls_segment_filename",
      `${hlsOutputPath}/${streamKey}_%v_%03d.ts`,
      "-master_pl_name",
      `${streamKey}_master.m3u8`,
      "-var_stream_map",
      "v:0,a:0 v:1,a:1 v:2,a:2",
      `${hlsOutputPath}/${streamKey}_%v.m3u8`,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on("close", (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
    });
  });
}
