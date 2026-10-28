import os
from PIL import Image, ImageDraw

os.makedirs('website/assets/dino', exist_ok=True)

# Classic Chrome T-Rex shape in 32x32 grid
# 0 = empty, 1 = dino body, 2 = eye, 3 = helmet, 4 = jetpack, 5 = thruster/sparks

DINO_PALETTE = {
    'bg': (17, 18, 20, 255),
    'dino': (75, 75, 80, 255),
    'dino_dark': (45, 45, 50, 255),
    'dino_belly': (100, 100, 105, 255),
    'helmet_glass': (180, 230, 255, 140),
    'helmet_ring': (194, 73, 30, 255),
    'jetpack': (220, 215, 205, 255),
    'jetpack_red': (194, 73, 30, 255),
    'flame_blue': (37, 99, 235, 255),
    'flame_cyan': (6, 182, 212, 255),
    'flame_gold': (242, 215, 110, 255),
    'eye_open': (255, 255, 255, 255),
    'eye_pupil': (20, 20, 25, 255),
    'eye_sleep': (6, 182, 212, 255),
    'zzz': (242, 215, 110, 255),
    'keyboard': (30, 32, 40, 255),
    'key_cap': (6, 182, 212, 255),
}

def draw_t_rex_standing(d, x, y, arm_frame=0, mouth_open=False):
    # Head & snout (facing right)
    d.rectangle([(x + 7, y + 2), (x + 18, y + 9)], fill=DINO_PALETTE['dino'])
    d.rectangle([(x + 11, y + 2), (x + 18, y + 6)], fill=DINO_PALETTE['dino']) # top snout
    d.rectangle([(x + 15, y + 7), (x + 18, y + 8)], fill=DINO_PALETTE['dino']) # upper jaw
    if mouth_open:
        d.rectangle([(x + 15, y + 9), (x + 17, y + 9)], fill=(194, 73, 30, 255)) # tongue
        d.rectangle([(x + 14, y + 10), (x + 18, y + 10)], fill=DINO_PALETTE['dino']) # lower jaw
    else:
        d.rectangle([(x + 14, y + 9), (x + 18, y + 9)], fill=DINO_PALETTE['dino']) # jaw
        
    # Eye (classic pixel pixel dino eye)
    d.rectangle([(x + 10, y + 4), (x + 12, y + 5)], fill=DINO_PALETTE['eye_open'])
    d.point([(x + 11, y + 4)], fill=DINO_PALETTE['eye_pupil'])
    
    # Neck & Body
    d.rectangle([(x + 6, y + 8), (x + 13, y + 17)], fill=DINO_PALETTE['dino'])
    d.rectangle([(x + 4, y + 10), (x + 12, y + 18)], fill=DINO_PALETTE['dino'])
    
    # Tail curving left
    d.point([(x + 3, y + 13), (x + 2, y + 12), (x + 1, y + 11), (x + 0, y + 10)], fill=DINO_PALETTE['dino'])
    d.rectangle([(x + 2, y + 13), (x + 4, y + 15)], fill=DINO_PALETTE['dino'])
    
    # Short T-Rex arm
    arm_x = x + 13
    arm_y = y + 12 + (1 if arm_frame == 1 else 0)
    d.line([(arm_x, arm_y), (arm_x + 3, arm_y)], fill=DINO_PALETTE['dino'], width=1)
    d.point([(arm_x + 3, arm_y + 1)], fill=DINO_PALETTE['dino']) # tiny claws
    
    # Legs (floating zero-g tuck)
    d.rectangle([(x + 5, y + 18), (x + 7, y + 21)], fill=DINO_PALETTE['dino'])
    d.point([(x + 7, y + 21), (x + 8, y + 21)], fill=DINO_PALETTE['dino']) # foot 1
    d.rectangle([(x + 9, y + 18), (x + 11, y + 20)], fill=DINO_PALETTE['dino_dark'])
    d.point([(x + 11, y + 20), (x + 12, y + 20)], fill=DINO_PALETTE['dino_dark']) # foot 2

