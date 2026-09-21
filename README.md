# 个人主页

单文件静态站点，零第三方依赖 —— 样式与脚本全部内联，打开即渲染，没有 CDN 阻塞首屏。

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 页面本体：明暗主题、项目与技能展示、问答入口 |
| `worker.js` | 问答接口的转发层，密钥由 Worker 环境变量提供，不进代码 |
| `wrangler.toml` | Worker 部署配置 |

## 部署

静态页面可以放任意位置（GitHub Pages / Cloudflare Pages / 自己的 nginx）；
问答接口单独部署为 Cloudflare Worker：

```bash
wrangler secret put NVIDIA_API_KEY   # 配置密钥，不要写进代码
wrangler deploy
```

首页与 Worker 不在同一域名时，把 `index.html` 里的 `ENDPOINT` 改成 Worker 的完整地址。

## 关于问答接口

- 密钥只存在于 Worker 环境变量，前端不携带任何凭据
- 来源白名单限制可调用域名
- 模型名与输出上限在服务端固定，请求体做类型校验
