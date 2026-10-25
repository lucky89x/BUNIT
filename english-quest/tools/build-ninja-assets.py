"""Đóng gói ảnh trong assets/ninja/ thành js/data/ninja-assets.js (ảnh nhúng dạng data URI).

Chạy lại sau khi thêm/đổi ảnh:  python tools/build-ninja-assets.py
Khóa ảnh: chars/X.png -> "char:X", faces/X.png -> "face:X", monsters/X.png -> "mon:X",
          bosses/X.png -> "boss:X", tiles/X.png -> "tile:X".
"""
import base64
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'ninja')
OUT = os.path.join(ROOT, 'js', 'data', 'ninja-assets.js')
PREFIX = {'chars': 'char', 'faces': 'face', 'monsters': 'mon', 'bosses': 'boss', 'tiles': 'tile'}

items = {}
for folder, prefix in PREFIX.items():
    d = os.path.join(SRC, folder)
    if not os.path.isdir(d):
        continue
    for name in sorted(os.listdir(d)):
        if name.lower().endswith('.png'):
            with open(os.path.join(d, name), 'rb') as f:
                items[prefix + ':' + name[:-4]] = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* Ảnh từ bộ "Ninja Adventure" (Pixel-boy & AAA, giấy phép CC0 – dùng tự do). '
            'Tự sinh bằng tools/build-ninja-assets.py, không sửa tay. */\n')
    f.write('window.EQ = window.EQ || {};\nEQ.NINJA_IMG = {\n')
    f.write(',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v)) for k, v in sorted(items.items())))
    f.write('\n};\n')
print('Đã đóng gói', len(items), 'ảnh ->', OUT)