def generate_dino_sleeping():
    size = 32
    scale = 4
    frames = []
    
    # 8 frames of peaceful zero-gravity floating on back
    bobs = [0, 1, 2, 2, 1, 0, -1, -1]
    
    for idx, bob in enumerate(bobs):
        img = Image.new('RGBA', (size, size), DINO_PALETTE['bg'])
        d = ImageDraw.Draw(img)
        
        # Base position (Dino floating horizontally on back/belly)
        bx = 6
        by = 13 + bob
        
        # Glass Helmet around head (left)
        d.rounded_rectangle([(bx + 2, by - 5), (bx + 14, by + 7)], radius=5, fill=(30, 45, 60, 160), outline=DINO_PALETTE['helmet_glass'])
        d.arc([(bx + 3, by - 4), (bx + 8, by + 1)], start=140, end=260, fill=(255, 255, 255, 200), width=1) # shine
        
        # Dino Head (horizontal, resting left)
        d.rectangle([(bx + 4, by - 2), (bx + 12, by + 4)], fill=DINO_PALETTE['dino'])
        d.rectangle([(bx + 4, by - 2), (bx + 9, by + 1)], fill=DINO_PALETTE['dino'])
        
        # Sleeping eye (- -)
        d.line([(bx + 9, by), (bx + 11, by)], fill=DINO_PALETTE['eye_sleep'], width=1)
        
        # Helmet collar ring
        d.rectangle([(bx + 12, by - 4), (bx + 13, by + 5)], fill=DINO_PALETTE['helmet_ring'])
        
        # Horizontal Body
        d.rectangle([(bx + 13, by - 2), (bx + 21, by + 3)], fill=DINO_PALETTE['dino'])
        
        # Jetpack on belly/back with gentle blue pilot light
        d.rectangle([(bx + 14, by + 3), (bx + 18, by + 5)], fill=DINO_PALETTE['jetpack'])
        if idx % 2 == 0:
            d.point([(bx + 19, by + 4)], fill=DINO_PALETTE['flame_cyan']) # tiny zero-g stationkeeping puff
            
        # Tiny T-Rex arms folded over chest (sleeping like a puppy)
        d.rectangle([(bx + 12, by - 1), (bx + 14, by)], fill=DINO_PALETTE['dino_belly'])
        
        # Tail floating lazily right
        tail_bob = 1 if idx in [3, 4, 5] else 0
        d.point([(bx + 22, by - 1), (bx + 23, by), (bx + 24, by + 1 + tail_bob)], fill=DINO_PALETTE['dino'])
        
        # Feet floating up in zero-g
        d.rectangle([(bx + 19, by - 4), (bx + 20, by - 2)], fill=DINO_PALETTE['dino'])
        d.point([(bx + 20, by - 5), (bx + 21, by - 5)], fill=DINO_PALETTE['dino']) # tiny claws up
        
        # Floating Z Z Z drifting into deep space
        z_y = (by - 6 - idx * 2) % 28
        z_x = bx + 8 + ((idx * 3) % 10)
        if z_y < by - 3:
            d.text((z_x, z_y), 'z', fill=DINO_PALETTE['zzz'])
            if idx > 2:
                d.text((z_x - 3, z_y + 4), 'z', fill=(242, 215, 110, 160))
                
        # Scale with crisp nearest-neighbor pixels
        img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
        frames.append(img_scaled)
        
    out = 'website/assets/dino/dino-sleeping.gif'
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=180, loop=0)
    print('Generated Dino Sleeping:', out)

