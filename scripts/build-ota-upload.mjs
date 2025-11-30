import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exec as _exec } from "child_process";
import archiver from "archiver";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const exec = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    const p = _exec(cmd, { stdio: "inherit", ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
    p.stdout?.pipe(process.stdout);
    p.stderr?.pipe(process.stderr);
  });

// ---------------------------
// Paths & basic config
// ---------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const OTA_ROOT = path.join(PROJECT_ROOT, "ota-build");
const ANDROID_DIR = path.join(OTA_ROOT, "android");
const IOS_DIR = path.join(OTA_ROOT, "ios");
const ANDROID_ZIP_PATH = path.join(PROJECT_ROOT, "ota-build-android.zip");
const IOS_ZIP_PATH = path.join(PROJECT_ROOT, "ota-build-ios.zip");

// change if your entry file is different
const ENTRY_FILE = "index.js";

// ---------------------------
// R2 CONFIG (from env)
// ---------------------------
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// ---------------------------
// Helpers
// ---------------------------
async function cleanAndPrepareDirs() {
  await fsp.rm(OTA_ROOT, { recursive: true, force: true }).catch(() => {});
  await fsp.rm(ANDROID_ZIP_PATH, { force: true }).catch(() => {});
  await fsp.rm(IOS_ZIP_PATH, { force: true }).catch(() => {});
  await fsp.mkdir(ANDROID_DIR, { recursive: true });
  await fsp.mkdir(IOS_DIR, { recursive: true });
}

async function readAppVersion() {
  const pkgJsonPath = path.join(PROJECT_ROOT, "package.json");
  const pkgRaw = await fsp.readFile(pkgJsonPath, "utf8");
  const pkg = JSON.parse(pkgRaw);
  return pkg.version || "0.0.0";
}

async function writeOtaVersion(version) {
  const androidVersionPath = path.join(ANDROID_DIR, "ota.version");
  const iosVersionPath = path.join(IOS_DIR, "ota.version");
  await fsp.writeFile(androidVersionPath, `${version}\n`, "utf8");
  await fsp.writeFile(iosVersionPath, `${version}\n`, "utf8");
  console.log("📝 Wrote ota.version with version:", version, "to both Android and iOS directories");
}

async function bundleAndroid() {
  console.log("📦 Bundling ANDROID…");
  const cmd = [
    "npx react-native bundle",
    "--platform android",
    "--dev false",
    `--entry-file ${ENTRY_FILE}`,
    `--bundle-output ${path.join(ANDROID_DIR, "index.android.bundle")}`,
    `--assets-dest ${path.join(ANDROID_DIR, "assets")}`,
  ].join(" ");

  await exec(cmd, { cwd: PROJECT_ROOT });
  console.log("✅ Android bundle done");
}

async function bundleIOS() {
  console.log("📦 Bundling iOS…");
  const cmd = [
    "npx react-native bundle",
    "--platform ios",
    "--dev false",
    `--entry-file ${ENTRY_FILE}`,
    `--bundle-output ${path.join(IOS_DIR, "main.jsbundle")}`,
    `--assets-dest ${path.join(IOS_DIR, "assets")}`,
  ].join(" ");

  await exec(cmd, { cwd: PROJECT_ROOT });
  console.log("✅ iOS bundle done");
}

async function zipFolder(sourceDir, outputPath, platform) {
  console.log(`📚 Zipping ${platform} →`, outputPath);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ${platform} zip created, size:`, archive.pointer(), "bytes");
      resolve();
    });

    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function uploadToR2(zipPath, objectKey, platform) {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const fileStream = fs.createReadStream(zipPath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: fileStream,
    ContentType: "application/zip",
  });

  await s3.send(command);
  console.log(`🚀 Uploaded ${platform} OTA zip to R2 as:`, objectKey);

  // Generate signed URL (valid for 7 days)
  const getObjectCommand = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  });

  const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 604800 }); // 7 days
  return signedUrl;
}

// ---------------------------
// MAIN
// ---------------------------
async function main() {
  try {
    await cleanAndPrepareDirs();

    const version = await readAppVersion();
    console.log("📗 App version from package.json:", version);

    await bundleAndroid();
    await bundleIOS();

    await writeOtaVersion(version);

    // Create separate zips for Android and iOS
    await zipFolder(ANDROID_DIR, ANDROID_ZIP_PATH, "Android");
    await zipFolder(IOS_DIR, IOS_ZIP_PATH, "iOS");

    // Upload Android bundle
    const androidKey = `ota/android/v${version}.zip`;
    const androidSignedUrl = await uploadToR2(ANDROID_ZIP_PATH, androidKey, "Android");

    // Upload iOS bundle
    const iosKey = `ota/ios/v${version}.zip`;
    const iosSignedUrl = await uploadToR2(IOS_ZIP_PATH, iosKey, "iOS");

    // Clean up zip files and build directory after successful uploads
    console.log("\n🧹 Cleaning up local files...");
    await fsp.rm(ANDROID_ZIP_PATH, { force: true }).catch(() => {});
    await fsp.rm(IOS_ZIP_PATH, { force: true }).catch(() => {});
    await fsp.rm(OTA_ROOT, { recursive: true, force: true }).catch(() => {});
    console.log("✅ Cleanup complete");

    console.log("\n🎉 OTA build + upload completed");
    console.log("\n📎 Signed URLs (valid for 7 days):");
    console.log("Android:", androidSignedUrl);
    console.log("iOS:", iosSignedUrl);
    console.log("\n📦 Object Keys:");
    console.log("Android:", androidKey);
    console.log("iOS:", iosKey);

    // Return URLs as JSON for programmatic use
    const result = {
      version,
      android: {
        key: androidKey,
        signedUrl: androidSignedUrl,
      },
      ios: {
        key: iosKey,
        signedUrl: iosSignedUrl,
      },
    };

    console.log("\n📋 JSON Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
}

main();
