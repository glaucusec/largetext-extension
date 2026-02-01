import GObject from "gi://GObject";
import Gio from "gi://Gio";
import St from "gi://St";
import Clutter from "gi://Clutter";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

const TEXT_SCALING_SCHEMA = "org.gnome.desktop.interface";
const TEXT_SCALING_KEY = "text-scaling-factor";
const NORMAL_SCALE = 1.0;
const LARGE_SCALE = 1.25;

const ToggleButton = GObject.registerClass(
  class ToggleButton extends PanelMenu.Button {
    _init() {
      super._init(0.0, "Large Text Toggle");

      // Create the icon (Updated to Font symbol)
      this._icon = new St.Icon({
        icon_name: "preferences-desktop-font-symbolic",
        style_class: "system-status-icon",
      });

      this.add_child(this._icon);

      // Connect to GSettings
      this._settings = new Gio.Settings({ schema_id: TEXT_SCALING_SCHEMA });

      // 1. Save the Signal ID so we can disconnect it later
      this._settingsSignalId = this._settings.connect(
        `changed::${TEXT_SCALING_KEY}`,
        () => {
          this._updateIconState();
        },
      );

      this._updateIconState();

      this.connect("button-press-event", () => {
        this._toggleTextSize();
        return Clutter.EVENT_STOP;
      });
    }

    _toggleTextSize() {
      const currentScale = this._settings.get_double(TEXT_SCALING_KEY);
      // Toggle logic
      const newScale = currentScale < 1.1 ? LARGE_SCALE : NORMAL_SCALE;
      this._settings.set_double(TEXT_SCALING_KEY, newScale);
    }

    _updateIconState() {
      // Safety check: ensure icon still exists before trying to modify it
      if (!this._icon) return;

      const currentScale = this._settings.get_double(TEXT_SCALING_KEY);
      if (currentScale > 1.1) {
        this.add_style_class_name("active-toggle");
        // Optional: Visual cue (e.g., make it look pressed/active)
        this._icon.opacity = 255;
      } else {
        this.remove_style_class_name("active-toggle");
        this._icon.opacity = 200; // Slightly dimmer when off
      }
    }

    // 2. Create a clean-up method
    destroy() {
      // Disconnect the settings listener
      if (this._settingsSignalId) {
        this._settings.disconnect(this._settingsSignalId);
        this._settingsSignalId = null;
      }

      this._settings = null;

      // Call the parent destroy to clean up the widget itself
      super.destroy();
    }
  },
);

export default class LargeTextExtension extends Extension {
  enable() {
    this._indicator = new ToggleButton();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    if (this._indicator) {
      // This triggers the destroy() method we wrote above
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
