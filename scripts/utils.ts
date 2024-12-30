import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import inquirer from "inquirer";

// GitHub API URL for the latest release
const repoOwner = "Turtlepaw";
const repoName = "clockwork";
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

// Custom spinner function
export async function progressIndicator(taskName: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let frameIndex = 0;
  let intervalId: NodeJS.Timeout;

  // Function to animate the spinner
  const animate = () => {
    process.stdout.write(`\r${chalk.cyan(frames[frameIndex])} ${taskName}`); // Overwrite the line with each frame
    frameIndex = (frameIndex + 1) % frames.length; // Cycle through frames
  };

  // Start the spinner
  intervalId = setInterval(animate, 80);

  // Stop method
  function stop(isSuccess = true) {
    clearInterval(intervalId); // Stop the spinner
    process.stdout.write(
      `\r${isSuccess ? chalk.green("✓") : chalk.red("✘")} ${taskName}\n`
    );
  }

  // Function to update the message
  function updateMessage(message: string) {
    clearInterval(intervalId);
    taskName = message;
    intervalId = setInterval(animate, 80);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return stop method for external usage
  return { stop, updateMessage };
}

export async function updater(debugMode: boolean, VERSION: string) {
  const _buildDownloadDirectory = ".wff-build-script/downloads";
  const buildDownloadsDirectory = path.resolve(_buildDownloadDirectory);

  /**
   * Safely replace a binary file (cross-platform).
   * @param currentPath - Path to the current binary.
   * @param tempPath - Temporary path for the new binary.
   */
  async function replaceBinary(currentPath: string, tempPath: string) {
    try {
      // Check if the current binary exists
      if (fs.existsSync(currentPath)) {
        const backupPath = `${currentPath}.bak`;

        // Rename the current file to .bak (as a backup)
        if (debugMode)
          console.log(
            chalk.yellow(`Renaming current binary to: ${backupPath}`)
          );
        fs.renameSync(currentPath, backupPath);

        // Move the new binary to the target path
        if (debugMode)
          console.log(
            chalk.yellow(`Replacing with new binary: ${currentPath}`)
          );
        fs.renameSync(tempPath, currentPath);

        if (debugMode)
          console.log(chalk.green("Binary replaced successfully!"));
      } else {
        // If the binary doesn't exist, just move the new binary
        if (debugMode)
          console.log(
            chalk.yellow(`No existing binary found. Adding new binary.`)
          );
        fs.renameSync(tempPath, currentPath);
      }
    } catch (error: any) {
      console.error(chalk.red("Failed to replace binary:"), error.message);
      throw error;
    }
  }

  /**
   * Download a file using curl (cross-platform).
   * @param url - The URL to download the file from.
   * @param outputPath - The path to save the downloaded file.
   */
  function downloadFile(url: string, outputPath: string) {
    try {
      if (debugMode) console.log(chalk.cyan(`Downloading file from: ${url}`));
      execSync(`curl -L --create-dirs -o "${outputPath}" "${url}"`, {
        stdio: "inherit",
      });
      if (debugMode)
        console.log(chalk.green(`File downloaded to: ${outputPath}`));
    } catch (error: any) {
      console.error(chalk.red("Failed to download file:"), error.message);
      throw error;
    }
  }

  async function fetchLatestReleaseWithCurl(release: any) {
    const updateSpinner = await progressIndicator(
      "Determining latest release asset..."
    );
    try {
      if (release.assets && release.assets.length > 0) {
        const platform = process.platform;
        const asset = release.assets.find((a: any) => {
          if (platform === "win32" && a.name.includes("build-win")) return true;
          if (platform === "linux" && a.name.includes("build-linux"))
            return true;
          if (platform === "darwin" && a.name.includes("build-macos"))
            return true;
          return false;
        });

        if (!asset) {
          console.error("No compatible asset found for the current platform.");
          return;
        }

        const downloadUrl = asset.browser_download_url;
        const outputPath = path.join(".", asset.name);

        if (!fs.existsSync(buildDownloadsDirectory)) {
          fs.mkdirSync(buildDownloadsDirectory, { recursive: true });
        }

        // Add temporary path to .gitignore
        const gitignorePath = path.resolve(".", ".gitignore");

        updateSpinner.updateMessage("Adding files to git ignore...");
        const content = `# Temporary download files\n${_buildDownloadDirectory}\n`;
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(gitignorePath, content);
        } else {
          const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
          if (!gitignoreContent.includes(_buildDownloadDirectory)) {
            fs.appendFileSync(gitignorePath, `\n${content}`);
          }
        }

        updateSpinner.updateMessage("Downloading latest release...");
        const tempPath = path.resolve(
          buildDownloadsDirectory,
          `${asset.name}.tmp`
        ); // Temporary file path

        downloadFile(downloadUrl, tempPath);
        replaceBinary(outputPath, tempPath);
        console.log(
          chalk.green(`Replaced ${outputPath} with the latest version.`)
        );
      } else {
        console.error(chalk.red("No assets found in the latest release."));
      }
    } catch (error: any) {
      console.error("Error fetching or downloading release:", error.message);
    } finally {
      updateSpinner.stop(true);
    }
  }

  /**
   * Cleanup old tmp download files in buildDownloadsDirectory.
   */
  async function cleanup() {
    const tmpFiles = fs
      .readdirSync(buildDownloadsDirectory)
      .filter((f) => f.endsWith(".tmp"));
    if (tmpFiles.length > 0) {
      const spinner = await progressIndicator("Cleaning downloaded files...");
      tmpFiles.forEach((f) => fs.unlinkSync(f));
      spinner.stop(true);
    }
  }

  // Main function to fetch the latest release and download the asset
  async function fetchLatestRelease() {
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Node.js" }, // Required by GitHub API
    });

    if (!response.ok) {
      console.error("Failed to fetch release info:", response.statusText);
      return;
    }

    const release = await response.json();
    return {
      version: release.tag_name,
      data: release,
    };
  }

  // Check if newer version is available
  const updateSpinner = await progressIndicator("Checking for updates...");
  try {
    const latestVersion = await fetchLatestRelease();
    if (latestVersion && latestVersion.version !== VERSION) {
      updateSpinner.stop(true);
      // Ask user if they want to download the latest release
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "download-update",
          message: `A newer version (${latestVersion.version}) is available. Download the latest release?`,
          default: false,
        },
      ]);

      if (answer["download-update"]) {
        await fetchLatestReleaseWithCurl(latestVersion.data);
        console.log("Update complete.");
        process.exit(0);
      }
    }
  } catch {
    updateSpinner.stop(false);
    console.error("Failed to check for updates.");
  }

  cleanup();
}

export function initMessage(version: string) {
  console.log(
    chalk.cyan(
      "Clockwork CLI - the open-source package manager for Watch Face Format - v" +
        version
    )
  );
}
