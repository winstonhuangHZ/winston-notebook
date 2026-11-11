# Winston’s Notebook

一个基于 Astro 和 GitHub Pages 的个人博客。文章主要通过 GitHub Discussions 发布，无需在本地执行 Git 命令。

## 写文章：推荐方式

1. 打开 [Discussions](https://github.com/winstonhuangHZ/winston-notebook/discussions/new?category=announcements)，选择 **Announcements**。
2. 在标题栏输入文章标题，在正文使用 Markdown 写文章。
3. 点击 **Start discussion**。GitHub Actions 会自动构建并部署，通常几分钟内更新。编辑或删除自己的讨论也会触发更新。
4. 文章页面上的「参与讨论」链接会回到原讨论，读者可以在 GitHub 回复。

只有仓库所有者在 Announcements 分类创建的讨论会被作为文章。其他人的讨论不会自动发布到博客。公开仓库里的 Discussions 和其正文也是**公开的**：不要在其中保存私人草稿或秘密。请先在本地写好私人草稿，需要公开时再发布。

可选地在正文最开头添加元信息（冒号后留一个空格）：

```yaml
---
description: "这里是文章摘要。"
tags: [随笔, 阅读]
cover: "https://example.com/cover.jpg"
coverAlt: "封面图片描述"
---

从这里开始写正文……
```

全部字段都可以省略：摘要会从正文自动提取；不设置封面时使用默认插画。`tags` 可用来筛选文章。如果写 `draft: true`，博客会忽略该讨论，但讨论本身依然公开。修改为 `draft: false` 或移除这一行后会自动发布。

### 插入图片

外部图床链接：

```markdown
![图片说明](https://example.com/photo.jpg)
```

也可将图片上传到仓库的 `public/images/posts/`，然后在文章里引用：

```markdown
![图片说明](/images/posts/photo.jpg)
```

图片可以通过 GitHub 网站上传或编辑，也可以拖入 Discussion 编辑器使用 GitHub 提供的附件链接。仓库图片需要提交一次文件更改；使用图床或 Discussion 附件写文章时，不需要手动推送。外部图片能否加载取决于图床是否公开、是否允许外链。 使用 `/images/...` 路径时，GitHub Discussion 的预览可能无法显示图片，但博客构建后会正确显示；如果希望两边都能预览，可以使用公开图片的完整 HTTPS 地址。

### PDF 预览和文件附件

在 Discussion 正文中把 PDF 链接单独放一行，博客会生成在线预览和「打开」按钮：

```markdown
[我的 PDF](/files/example-note.pdf)

[网络上的 PDF](https://example.com/notes.pdf)
```

仓库文件放在 `public/files/`：可以在 GitHub 仓库网页通过 **Add file → Upload files** 上传并提交，也可以在电脑上添加后推送。链接中只写 `/files/文件名.pdf`，博客会自动补上 GitHub Pages 子路径。

写 Discussion 时也可以将 PDF、Office 文档、压缩包等拖入编辑框，GitHub 会插入附件链接；把 PDF 链接单独放一行即可。构建时会自动把 GitHub Discussion 的 PDF 附件同步到博客的公开资源中，供预览使用，无需手动推送；其他附件保留 GitHub 原链接。PDF 附件在 GitHub 的大小上限为 25 MB。上传到公开仓库的文件也是公开的。

如果 PDF 地址不以 `.pdf` 结尾，用 `[PDF: 名称](https://example.com/文件地址)` 指定预览；其他附件可以写 `[附件: 名称](https://example.com/文件地址)`。常见文件类型如 `.zip`、`.docx`、`.pptx` 的独立链接会自动显示为附件卡片。行内链接仍是普通链接。

预览支持翻页和缩放。网络 PDF 必须公开、允许跨域读取（CORS）；有的网站禁止嵌入或强制下载，可能导致预览不可用，文章仍提供「打开」按钮。GitHub 附件同步失败时也会保留原链接。`public/files/_discussion/` 是自动生成的目录，不要手动存放文件。

支持普通 Markdown、表格、代码高亮、任务列表，以及 `$...$` 和 `$$...$$` 数学公式。

## 查看部署

[Actions 构建记录](https://github.com/winstonhuangHZ/winston-notebook/actions) 中可查看部署是否成功；若构建失败，可打开对应工作流查看错误。也可以在 Actions 中手动运行 `Build and deploy blog` 工作流重新生成。

## 本地开发

需要 Node.js 24、npm 和已登录的 GitHub CLI。首次运行 `npm ci`；`npm run dev` 会同步 Discussions 并启动本地预览，`npm run build` 会同步后生成静态网站。CI 使用 GitHub Actions 自带的只读令牌访问 Discussions，不需要额外配置 Supabase 或令牌。

仓库里也可以直接在 `src/content/blog/` 新建 `.md` 文件。文件需要 `title` 和 `pubDate` 前置信息；提交后会在下一次构建时发布。同步生成的文件存放于被 Git 忽略的 `src/content/blog/generated/`，请不要直接编辑它们。

网站名称、简介等位于 `src/lib/site.ts`；部署域名与 GitHub Pages 子路径位于 `astro.config.mjs`。如果更改仓库名称或配置自定义域名，记得同步检查这些配置、图片路径插件和 `public/robots.txt`。

PDF 页面预览使用 [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)，采用 Apache-2.0 许可；构建时会同时复制其许可文件。
