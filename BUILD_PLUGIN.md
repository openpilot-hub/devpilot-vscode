# How to build DevPilot VSCode plugin

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) version 1.75.0 or higher
- [pnpm](https://pnpm.io/) package manager

### Dependencies

- AI gateway: support multi LLM model and provide api for plugin (We will opensource this project in the future)
- Auth System: support authorization check for login user (You can turn it off by setting `env.AUTH_ON` to false)
- Telemetry System: upload user behavior data for analysis (You can turn it off by setting `env.TELEMETRY_ON` to false)

## How to build

1. Clone the repository:

   ```sh
   git clone https://github.com/openpilot-hub/devpilot-vscode.git
   cd devpilot-vscode
   ```

2. Install the dependencies:

   ```sh
   pnpm install
   ```

3. Build the Webview:
   see [DevPilot Webview](https://github.com/openpilot-hub/devpilot-h5) for more details

4. Compile the extension:

   ```sh
   pnpm run package:ext
   ```

5. Package the extension:

   ```sh
   pnpm run pack
   ```

6. Install the packaged extension in VSCode:

   ```sh
   code --install-extension devpilot-1.5.2.vsix
   ```
