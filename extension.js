import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { setLogging, setLogFn, journal } from './utils.js'

let activeWorkspaceChangedId;

const WindowManager = global.get_window_manager();
const WorkspaceManager = global.get_workspace_manager();

export default class maximizeLonleyWindow extends Extension {
    enable() {
        activeWorkspaceChangedId = WindowManager.connect('switch-workspace', this.onWorkspaceChanged.bind(this));

        setLogFn((msg, error = false) => {
            let level;
            if (error) {
                level = GLib.LogLevelFlags.LEVEL_CRITICAL;
            } else {
                level = GLib.LogLevelFlags.LEVEL_MESSAGE;
            }

            GLib.log_structured(
                'maximize-lonely-window-by-blueray453',
                level,
                {
                    MESSAGE: `${msg}`,
                    SYSLOG_IDENTIFIER: 'maximize-lonely-window-by-blueray453',
                    CODE_FILE: GLib.filename_from_uri(import.meta.url)[0]
                }
            );
        });


        setLogging(true);

        // journalctl -f -o cat SYSLOG_IDENTIFIER=maximize-lonely-window-by-blueray453
        journal(`Enabled`);
    }

    disable() {
        WindowManager.disconnect(activeWorkspaceChangedId);
    }

    onWorkspaceChanged() {

        let current_workspace = WorkspaceManager.get_active_workspace();

        let windowsOnWorkspace = global.get_window_actors().map(actor => actor.meta_window).filter(win => win.get_window_type() === Meta.WindowType.NORMAL).filter(win =>
            win.is_on_all_workspaces() || win.get_workspace() === current_workspace
        );

        if (windowsOnWorkspace.length === 1) {
            let window = windowsOnWorkspace[0];
            if (window.get_maximized() !== Meta.MaximizeFlags.BOTH) {
                journal(`Maximizing Window`);
                window.maximize(Meta.MaximizeFlags.BOTH);
            }
        }


    }
}
