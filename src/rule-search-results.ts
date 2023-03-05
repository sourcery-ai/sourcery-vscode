import * as vscode from 'vscode';
import {Position, TreeItemLabel, Uri} from "vscode";

class ScanResult extends vscode.TreeItem
{
  children: undefined;
  startPosition: Position;
  endPosition: Position;
  edits: any[];

  constructor(label: TreeItemLabel, uri: Uri, startPosition: Position, endPosition: Position, edits) {
    super(label);
    this.resourceUri = uri;
    this.startPosition = startPosition;
    this.endPosition = endPosition;
    this.edits = edits;
    if (edits.length > 0) {
      this.contextValue = "editable";
    }
  }
}

class FileResults extends vscode.TreeItem
{
  children: ScanResult[] | undefined;
  startPosition: Position
  endPosition: Position
  constructor(label: string | undefined, uri: Uri, children?: ScanResult[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
    this.resourceUri = uri;
    this.startPosition = new Position(0, 0);
    this.endPosition = new Position(0, 0);

    this.description = true;
  }
}


export class DiagnosticTreeView implements vscode.TreeDataProvider<FileResults>
    {
        // will hold our tree view data
        data : FileResults [] = [];

        private _onDidChangeTreeData: vscode.EventEmitter<FileResults | undefined | null | void> = new vscode.EventEmitter<FileResults | undefined | null | void>();

        readonly onDidChangeTreeData: vscode.Event<FileResults | undefined | null | void> = this._onDidChangeTreeData.event;

          constructor() {
            this.data = [];
          }

          getTreeItem(element: FileResults|ScanResult): vscode.TreeItem|Thenable<vscode.TreeItem> {
            element.command = {command: 'sourcery.selectCode', title: "Open", arguments: [element.resourceUri, element.startPosition, element.endPosition , [], "goto"] }
            return element;
          }

          getChildren(element?: FileResults|ScanResult|undefined): vscode.ProviderResult<FileResults[]|ScanResult[]> {
            if (element === undefined) {
              return this.data;
            }
            return element.children;
          }

          update(params): void {
            const uri = Uri.parse(params.uri);
            let scanResults = []
            for (let result of params.diagnostics) {
                scanResults.push(new ScanResult(
                            {label:result.first_line_code, highlights:[result.first_line_highlight]},
                                  uri,
                                  new Position(result.range.start.line, result.range.start.character),
                                  new Position(result.range.end.line, result.range.end.character),
                                  result.text_edits
                ));
            }
            this.data.push(new FileResults(undefined, uri, scanResults));
            this._onDidChangeTreeData.fire();
          }

          clear(): void {
            this.data = [];
            this._onDidChangeTreeData.fire();
          }
    }