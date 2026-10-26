# airweave · Share your experience

面向门店扫码访客的中英日三语分享网站。

**打开网站：[Share your airweave experience](https://airweave-share.scarlettmind666.workers.dev)**

**银座三越门店入口：[Ginza Mitsukoshi](https://airweave-share.scarlettmind666.workers.dev/?store=ginza-mitsukoshi)**

## 访客流程

1. 选择中文、English 或日本語。
2. 选择小红书、大众点评、Instagram、TikTok 或 X。
3. 每次选择语言、选择平台或点击复制都会重新尝试复制；页面恢复时也会重试。复制成功后显示大字号粘贴提示，失败时提供手动复制。
4. 选择本机照片或拍摄，通过系统分享菜单选择目标 App；照片仅保存在本页内存中。

中文标签：`#爱维福 #airweave #日本旅行 #快眠御守`  
英文标签：`#airweave #SleepWell #JapanTravel #airweaveOmamori`  
日语标签：`#エアウィーヴ #airweave #快眠 #快眠御守`

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

当前线上版本部署在 Cloudflare Workers（Worker：`airweave-share`，D1：`airweave-share-db`）。在 Mac 终端运行 `./deploy-cloudflare.sh` 可重新构建并部署。旧的 chatgpt.site 版本已停止更新。

当前线上版本由 Sites 托管，使用 Vinext / React 和 Cloudflare Workers / D1。GitHub 仓库用于代码分享；推送到 GitHub 不会自动更新当前网站。GitHub Pages 只支持静态内容，不能直接运行本项目的统计接口和后台。

`.openai/hosting.json` 中的项目标识属于当前网站。复制项目用于另一个网站时，应注册自己的托管项目和数据库，并设置自己的 `ADMIN_KEY`。

Logo 为用户提供的 airweave 品牌素材；品牌素材的使用需取得相应授权。

## 浏览器和平台限制

- 自动复制需要 HTTPS，部分浏览器需要当次点击或权限。复制状态不持久保存为永久成功；被拒绝时需点击复制或手动选取。不能保证网页在无用户动作时写入所有浏览器的剪贴板。
- X 使用带标签的发帖 intent；可能先要求登录。Instagram 和小红书的普通链接不能保证进入编辑器，TikTok 后备入口为 TikTok Studio。
- 通过 Web Share API 分享本机照片，不上传照片到本网站。系统决定可用 App，网页不能指定接收 App，也不能确认最终发布。
- 相册需用户自己选图。拍照按钮使用 `capture="environment"` 提示移动浏览器使用后置摄像头，桌面及部分内置浏览器可能仍显示文件选择器。
- 小红书 JS SDK 需要审核凭据，且不再支持自动填入标题、文案和话题；本项目未伪造或接入这些凭据。TikTok 直接投稿也需要审核和用户授权。未集成这些平台的账号投稿接口。
- 照片限制为 9 张、单张 20 MB、合计 60 MB；HEIC/HEIF 的预览和转交能力取决于浏览器及目标 App。

参考：[Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)、[Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)、[小红书 JS SDK](https://agora.xiaohongshu.com/doc/js)、[TikTok 投稿接口](https://developers.tiktok.com/docs/en/content-posting-api-get-started)。

## 回归检查

```sh
node --experimental-strip-types --test tests/share.test.mjs
npx tsc --noEmit
npm run build
```

测试覆盖重复写剪贴板、权限拒绝与降级、语言与平台组合校验、门店参数和图片限制。单元测试模拟浏览器接口；手机相册、相机和目标 App 的原生流程仍须实机验收。
