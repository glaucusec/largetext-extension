import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class LargeTextPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Create a preference page
    const page = new Adw.PreferencesPage();
    window.add(page);

    // Create a group
    const group = new Adw.PreferencesGroup({
      title: "Scaling Settings",
      description: 'Configure the target size for "Large Text".',
    });
    page.add(group);

    // Create the row (SpinButton)
    const row = new Adw.SpinRow({
      title: "Large Text Scale Factor",
      subtitle: "Default is 1.25. Try 1.15 for laptop screens.",
      digits: 2, // <--- ADD THIS LINE (Allows 1.15 instead of 1)
      adjustment: new Gtk.Adjustment({
        lower: 1.0,
        upper: 2.0,
        step_increment: 0.05,
        page_increment: 0.1,
      }),
    });
    group.add(row);

    // FIX IS HERE: Use 'this.getSettings()' instead of 'window.getSettings()'
    this.getSettings().bind(
      "scale-factor",
      row,
      "value",
      0, // Bind flags (Default)
    );
  }
}
