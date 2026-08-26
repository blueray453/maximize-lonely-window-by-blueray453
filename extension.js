import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import {
    initLogging,
    createLogger,
} from './logger.js';

const journal = createLogger(import.meta.url);

let activeWorkspaceChangedId;

const WindowManager = global.get_window_manager();
const WorkspaceManager = global.get_workspace_manager();

export default class maximizeLonleyWindow extends Extension {
    enable() {
        initLogging(this.uuid, 'both', false);
        journal(`Enabled`);

        activeWorkspaceChangedId = WindowManager.connect('switch-workspace', this.onWorkspaceChanged.bind(this));
    }

    disable() {
        WindowManager.disconnect(activeWorkspaceChangedId);
    }

    onWorkspaceChanged() {
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {

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

            return GLib.SOURCE_REMOVE; // important to avoid repeated execution
        });

    }
}