def generate_dino_coding():
    size = 32
    scale = 4
    frames = []
    
    # 6 frames of furious coding in zero-G
    for f in range(6):
        img = Image.new('RGBA', (size, size), DINO_PALETTE['bg'])
        d = ImageDraw.Draw(img)
        
        # Zero-g hover bob
        y_bob = 1 if f in [1, 2, 4] else 0
        bx = 5
        by = 5 + y_bob
        
        # Anti-gravity Jetpack on back (left side of dino)
        d.rectangle([(bx + 2, by + 10), (bx + 5, by + 16)], fill=DINO_PALETTE['jetpack'], outline=DINO_PALETTE['jetpack_red'])
        # Jetpack thruster flame pulsing blue & cyan!
        flame_len = 3 + (f % 3) * 2
        d.polygon([(bx + 2, by + 17), (bx + 5, by + 17), (bx + 3, by + 17 + flame_len)], fill=DINO_PALETTE['flame_blue'])
        d.point([(bx + 3, by + 17 + flame_len - 1), (bx + 4, by + 17 + flame_len - 2)], fill=DINO_PALETTE['flame_cyan'])
        
        # Glass Helmet around dino's head
        d.rounded_rectangle([(bx + 6, by - 1), (bx + 20, by + 11)], radius=5, fill=(30, 45, 60, 140), outline=DINO_PALETTE['helmet_glass'])
        d.arc([(bx + 7, by + 1), (bx + 11, by + 5)], start=140, end=260, fill=(255, 255, 255, 220), width=1) # visor shine
        
        # T-Rex Body & Head
        arm_tick = f % 2
        draw_t_rex_standing(d, bx, by, arm_frame=arm_tick, mouth_open=(f % 3 == 0))
        
        # Floating Holographic Keyboard in front of tiny arms
        kb_x = bx + 17
        kb_y = by + 13
        d.rectangle([(kb_x, kb_y), (kb_x + 9, kb_y + 2)], fill=DINO_PALETTE['keyboard'], outline=DINO_PALETTE['key_cap'])
        # Tapping glow on keys
        tap_key = kb_x + 2 + (f * 2) % 6
        d.point([(tap_key, kb_y)], fill=DINO_PALETTE['flame_gold'])
        
        # Floating Code Screen in front
        d.rectangle([(kb_x + 2, by + 3), (kb_x + 9, by + 11)], fill=(15, 23, 42, 210), outline=DINO_PALETTE['flame_cyan'])
        # Green / cyan code lines
        for li in range(3):
            cw = 2 + ((f + li * 2) % 4)
            d.line([(kb_x + 4, by + 5 + li * 2), (kb_x + 4 + cw, by + 5 + li * 2)], fill=DINO_PALETTE['flame_cyan'])
            
        # Code sparks flying from furious typing
        if f % 2 == 1:
            d.point([(kb_x + 4, by + 1), (kb_x + 8, by + 14)], fill=DINO_PALETTE['flame_gold'])
            
        img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
        frames.append(img_scaled)
        
    out = 'website/assets/dino/dino-coding.gif'
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=140, loop=0)
    print('Generated Dino Coding:', out)

def generate_dino_thinking():
    size = 32
    scale = 4
    frames = []
    
    # Dino floating upside down or scratching chin in zero-G
    for f in range(8):
        img = Image.new('RGBA', (size, size), DINO_PALETTE['bg'])
        d = ImageDraw.Draw(img)
        
        # Floating tilted / hovering
        bx = 7
        by = 7 + (1 if f in [2, 3, 4] else 0)
        
        # Orbiting Gemini 4-pointed stars around snout!
        orbit_angle = (f / 8.0) * 3.14159 * 2
        import math
        star_x = int(bx + 14 + math.cos(orbit_angle) * 8)
        star_y = int(by + 5 + math.sin(orbit_angle) * 5)
        # 4-pointed Gemini spark
        d.point([(star_x, star_y), (star_x - 1, star_y), (star_x + 1, star_y), (star_x, star_y - 1), (star_x, star_y + 1)], fill=DINO_PALETTE['flame_cyan'])
        
        # Helmet
        d.rounded_rectangle([(bx + 6, by - 1), (bx + 20, by + 11)], radius=5, fill=(30, 45, 60, 140), outline=DINO_PALETTE['helmet_glass'])
        
        # T-Rex standing/floating
        draw_t_rex_standing(d, bx, by, arm_frame=0, mouth_open=False)
        
        # Dino scratch chin with tiny arm
        d.line([(bx + 13, by + 12), (bx + 14, by + 8)], fill=DINO_PALETTE['dino'], width=1)
        
        # Thought question mark / dots
        dot_h = (f % 3)
        d.point([(bx + 19, by - 1), (bx + 20, by - 3), (bx + 22, by - 5)], fill=DINO_PALETTE['flame_gold'])
        
        img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
        frames.append(img_scaled)
        
    out = 'website/assets/dino/dino-thinking.gif'
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=180, loop=0)
    print('Generated Dino Thinking:', out)

if __name__ == '__main__':
    generate_dino_sleeping()
    generate_dino_coding()
    generate_dino_thinking()
