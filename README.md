# airweave · Share your experience

面向门店扫码访客的中英双语分享网站。

**打开网站：[Share your airweave experience](https://airweave-share-experience.scarlettmind666.chatgpt.site)**

**银座三越门店入口：[Ginza Mitsukoshi](https://airweave-share-experience.scarlettmind666.chatgpt.site/?store=ginza-mitsukoshi)**

## 访客流程

1. 选择中文或 English。
2. 选择小红书、大众点评、Instagram、TikTok 或 X。
3. 点击平台后复制对应标签，再打开平台、粘贴并自行发布。
4. 向店员出示帖子，领取 Sleep Omamori。

中文标签：`#爱维福 #airweave #日本旅行`  
英文标签：`#airweave #SleepWell #JapanTravel`

小红书引导分享日本好物和睡眠御守；大众点评引导实际到访门店的购物体验与真实评价。大众点评目前打开平台首页，需要访客搜索实际门店，尚未配置门店直达链接。浏览器限制剪贴板时，可手动复制页面上的标签。

## 门店统计

二维码网址通过 `?store=ginza-mitsukoshi` 携带门店标识。门店标识支持英文字母、数字、下划线和连字符，最长 80 个字符；未提供时归为 `unassigned`。

后台 `/admin` 使用服务端 `ADMIN_KEY` 保护，统计数据保存在 Cloudflare D1。统计内容为语言选择和平台点击次数，不代表独立访客、国籍或成功投稿。后台访问码、运行时密钥与实际统计数据不包含在本仓库中。

## 本地开发

需要 Node.js 22.13 或以上版本。

```sh
npm ci
npm run dev
```

在本地 `.env` 中设置 `ADMIN_KEY`。首次使用本地统计数据库，需要先构建并应用迁移：

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_whiplash.sql
```

仅对尚未应用此迁移的本地数据库执行以上迁移命令。

## 托管

当前线上版本由 Sites 托管，使用 Vinext / React 和 Cloudflare Workers / D1。GitHub 仓库用于代码分享；推送到 GitHub 不会自动更新当前网站。GitHub Pages 只支持静态内容，不能直接运行本项目的统计接口和后台。

`.openai/hosting.json` 中的项目标识属于当前网站。复制项目用于另一个网站时，应注册自己的托管项目和数据库，并设置自己的 `ADMIN_KEY`。

Logo 为用户提供的 airweave 品牌素材；品牌素材的使用需取得相应授权。
