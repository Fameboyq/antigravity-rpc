import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('website/assets', exist_ok=True)

def generate_sleeping_mascot():
    size = 32
    scale = 3
    frames = []
    
    bg = (17, 18, 20, 255)
    cream = (244, 237, 224, 255)
    dark_suit = (45, 37, 32, 255)
    visor = (15, 23, 42, 255)
    cyan = (6, 182, 212, 255)
    rust = (194, 73, 30, 255)
    gold = (242, 215, 110, 255)
    
    # 8 frames of smooth zero-g floating
    bob_offsets = [0, 1, 2, 2, 1, 0, -1, -1]
    
    for idx, y_bob in enumerate(bob_offsets):
        img = Image.new('RGBA', (size, size), bg)
        d = ImageDraw.Draw(img)
        
        base_y = 14 + y_bob
        
        # Zero-G thruster mini particles behind feet
        if idx % 2 == 0:
            d.point([(25, base_y + 1), (26, base_y)], fill=(37, 99, 235, 180))
            
        # Helmet / Head (floating horizontal on left)
        d.rounded_rectangle([(6, base_y - 4), (14, base_y + 4)], radius=3, fill=cream, outline=dark_suit)
        # Visor
        d.rounded_rectangle([(7, base_y - 2), (13, base_y + 2)], radius=2, fill=visor)
        # Sleeping closed eyes (- . -) in cyan
        d.line([(8, base_y), (10, base_y)], fill=cyan, width=1)
        d.line([(11, base_y), (12, base_y)], fill=cyan, width=1)
        
        # Tiny astronaut antenna with Gemini spark
        d.point([(10, base_y - 5)], fill=rust)
        if idx % 4 < 2:
            d.point([(10, base_y - 6)], fill=gold)
            
        # Suit / Torso (horizontal zero-G float)
        d.rounded_rectangle([(14, base_y - 3), (20, base_y + 3)], radius=2, fill=cream)
        d.rectangle([(16, base_y - 1), (18, base_y + 1)], fill=rust) # chest emblem
        
        # Floating legs drifting behind
        leg_wave = 1 if idx in [2, 3, 4] else 0
        d.rectangle([(20, base_y - 2), (24, base_y + leg_wave)], fill=cream)
        d.rectangle([(23, base_y - 3), (25, base_y - 1)], fill=dark_suit) # boot 1
        d.rectangle([(23, base_y + leg_wave), (25, base_y + 2 + leg_wave)], fill=dark_suit) # boot 2
        
        # Floating "Zzz" drifting away upwards
        z_y1 = (base_y - 6 - idx * 2) % 28
        z_x1 = 12 + ((idx * 3) % 8)
        if z_y1 < base_y - 4:
            d.text((z_x1, z_y1), 'z', fill=gold)
            
        img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
        frames.append(img_scaled)
        
    out_path = 'website/assets/antigravity-sleeping.gif'
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=180, loop=0)
    print('Generated:', out_path)

def generate_working_mascot():
    size = 32
    scale = 3
    frames = []
    
    bg = (17, 18, 20, 255)
    cream = (244, 237, 224, 255)
    dark_suit = (45, 37, 32, 255)
    visor = (15, 23, 42, 255)
    cyan = (6, 182, 212, 255)
    rust = (194, 73, 30, 255)
    blue = (37, 99, 235, 255)
    gold = (242, 215, 110, 255)
    
    # Typing / working with floating holographic screens
    for f in range(6):
        img = Image.new('RGBA', (size, size), bg)
        d = ImageDraw.Draw(img)
        
        # Bobbing in zero-g hover
        y_bob = 1 if f in [1, 2] else 0
        base_y = 12 + y_bob
        
        # Floating holographic monitor on right
        d.rectangle([(20, base_y - 5), (28, base_y + 5)], fill=(15, 23, 42, 200), outline=cyan)
        # Code lines scrolling
        for line_i in range(3):
            line_w = 3 + ((f + line_i * 2) % 4)
            d.line([(22, base_y - 3 + line_i * 3), (22 + line_w, base_y - 3 + line_i * 3)], fill=cyan if line_i == 0 else cream)
            
        # Helmet / Head
        d.rounded_rectangle([(8, base_y - 6), (18, base_y + 4)], radius=4, fill=cream, outline=dark_suit)
        d.rounded_rectangle([(10, base_y - 4), (17, base_y + 2)], radius=2, fill=visor)
        # Focused glowing eyes (> < or • •)
        d.point([(13, base_y - 1), (15, base_y - 1)], fill=cyan)
        
        # Gemini spark on helmet
        d.point([(13, base_y - 7)], fill=rust)
        
        # Suit & Thrusters
        d.rounded_rectangle([(9, base_y + 4), (17, base_y + 12)], radius=3, fill=cream)
        d.rectangle([(11, base_y + 6), (15, base_y + 9)], fill=rust)
        
        # Hands typing / welding sparks
        hand_reach = 2 if f % 2 == 0 else 0
        d.rectangle([(16, base_y + 5), (19 + hand_reach, base_y + 7)], fill=cream)
        if f % 2 == 1:
            d.point([(20, base_y + 4), (21, base_y + 8)], fill=gold) # Sparks
            
        # Mini anti-gravity thruster plume underneath
        thrust_h = 3 if f % 2 == 0 else 5
        d.polygon([(11, base_y + 12), (15, base_y + 12), (13, base_y + 12 + thrust_h)], fill=blue)
        d.point([(13, base_y + 12 + thrust_h - 1)], fill=cyan)
        
        img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
        frames.append(img_scaled)
        
    out_path = 'website/assets/antigravity-working.gif'
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=150, loop=0)
    print('Generated:', out_path)

if __name__ == '__main__':
    generate_sleeping_mascot()
    generate_working_mascot()

