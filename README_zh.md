# BionicRead

中文 | [English](README.md)

免费开源的 Bionic Reading Chrome 浏览器插件。加粗每个单词的前几个字母，帮助你读得更快。

## 什么是 Bionic Reading？

Bionic Reading 是一种阅读辅助技术，通过加粗每个单词的前半部分来引导眼球运动，可能提升阅读速度和理解力。本插件是官方 Bionic Reading 工具的免费、注重隐私的开源替代品。

## 功能特性

- **一键开关** — 在任意页面上即时启用/关闭 Bionic Reading
- **动态内容支持** — 自动转换页面加载后新增的文本（SPA 应用、无限滚动）
- **轻量级** — 零依赖，总计约 5KB
- **隐私优先** — 不收集数据，不发网络请求，不需要账号
- **永久免费** — 基于 MIT 开源协议

## 安装方法

### 方式一：从 Chrome 应用商店安装（最简单）

_即将上线..._

### 方式二：从源码安装（推荐高级用户）

如果你熟悉 git，可以直接克隆仓库：

```bash
git clone https://github.com/tianzhiceng297-boop/bionic-read.git
```

然后按照**方式三**的步骤加载克隆下来的文件夹。

### 方式三：从源码安装（零基础保姆级教程）

从没安装过浏览器插件？没关系，跟着下面一步步来：

#### 第 1 步 — 下载插件文件

将源码下载为 ZIP 压缩包：

1. 打开 [https://github.com/tianzhiceng297-boop/bionic-read](https://github.com/tianzhiceng297-boop/bionic-read)
2. 点击页面顶部绿色的 **"Code"** 按钮
3. 选择 **"Download ZIP"**
4. 将下载的 ZIP 文件解压到电脑上的任意文件夹

> 解压后的文件夹里应该包含 `manifest.json`、`content.js`、`popup.html` 等文件。

#### 第 2 步 — 打开 Chrome 扩展管理页面

1. 打开 Google Chrome 浏览器（或其他基于 Chromium 的浏览器，如 Edge、Brave）
2. 在地址栏输入 `chrome://extensions/` 并按回车
3. 也可以通过菜单操作：点击右上角 **菜单图标**（三个点 ⋮）→ **扩展程序** → **管理扩展程序**

#### 第 3 步 — 开启开发者模式

1. 在扩展管理页面，找到 **右上角** 的 **"开发者模式"** 开关
2. 将其 **打开** — 这允许你从本地加载扩展
3. 不用担心，这只是让 Chrome 允许你加载自己的扩展程序，很安全

#### 第 4 步 — 加载插件

1. 点击页面 **左上角** 出现的 **"加载已解压的扩展程序"** 按钮
2. 在弹出的文件选择器中，找到你在第 1 步解压的 `bionic-read` 文件夹
3. 选中该文件夹并点击 **"选择文件夹"**

> **注意**：请选择包含 `manifest.json` 的那个文件夹，不要选它的上级目录。

#### 第 5 步 — 确认安装成功

- 扩展列表中应该出现名为 **"BionicRead"** 的扩展
- Chrome 工具栏会出现一个拼图 🧩 图标 — 点击它，然后将 BionicRead 固定到工具栏
- 你应该在工具栏看到 BionicRead 的图标（蓝色圆角方形，上面有一个 "B"）

#### Microsoft Edge 用户

Edge 也使用 Chromium 内核，同样可以安装 Chrome 扩展：

1. 在地址栏输入 `edge://extensions/`
2. 开启 **开发者模式**（在左侧边栏）
3. 点击 **"加载已解压的扩展"**，选择 `bionic-read` 文件夹

## 使用方法

1. 点击浏览器工具栏中的 **BionicRead** 图标（如果看不到，先点击 🧩 拼图图标找找）
2. 切换开关来启用/关闭当前页面的 Bionic Reading
3. 页面文本会即时转换 — 无需刷新
4. 开关状态会自动保存 — 跨页面记住你的偏好

### 使用提示

- **某个页面不生效？** 部分页面（如 Chrome 应用商店本身）出于安全原因会限制扩展脚本运行
- **动态页面**：BionicRead 会自动处理滚动加载内容的页面（如 Twitter、Reddit 等）
- **临时关闭**：只需把开关关掉 — 页面文本会立刻恢复原样

## 算法原理

BionicRead 使用经过验证的注视点边界算法：

| 单词 | 长度 | 加粗字符数 | 结果 |
|------|------|-----------|------|
| a | 1 | 0 | a |
| cat | 3 | 2 | **ca**t |
| hello | 5 | 3 | **hel**lo |
| programming | 11 | 9 | **programmi**ng |
| comprehensive | 13 | 10 | **comprehensi**ve |

算法通过将单词长度与预定义的边界表进行比对来确定加粗字符数——匹配到的边界值索引等于单词末尾不加粗的字符数。

## 文件结构

```
bionic-read/
├── manifest.json      # Chrome 扩展配置文件（Manifest V3）
├── content.js         # 核心文本转换逻辑
├── background.js      # Service Worker，用于状态管理
├── popup.html         # 扩展弹出窗口 UI
├── popup.js           # 弹出窗口逻辑
└── icons/             # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 开源协议

MIT License — 可自由使用、修改和分发。
