import rtmpServer from "$/rtmp";
import cors from "cors";
import express, { Express } from "express";
import { resolve } from "path";

const app: Express = express();
const PORT = +Number(process.env.PORT) || 3000;
// const RTMP_PORT = +Number(process.env.RTMP_PORT) || 1935;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(resolve(__dirname, "../public")));
app.use("/hls", express.static(resolve(__dirname, "../hls")));

app.use(require("$/router").default); // <-- Application Router

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);

  // Start the RTMP server
  rtmpServer();
});
