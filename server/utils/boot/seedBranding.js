const fs = require("fs");
const path = require("path");

/**
 * Sabia: brand the instance from the environment so a customer deployment is
 * only an .env edit.
 *   CUSTOMER_NAME  app name shown in the UI
 *   CUSTOMER_LOGO  path inside the container to a png/svg/jpg, e.g.
 *                  /app/server/storage/branding/logo.png
 * Runs at boot and only writes when something changed, so admins can still
 * override in Settings > Appearance until the next boot with a different env.
 */
async function seedBranding() {
  const name = process.env.CUSTOMER_NAME?.trim();
  const logo = process.env.CUSTOMER_LOGO?.trim();
  if (!name && !logo) return;
  const { SystemSettings } = require("../../models/systemSettings");

  if (name) {
    const current = await SystemSettings.get({ label: "custom_app_name" });
    if (current?.value !== name) {
      await SystemSettings._updateSettings({ custom_app_name: name });
      console.log(`[branding] app name set to "${name}"`);
    }
  }

  if (logo) {
    if (!fs.existsSync(logo)) {
      console.error(`[branding] CUSTOMER_LOGO not found: ${logo}`);
      return;
    }
    const assets = path.join(
      process.env.STORAGE_DIR || path.resolve(__dirname, "../../storage"),
      "assets"
    );
    const target = `customer-logo${path.extname(logo) || ".png"}`;
    const dest = path.join(assets, target);
    fs.mkdirSync(assets, { recursive: true });
    const stale =
      !fs.existsSync(dest) ||
      fs.statSync(dest).mtimeMs < fs.statSync(logo).mtimeMs;
    if (stale) fs.copyFileSync(logo, dest);
    if ((await SystemSettings.currentLogoFilename()) !== target) {
      await SystemSettings._updateSettings({ logo_filename: target });
      console.log(`[branding] logo set from ${logo}`);
    }
  }
}

module.exports = { seedBranding };
