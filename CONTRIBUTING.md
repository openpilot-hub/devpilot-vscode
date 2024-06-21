## Contributing

Welcome to DevPilot Visual Studio Code repository. We are glad you are here!

Everyone is welcome to contribute to this repository.

### Requirements

| dependency | version  |
| ---------- | -------- |
| node       | >=16     |
| vscode     | >=1.75.0 |

### Developing

1. Clone the following two repositories to your local machine **in the same folder**

   plugin：`git clone https://github.com/openpilot-hub/devpilot-vscode.git`

   webview content: `git clone https://github.com/openpilot-hub/devpilot-h5.git`

2. Install dependencies for each repository

   `pnpm install`

   or

   `npm install`

   or

   `yarn install`

3. Update the domains to use your own AI gateway

   in `devpilot-vscode/src/utils/domain.ts`

4. Build the webview content

   under devpilot-h5, run `npm run build:vscode`

5. debug the extension

   under devpilot-vscode, run `npm run dev`

   after that, press <kbd>F5</kbd> to launch the extension

### Testing & Checks

Before you commit your changes, please check & test carefully if there are any errors.
