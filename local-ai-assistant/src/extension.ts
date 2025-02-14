// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import ollama from 'ollama';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "local-ai-assistant" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('local-ai-assistant.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Local AI Assistant!');
	});

	context.subscriptions.push(disposable);

	const start = vscode.commands.registerCommand('local-ai-assistant.start', () => {

		const panel = vscode.window.createWebviewPanel(
			'chat',
			'Local AI Assistant Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command == 'chat') {
				const userPrompt = message.text;
				let responseText = 'Answer: ';

				try {

					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					});

					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}

				} catch (err) {
					console.error(err);
				}
			}
		});
	});

	context.subscriptions.push(start);
}

function getWebviewContent(): string {
	return /* html */`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<style>
					body { font-family: sans-serif; margin: 1rem; }
					#prompt { width: 100%; box-sizing: border-box; }
					#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; }
				</style>
			</head>
			<body>
				<h2>Local AI Assistant - VS Code Extension</h2>
				<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
				<br />
				<button id="askBtn">Ask</button>
				<div id="response"></div>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('askBtn').addEventListener('click', () => {
						const text = document.getElementById('prompt').value;
						vscode.postMessage({ command: 'chat', text });
					});

					window.addEventListener('message', event => {
						const { command, text } = event.data;
						if (command === 'chatResponse') {
							document.getElementById('response').innerText = text;
						}
					})
				</script>

			</body>
		</html>
	`
}

// This method is called when your extension is deactivated
export function deactivate() {}
