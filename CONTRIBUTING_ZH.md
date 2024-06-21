## 贡献

欢迎来到 DevPilot Visual Studio Code 插件仓库。我们很高兴在这里见到你！

我们欢迎所有人为这个仓库做出贡献。

### 前提要求

| 依赖项 | 版本     |
| ------ | -------- |
| node   | >=16     |
| vscode | >=1.75.0 |

### 开发

1. 克隆下面两个仓库到本地**同一个文件夹**下

   插件侧: `git clone https://github.com/openpilot-hub/devpilot-vscode.git`

   webview 内容侧: `git clone https://github.com/openpilot-hub/devpilot-h5.git`

2. 为每个项目安装依赖

   `pnpm install`

   或者

   `npm install`

   或者

   `yarn install`

3. 修改域名以使用你自己的 AI 网关接口

   位于 `devpilot-vscode/src/utils/domain.ts`

4. 构建 webview 内容侧

   在 devpilot-h5 下, 执行 `npm run build:vscode`

5. 调试插件

   在 devpilot-vscode 下, 执行 `npm run dev`

   然后，在 VSCode 中，按下 `F5`，即可调试插件

### 测试和检查

在提交 commit 之前，请仔细检查测试是否有错误。
