# AnchorRead 发布前检查清单

每次发版前，逐项勾选，全部通过后才能发布。

---

## 1. 版本号一致性

- [ ] `manifest.json` → `"version"` 已更新
- [ ] `popup.html` → 硬编码的 `<span class="version">` 已同步更新
- [ ] 两个文件的版本号字符串完全一致（如均为 `v1.2.6`）

> ⚠️ 教训：v1.2.6 曾出现 manifest=1.2.6 但 popup 显示 1.2.4 的问题，因为 popup.html 是独立硬编码的。

---

## 2. 代码语法检查

- [ ] `content.js` 语法检查通过：`node -c content.js`
- [ ] `popup.js` 语法检查通过：`node -c popup.js`
- [ ] 无 ESLint 报错（如有配置）

---

## 3. README 与代码同步

- [ ] `README.md` 「How It Works」章节与当前算法一致
- [ ] `README_zh.md` 「算法原理」章节与当前算法一致
- [ ] 如果新增/修改了功能选项（popup 里的 switch/button），README 的「功能」章节已同步更新

> ⚠️ 教训：v1.2.6  optical balance 规则引擎开发完成后，README 未及时更新，导致文档与代码脱节。

---

## 4. 打包验证

- [ ] zip 包已重新生成（不是用旧的）
- [ ] 验证 zip 内的 `manifest.json` 版本号：
  ```bash
  python -c "import zipfile; z=zipfile.ZipFile('anchor-read-v1.2.6.zip'); print(z.read('manifest.json'))"
  ```
- [ ] 验证 zip 内的 `popup.html` 版本号：
  ```bash
  python -c "import zipfile; z=zipfile.ZipFile('anchor-read-v1.2.6.zip'); [print(l) for l in z.read('popup.html').decode().split('\n') if 'version' in l.lower()]"
  ```

---

## 5. Git 提交

- [ ] 所有改动已 commit，commit message 清晰（如 `chore: release v1.2.6`）
- [ ] 已 push 到 `origin main`
- [ ] GitHub 上确认 commit 已出现

---

## 6. GitHub Release

- [ ] repo 名称拼写已核对（**逐字母检查**，不要用自动补全的结果）
  > ⚠️ 教训：`tianzhicheng` vs `tianzhiceng` — 差一个 `h`，GET 能访问但 POST 报 404，排查了 1 小时。
- [ ] Release Tag 与版本号一致（如 `v1.2.6`）
- [ ] Release Notes 已填写，包含：
  - `## What Changed`（新功能 / 修复）
  - 安装说明（Download zip → 解压 → Load unpacked）
- [ ] zip 资产已上传，且是最新版（不是缓存的旧版）
- [ ] 如果更新了资产，确认浏览器下载的不是缓存的旧版（可加 `?v=1.2.6` 参数或让用户强制刷新）

---

## 7. 实机测试（可选但推荐）

- [ ] 在一个英文网页（如 Wikipedia）上测试，确认加粗效果符合预期
- [ ] 开关 toggle 正常工作
- [ ] 如果新增了设置项，确认默认值合理

---

## 发布命令速查

```bash
# 语法检查
node -c content.js && node -c popup.js

# 打包（Python，避免沙箱拦截）
python -c "
import zipfile, os
with zipfile.ZipFile('anchor-read-v1.2.6.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__')]
        for f in files:
            if f.endswith('.zip'): continue
            fp = os.path.join(root, f)
            z.write(fp, os.path.relpath(fp, '.'))
print('Done')
"

# 验证 zip 内版本号
python -c "
import zipfile
z = zipfile.ZipFile('anchor-read-v1.2.6.zip')
for name in ['manifest.json', 'popup.html']:
    content = z.read(name).decode()
    for line in content.split('\n'):
        if 'version' in line.lower() and '1.' in line:
            print(f'{name}: {line.strip()}')
"

# Commit & Push
git add -A && git commit -m "chore: release v1.2.6" && git push origin main
```

---

## 发布后

- [ ] GitHub Release 页面可正常访问
- [ ] Download zip 链接有效
- [ ] 通知用户新版本已发布（如需要）
