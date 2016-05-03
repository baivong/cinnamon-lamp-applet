const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const AppletDir = imports.ui.appletManager.appletMeta["lamp-panel@baivong.github.io"].path;

let Commands = {
    "Start": "gksudo service apache2 start",
    "Stop": "gksudo service apache2 stop",
    "Restart": "gksudo service apache2 restart",
    "LocalHost": "xdg-open http://localhost/",
    "PhpMyAdmin": "xdg-open http://localhost/phpmyadmin/"
};
let Properties = ["custom-icon", "icon-name", "icon-label", "www-dir", "php-ini-dir", "apache-conf-dir"];

function addCommand(Name) {
    return function() {
        Util.spawnCommandLine(Commands[Name]);
    };
}

function LampPanel(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

LampPanel.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {

        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.settings = new Settings.AppletSettings(this, "lamp-panel@baivong.github.io", instance_id);

        for (let value of Properties) {
            this.settings.bindProperty(Settings.BindingDirection.IN,
                value,
                value.replace(/\-/g, "_"),
                this.on_settings_changed,
                null);
        }

        if (!this.custom_icon) {
            this.set_applet_icon_path(AppletDir + "/" + "lamp.svg");
            this.set_applet_tooltip("LAMP Panel Menu");
        }

        for (let Label in Commands) {
            this.menu.addAction(_(Label), addCommand(Label));
            if (Label === "Restart") this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        var _this = this;
        this.menu.addAction(_("Open Dir"), function() {
            let dir = _this.www_dir;
            if (!Gio.File.new_for_path(dir).query_exists(null) || dir.trim() === "") {
                dir = "/var/www/html";
            }
            Util.spawnCommandLine("nemo " + dir);
        });
        this.menu.addAction(_("PHP config"), function() {
            let dir = _this.php_ini_dir;
            if (!Gio.File.new_for_path(dir).query_exists(null) || dir.trim() === "" || dir.slice(-8) !== "/php.ini") {
                dir = "/etc/php5/apache2/php.ini";
            }
            Util.spawnCommandLine("gksudo gedit " + dir);
        });
        this.menu.addAction(_("Apache config"), function() {
            let dir = _this.apache_conf_dir;
            if (!Gio.File.new_for_path(dir).query_exists(null) || dir.trim() === "" || dir.slice(-5) !== ".conf") {
                dir = "/etc/apache2/apache2.conf";
            }
            Util.spawnCommandLine("gksudo gedit " + dir);
        });

        this.on_settings_changed();
    },

    on_settings_changed: function() {

        if (this.custom_icon) {
            let icon_file = Gio.File.new_for_path(this.icon_name);
            let label = this.icon_label.trim();

            if (icon_file.query_exists(null)) {
                this.set_applet_icon_path(this.icon_name);
            } else {
                this.set_applet_icon_name(this.icon_name);
            }
            if (!label) label = "LAMP Panel Menu";
            this.set_applet_tooltip(label);
        } else {
            this.set_applet_icon_path(AppletDir + "/" + "lamp.svg");
            this.set_applet_tooltip("LAMP Panel Menu");
        }

    },

    on_applet_clicked: function(event) {
        this.menu.toggle();
    },

    on_applet_removed_from_panel: function() {
        this.settings.finalize();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new LampPanel(orientation, panel_height, instance_id);
}
