# 构建 DevPilot VSCode 插件

## 前提条件

- [Visual Studio Code](https://code.visualstudio.com/) 版本 1.75.0 或更高
- [pnpm](https://pnpm.io/) 包管理器

### 依赖

如果想构建一个完整的属于你自己的 DevPilot 应用，需要有如下几个条件：

1. AI 网关：用于兼容不同的 LLM 模型，并提供 API 给插件使用（后续我们会开源 AI 网关的实现）
2. 权限系统：用于校验插件用户的登录和使用权限（可以通过设置`env.AUTH_ON`为 false 来关闭）
3. 指标系统：用于处理用户上报的使用数据用于分析（可以通过设置`env.TELEMETRY_ON`为 false 来关闭）

## 构建步骤

1. 克隆仓库：

   ```sh
   git clone https://github.com/openpilot-hub/devpilot-vscode.git
   cd devpilot-vscode
   ```

2. 安装依赖：

   ```sh
   pnpm install
   ```

3. 构建 Webview：
   有关详细信息，请参见 [DevPilot Webview](https://github.com/openpilot-hub/devpilot-h5)

4. 编译扩展：

   ```sh
   pnpm run package:ext
   ```

5. 打包扩展：

   ```sh
   pnpm run pack
   ```

6. 在 VSCode 中安装打包好的扩展：

   ```sh
   code --install-extension devpilot-1.5.2.vsix
   ```
