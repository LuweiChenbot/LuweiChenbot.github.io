# luweichenbot.github.io

Personal site of Chén Lù-Wēi — photography and written archives.
Served by GitHub Pages from `main`.

## Structure

```
index.html          页面外壳 + 内联站点数据 (<script id="site-data">)
style.css           全部样式，设计变量在 :root
script.js           视图切换 / 索引 / 地图 / 灯箱，无外部依赖
assets/             照片，按年份分目录
assets/covers/      Text Archives 的文章封面
assets/data/        world.json — 自绘地图用的国界数据
```

## 改内容

站点内容全部来自 `index.html` 末尾的 `<script type="application/json" id="site-data">`：

- `homeCols` 首页图文
- `flow` 首页底部的 Selected Work
- `photoIndex` / `galleries` Fotography 的索引与图组
- `textIndex` / `articles` / `covers` Texts 的索引、正文与封面
- `notes` Notes
- `places` Fotography 侧栏地图的坐标

改完直接提交即可，没有构建步骤。

## 说明

- 地图是纯 JS 墨卡托投影，国界数据在 `assets/data/world.json`（约 150KB），不依赖 d3 或任何 CDN。
- 字体走 Google Fonts：Newsreader / Noto Serif TC / Overpass。
- 图片为全分辨率原图。若日后要提速，把长边压到 2200px 即可显著减小体积。
