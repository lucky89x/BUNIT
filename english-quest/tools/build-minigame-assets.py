"""Đóng gói ảnh trong assets/minigame/ thành js/data/minigame-assets.js (ảnh nhúng dạng data URI,
để game chạy offline khi mở file index.html).

Chạy lại sau khi thêm/đổi ảnh:  python tools/build-minigame-assets.py
Khóa ảnh = tên file bỏ đuôi, ví dụ candy_blue.png -> EQ.MG_IMG.candy_blue
"""
import base64
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'minigame')
OUT = os.path.join(ROOT, 'js', 'data', 'minigame-assets.js')
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg'}

items = {}
for name in sorted(os.listdir(SRC)):
    base, ext = os.path.splitext(name)
    if ext.lower() in MIME:
        with open(os.path.join(SRC, name), 'rb') as f:
            items[base] = 'data:%s;base64,%s' % (MIME[ext.lower()], base64.b64encode(f.read()).decode())

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* Ảnh cho các trò chơi trên bản đồ (xem assets/minigame/CREDITS.md). '
            'Tự sinh bằng tools/build-minigame-assets.py, không sửa tay. */\n')
    f.write('window.EQ = window.EQ || {};\nEQ.MG_IMG = {\n')
    f.write(',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v)) for k, v in sorted(items.items())))
    f.write('\n};\n')
print('Đã đóng gói', len(items), 'ảnh ->', OUT)
