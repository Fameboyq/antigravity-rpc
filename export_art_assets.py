import os
from PIL import Image

out_dir = 'discord_art_assets'
os.makedirs(out_dir, exist_ok=True)

# Copy and scale for Discord Developer Portal (512x512 crisp pixel art)
src_files = {
    'dino_sleeping': 'website/assets/dino/dino-sleeping.gif',
    'dino_coding': 'website/assets/dino/dino-coding.gif',
    'dino_thinking': 'website/assets/dino/dino-thinking.gif'
}

for name, path in src_files.items():
    if os.path.exists(path):
        im = Image.open(path)
        # Save animated gif copy
        im.save(os.path.join(out_dir, f'{name}.gif'), save_all=True)
        
        # Save high-res 512x512 static PNG first frame for Discord Portal
        im.seek(0)
        im_frame = im.convert('RGBA')
        im_512 = im_frame.resize((512, 512), Image.NEAREST)
        im_512.save(os.path.join(out_dir, f'{name}.png'))
        print(f'Exported {name}.png and {name}.gif (512x512)')

