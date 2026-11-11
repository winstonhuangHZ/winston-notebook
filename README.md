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

图片可以通过 GitHub 网站上传或编辑，也可以拖入 Discussion 编辑器使用 GitHub 提供的附件链接。仓库图片需要提交一次文件更改；使用图床或 Discussion 附件写文章时，不需要手动推送。外部图片能否加载取决于图床是否公开、是否允许外链。

支持普通 Markdown、表格、代码高亮、任务列表，以及 `$...$` 和 `$$...$$` 数学公式。

## 查看部署

[Actions 构建记录](https://github.com/winstonhuangHZ/winston-notebook/actions) 中可查看部署是否成功；若构建失败，可打开对应工作流查看错误。也可以在 Actions 中手动运行 `Build and deploy blog` 工作流重新生成。

## 本地开发

需要 Node.js 24、npm 和已登录的 GitHub CLI。首次运行 `npm ci`；`npm run dev` 会同步 Discussions 并启动本地预览，`npm run build` 会同步后生成静态网站。CI 使用 GitHub Actions 自带的只读令牌访问 Discussions，不需要额外配置 Supabase 或令牌。

仓库里也可以直接在 `src/content/blog/` 新建 `.md` 文件。文件需要 `title` 和 `pubDate` 前置信息；提交后会在下一次构建时发布。同步生成的文件存放于被 Git 忽略的 `src/content/blog/generated/`，请不要直接编辑它们。

网站名称、简介等位于 `src/lib/site.ts`；部署域名与 GitHub Pages 子路径位于 `astro.config.mjs`。如果更改仓库名称或配置自定义域名，记得同步检查这些配置、图片路径插件和 `public/robots.txt`。
