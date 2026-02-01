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
      // 0.0 is alignment (0.0 = left, 0.5 = center, 1.0 = right usually, but in panel it just means order)
      super._init(0.0, "Large Text Toggle");

      // Create the icon
      this._icon = new St.Icon({
        icon_name: "preferences-desktop-font-symbolic",
        style_class: "system-status-icon",
      });

      // Add icon to the button container
      this.add_child(this._icon);

      // Connect to GSettings
      this._settings = new Gio.Settings({ schema_id: TEXT_SCALING_SCHEMA });

      // Watch for external changes (e.g. if you change it in Settings app)
      this._settings.connect(`changed::${TEXT_SCALING_KEY}`, () => {
        this._updateIconState();
      });

      // Initialize state
      this._updateIconState();

      // Handle the click
      this.connect("button-press-event", () => {
        this._toggleTextSize();
        return Clutter.EVENT_STOP; // Prevents the menu from trying to open
      });
    }

    _toggleTextSize() {
      const currentScale = this._settings.get_double(TEXT_SCALING_KEY);
      // If scale is roughly 1.0, switch to Large. Otherwise reset to Normal.
      const newScale = currentScale < 1.1 ? LARGE_SCALE : NORMAL_SCALE;
      this._settings.set_double(TEXT_SCALING_KEY, newScale);
    }

    _updateIconState() {
      // Optional: Visual feedback.
      // We can change opacity or icon style to show if it's "Active"
      const currentScale = this._settings.get_double(TEXT_SCALING_KEY);
      if (currentScale > 1.1) {
        this._icon.style_class = "system-status-icon"; // Normal bright
        this.add_style_class_name("active-toggle"); // Add a class we could style if we wanted
      } else {
        // Make it slightly dimmer or just standard
        this._icon.style_class = "system-status-icon";
        this.remove_style_class_name("active-toggle");
      }
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
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
