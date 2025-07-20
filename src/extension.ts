import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

/**
 * 拡張機能が有効化されたときに呼び出されるメイン関数
 */
export function activate(context: vscode.ExtensionContext) {

	// ステータスバーに表示するアイテムを作成
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 101);
	context.subscriptions.push(statusBarItem);

	// イベントリスナーを登録
	// - アクティブなエディタが変更されたとき
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));
	// - ドキュメントのテキストが変更されたとき
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(updateStatusBarOnTextChange));
	// - 設定が変更されたとき
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateStatusBar));

	// 自動折り返しを切り替えるコマンドを登録
	const toggleWordWrapCommand = vscode.commands.registerCommand('my-char-counter.toggleWordWrap', () => {
		const config = vscode.workspace.getConfiguration('editor');
		const currentSetting = config.get('wordWrap');

		// 現在の設定が 'on' なら 'off' に、そうでなければ 'on' にする
		const newSetting = currentSetting === 'on' ? 'off' : 'on';

		// グローバル設定を更新
		config.update('wordWrap', newSetting, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(`エディタの自動折り返しを「${newSetting}」に設定しました。`);
	});
	context.subscriptions.push(toggleWordWrapCommand);

	// 起動時に一度ステータスバーを更新
	updateStatusBar();
}

/**
 * ステータスバーの表示を更新する
 */
function updateStatusBar(): void {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		statusBarItem.hide();
		return;
	}

	const doc = editor.document;
	const text = doc.getText();

	// 設定を取得
	const config = vscode.workspace.getConfiguration('my-char-counter');
	const includeNewlines = config.get<boolean>('includeNewlines', true);

	// 文字数を計算
	const totalCount = getTotalCharCount(text, includeNewlines);
	const japaneseCount = getJapaneseCharCount(text);

	// ステータスバーにテキストを設定して表示
	statusBarItem.text = `総文字数: ${totalCount} | 日本語: ${japaneseCount}`;
	statusBarItem.tooltip = "文字数カウンター (My Character Counter)";
	statusBarItem.show();
}

/**
 * テキスト変更イベントは頻繁に発生するため、
 * アクティブなドキュメントでのみステータスバーを更新するようにフィルタリングする
 */
function updateStatusBarOnTextChange(event: vscode.TextDocumentChangeEvent): void {
	if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
		updateStatusBar();
	}
}

/**
 * 総文字数を計算する
 * @param text 計算対象の文字列
 * @param includeNewlines 改行文字を含めるかどうかのフラグ
 */
function getTotalCharCount(text: string, includeNewlines: boolean): number {
	if (includeNewlines) {
		return text.length;
	} else {
		// 正規表現で改行文字（\n, \r\n, \r）を削除して長さを返す
		return text.replace(/(\r\n|\n|\r)/g, "").length;
	}
}

/**
 * 日本語の文字（ひらがな、カタカナ、漢字）をカウントする
 * @param text 計算対象の文字列
 */
function getJapaneseCharCount(text: string): number {
	// ひらがな、カタカナ、CJK統合漢字の範囲を正規表現で指定
	const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g;
	const matches = text.match(japaneseRegex);
	return matches ? matches.length : 0;
}

export function deactivate() { }