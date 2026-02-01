import GObject from "gi://GObject";
import Gio from "gi://Gio";
import St from "gi://St";
import Clutter from "gi://Clutter";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

// System Settings
const SYSTEM_SCHEMA = "org.gnome.desktop.interface";
const TEXT_SCALING_KEY = "text-scaling-factor";
const NORMAL_SCALE = 1.0;

// Note: We no longer define LARGE_SCALE constant here.

const ToggleButton = GObject.registerClass(
  class ToggleButton extends PanelMenu.Button {
    _init(extensionSettings) {
      super._init(0.0, "Large Text Toggle");

      // Store our extension's custom settings (to read the user preference)
      this._mySettings = extensionSettings;

      // Create the icon
      this._icon = new St.Icon({
        icon_name: "preferences-desktop-font-symbolic",
        style_class: "system-status-icon",
      });
      this.add_child(this._icon);

      // Connect to System Settings (to change the actual OS text size)
      this._systemSettings = new Gio.Settings({ schema_id: SYSTEM_SCHEMA });

      // Listen for system changes (if user changes it in GNOME Settings)
      this._systemSignalId = this._systemSettings.connect(
        `changed::${TEXT_SCALING_KEY}`,
        () => {
          this._updateIconState();
        },
      );

      // Initialize state
      this._updateIconState();

      // Handle Click
      this.connect("button-press-event", () => {
        this._toggleTextSize();
        return Clutter.EVENT_STOP;
      });
    }

    _toggleTextSize() {
      const currentScale = this._systemSettings.get_double(TEXT_SCALING_KEY);

      // READ THE USER'S PREFERRED VALUE
      const targetLargeScale = this._mySettings.get_double("scale-factor");

      // If currently close to normal, switch to target. Else reset to 1.0
      // We use a small epsilon (0.01) because floating point math is messy
      if (currentScale < 1.05) {
        this._systemSettings.set_double(TEXT_SCALING_KEY, targetLargeScale);
      } else {
        this._systemSettings.set_double(TEXT_SCALING_KEY, NORMAL_SCALE);
      }
    }

    _updateIconState() {
      if (!this._icon) return;

      const currentScale = this._systemSettings.get_double(TEXT_SCALING_KEY);

      // If scale is significantly larger than 1.0, we are "Active"
      if (currentScale > 1.05) {
        this.add_style_class_name("active-toggle");
        this._icon.opacity = 255;
      } else {
        this.remove_style_class_name("active-toggle");
        this._icon.opacity = 200;
      }
    }

    destroy() {
      // Clean up system signal
      if (this._systemSignalId) {
        this._systemSettings.disconnect(this._systemSignalId);
        this._systemSignalId = null;
      }

      this._systemSettings = null;
      this._mySettings = null; // No need to disconnect, we didn't listen to it, just read it.
      super.destroy();
    }
  },
);

export default class LargeTextExtension extends Extension {
  enable() {
    // Pass the extension's settings object to the button
    this._indicator = new ToggleButton(this.getSettings());
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
