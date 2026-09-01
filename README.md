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
tools/              维护脚本
```

## 改内容

站点内容全部来自 `index.html` 末尾的 `<script type="application/json" id="site-data">`：

- `homeCols` 首页图文
- `flow` 首页底部的 Selected Work
- `photoIndex` / `galleries` Fotography 的索引与图组
- `textIndex` / `articles` / `covers` Texts 的索引、正文与封面
- `notes` Notes
- `places` Fotography 侧栏地图的坐标
- `ratios` 需要锁定统一画幅的图组，如 `{"p18": 1.25}` 即横向 4:5

改完直接提交即可，没有构建步骤。

## 加新图组

1. 在 `assets/<年份>/` 下新建一个以作品名命名的文件夹，把照片放进去。
2. 跑一遍压缩（见下）。
3. 在 `site-data` 里补上 `photoIndex` / `galleries` / `places`，id 顺延，不要复用旧号——
   首页 `flow` 是按 id 指过去的，改号会把首页链接打断。

## 图片尺寸

长边上限 2200px，超过就等比缩小并重新编码（JPEG q82 起，必要时降档）：

```
python3 tools/optimize-images.py            # 处理 assets/
python3 tools/optimize-images.py --dry-run  # 只报告，不写入
python3 tools/optimize-images.py assets/2026/某个新项目
```

幂等，重复跑不会继续劣化；只有确实能变小的文件才会被覆盖，绝不会越压越大。
EXIF 方向烘进像素，ICC 色彩配置保留。

## 字号

全站只有一套等比级数（约 1.18），定义在 `:root`，组件里不要再写死 px：

| token | 值 | 用在哪 |
|---|---|---|
| `--fs-micro-xs` | 8px | 罗盘刻度 |
| `--fs-micro` | 9px | 全大写微标签：编号、年份、坐标 |
| `--fs-fine` | 11px | 次级小字 |
| `--fs-sm` | 13px | 界面文字：导航、索引、联系方式 |
| `--fs-base` | 15px | 正文 |
| `--fs-md` | 18px | 品牌名、小标题 |
| `--fs-lg` | 21px | 页面标题 |

## 说明

- 地图是纯 JS 墨卡托投影，国界数据在 `assets/data/world.json`（约 150KB），不依赖 d3 或任何 CDN。
- 字体走 Google Fonts：Newsreader / Noto Serif TC / Overpass。
  Overpass 只用在 `--fs-micro` 那一档的全大写微标签上，其余一律衬线。
