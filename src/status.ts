/*---------------------------------------------------------
 * Inspired from status of go extension
 *--------------------------------------------------------*/
'use strict';

import { AMIGA_ASM_MODE } from "./extension";
import * as vscode from "vscode";

export class StatusManager {
    diagnosticsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarEntry: vscode.StatusBarItem | null = null;
    public showHideStatus(): void {
        if (this) {
            if (this.statusBarEntry === null) {
                return;
            }
            if (!vscode.window.activeTextEditor) {
                this.statusBarEntry.hide();
                return;
            }
            if (vscode.languages.match(AMIGA_ASM_MODE, vscode.window.activeTextEditor.document)) {
                this.statusBarEntry.show();
                return;
            }
            this.statusBarEntry.hide();
        }
    }
    public dispose(): void {
        if (this.statusBarEntry !== null) {
            this.statusBarEntry.dispose();
            this.statusBarEntry = null;
        }
        this.diagnosticsStatusBarItem.dispose();
    }
    public showStatus(message: string, command: string, tooltip?: string): void {
        this.statusBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarEntry.text = message;
        this.statusBarEntry.command = command;
        this.statusBarEntry.tooltip = tooltip;
        this.onDefault();
        this.statusBarEntry.show();
    }
    public onDefault(): void {
        if (this.statusBarEntry) {
            this.statusBarEntry.color = 'yellow';
        }
    }
    public onSuccess(): void {
        if (this.statusBarEntry) {
            this.statusBarEntry.color = new vscode.ThemeColor('statusBar.foreground');
        }
    }
    public onError(message: string): void {
        vscode.window.showErrorMessage(message);
        if (this.statusBarEntry) {
            this.statusBarEntry.color = new vscode.ThemeColor('errorForeground');
        }
    }
}