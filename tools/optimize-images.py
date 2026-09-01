#!/usr/bin/env python3
"""把 assets/ 下的照片压到网页尺寸。

规则：长边超过 MAX_EDGE 就等比缩放，然后按 QUALITY 重新编码。
超过上限的一定会被改写；本来就在上限内的，只有省下 MIN_GAIN 以上才值得覆盖。
两种情况下重复运行都不会继续劣化，所以是幂等的。

    python3 tools/optimize-images.py            # 处理 assets/
    python3 tools/optimize-images.py --dry-run  # 只报告，不写入
    python3 tools/optimize-images.py assets/2026/某个新项目
"""
import argparse
import io
import os
import sys

from PIL import Image, ImageOps

MAX_EDGE = 2200          # 长边上限，README 里建议的数值
QUALITY = 82             # JPEG 质量
MIN_GAIN = 0.05          # 至少省下 5% 才值得覆盖
EXTS = ('.jpg', '.jpeg', '.png')


def optimize(path, dry_run=False):
    """返回 (原大小, 新大小)。没改动则两者相等。"""
    before = os.path.getsize(path)
    with Image.open(path) as src:
        im = ImageOps.exif_transpose(src)        # 把方向标记烘进像素
        icc = src.info.get('icc_profile')        # 保留色彩配置

        w, h = im.size
        oversize = max(w, h) > MAX_EDGE
        if oversize:
            s = MAX_EDGE / max(w, h)
            im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)

        buf = io.BytesIO()
        if path.lower().endswith('.png'):
            im.save(buf, 'PNG', optimize=True, icc_profile=icc)
        else:
            # 有的原图本来就压得比 QUALITY 更狠，缩小后按 QUALITY 重编码反而会更大。
            # 逐档降质，保证输出永远不会比原文件还胖。
            rgb = im.convert('RGB')
            for q in (QUALITY, 76, 70, 64):
                buf = io.BytesIO()
                rgb.save(buf, 'JPEG', quality=q, optimize=True,
                         progressive=True, icc_profile=icc)
                if buf.tell() <= before:
                    break

    after = buf.tell()
    # 尺寸上限是硬规则，超了一定要落盘；只有单纯重新编码时才看收益划不划算
    if not oversize and after > before * (1 - MIN_GAIN):
        return before, before                    # 收益太小，保持原样
    if not dry_run:
        with open(path, 'wb') as f:
            f.write(buf.getvalue())
    return before, after


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('root', nargs='?', default='assets')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    if not os.path.isdir(args.root):
        sys.exit(f'not a directory: {args.root}')

    total_before = total_after = 0
    changed = []
    for dirpath, _, filenames in os.walk(args.root):
        for fn in sorted(filenames):
            if not fn.lower().endswith(EXTS):
                continue
            path = os.path.join(dirpath, fn)
            before, after = optimize(path, args.dry_run)
            total_before += before
            total_after += after
            if after < before:
                changed.append((before, after, path))

    for before, after, path in changed:
        print(f'{before/1e6:7.2f} -> {after/1e6:6.2f} MB  {path}')

    verb = 'would shrink' if args.dry_run else 'shrank'
    saved = total_before - total_after
    pct = (100 * saved / total_before) if total_before else 0
    print(f'\n{verb} {len(changed)} file(s): '
          f'{total_before/1e6:.1f} -> {total_after/1e6:.1f} MB ({pct:.0f}% smaller)')


if __name__ == '__main__':
    main()
