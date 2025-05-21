#!/usr/bin/env node

/**
 * ArgoCD CSS Generator for Storybook
 *
 * This script generates a consolidated CSS file from Argo UI and Argo CD repositories
 * by cloning the repos, compiling their SCSS files, and outputting the combined CSS.
 *
 * The script:
 * 1. Creates a temporary directory
 * 2. Clones/updates Argo UI and Argo CD repositories
 * 3. Installs dependencies with pnpm
 * 4. Compiles SCSS files from both repositories
 * 5. Outputs the combined CSS to stdout
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } = require('fs');
const { join } = require('path');
const os = require('os');
const sass = require('sass');

// Create a unique temporary directory
const TEMP_DIR = join(os.tmpdir(), 'storybook-argo-css-' + Date.now());

// Track compilation errors
const compilationErrors = [];

/**
 * Execute shell command and redirect stdout to stderr
 *
 * @param {string} command - Shell command to execute
 * @param {Object} options - Options for child_process.execSync
 * @returns {Buffer} Command output
 */
function execAndRedirect(command, options = {}) {
  // Redirect stdout to stderr
  const result = execSync(command, {
    ...options,
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  // Write stdout to stderr
  if (result && result.length > 0) {
    process.stderr.write(result);
  }

  return result;
}

/**
 * Clone a repository or pull latest changes if already cloned
 *
 * @param {Object} repo - Repository information
 * @param {string} repo.name - Name of the repository
 * @param {string} repo.url - Git URL of the repository
 * @returns {string} Path to the cloned repository
 */
function cloneOrUpdateRepo(repo) {
  const repoPath = join(TEMP_DIR, repo.name);

  console.error(`📦 Fetching ${repo.name}...`);

  if (!existsSync(repoPath)) {
    execAndRedirect(`git clone --depth=1 ${repo.url} ${repoPath}`);
  } else {
    execAndRedirect(`git -C ${repoPath} pull`);
  }

  return repoPath;
}

/**
 * Recursively find all SCSS files in a directory
 *
 * @param {string} directory - Directory to search in
 * @returns {string[]} Array of found SCSS file paths
 */
function findScssFiles(directory) {
  let scssFiles = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      scssFiles = scssFiles.concat(findScssFiles(entryPath));
    } else if (entry.isFile() && entryPath.endsWith('.scss')) {
      scssFiles.push(entryPath);
    }
  }

  return scssFiles;
}

/**
 * Install dependencies for a repository
 *
 * @param {string} repoPath - Path to the repository
 * @param {string} displayName - Display name for logging
 */
function installDependencies(repoPath, displayName) {
  try {
    console.error(`📦 Installing dependencies (pnpm) for ${displayName}...`);
    execAndRedirect('pnpm install', { cwd: repoPath });
  } catch (error) {
    console.error(`⚠️ Error installing dependencies for ${displayName}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Clone Argo UI repository and build CSS from its SCSS files
 *
 * @returns {string} Compiled CSS from Argo UI
 */
function buildArgoUiCss() {
  const argoUiPath = cloneOrUpdateRepo({
    name: 'argo-ui',
    url: 'https://github.com/argoproj/argo-ui.git',
  });

  installDependencies(argoUiPath, 'argo-ui');

  console.error('🎨 Compiling Argo UI SCSS (main.scss)...');

  try {
    const result = sass.compile(join(argoUiPath, 'src/styles/main.scss'), {
      style: 'compressed',
      loadPaths: [argoUiPath],
      sourceMap: false,
      silenceDeprecations: Object.keys(sass.deprecations).filter((key) => key !== 'user-authored'),
    });

    return result.css;
  } catch (error) {
    compilationErrors.push(`argo-ui: ${error.message}`);
    return '';
  }
}

/**
 * Clone Argo CD repository and build CSS from its SCSS files
 *
 * @returns {string} Compiled CSS from Argo CD
 */
function buildArgoCdCss() {
  const argoCdPath = cloneOrUpdateRepo({
    name: 'argo-cd',
    url: 'https://github.com/argoproj/argo-cd.git',
  });
  const uiPath = join(argoCdPath, 'ui');

  installDependencies(uiPath, 'argo-cd/ui');

  console.error('🎨 Compiling Argo CD SCSS (multiple files)...');

  try {
    const srcDir = join(uiPath, 'src');
    const scssFiles = findScssFiles(srcDir);
    let cssBundle = '';

    for (const file of scssFiles) {
      try {
        const result = sass.compile(file, {
          style: 'compressed',
          loadPaths: [srcDir, uiPath],
          sourceMap: false,
          silenceDeprecations: Object.keys(sass.deprecations).filter((key) => key !== 'user-authored'),
        });

        cssBundle += result.css + '\n';
      } catch (error) {
        compilationErrors.push(`argo-cd (${file}): ${error.message}`);
      }
    }

    return cssBundle;
  } catch (error) {
    compilationErrors.push(`argo-cd: ${error.message}`);
    return '';
  }
}

/**
 * Main function to orchestrate the CSS generation process
 */
function main() {
  try {
    // Create temporary directory
    mkdirSync(TEMP_DIR, { recursive: true });

    // Build CSS from both repositories
    const argoUiCss = buildArgoUiCss();
    const argoCdCss = buildArgoCdCss();

    // Output combined CSS to stdout
    process.stdout.write(argoUiCss + argoCdCss);

    console.error(`✅ CSS generation completed`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temporary directory
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error(`⚠️ Failed to clean up temporary directory: ${error.message}`);
    }
  }
}

// Run the script
main();

// Report compilation errors on exit
process.on('exit', () => {
  if (compilationErrors.length > 0) {
    console.error('\nSCSS Compilation Errors Summary:');
    compilationErrors.forEach((err, i) => {
      console.error(`  ${i + 1}. ${err}`);
    });
  } else {
    console.error('No SCSS compilation errors.');
  }
});
