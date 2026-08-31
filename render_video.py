import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
import math

# Output specs
WIDTH, HEIGHT = 1920, 1080
FPS = 30
DURATION_PER_SCENE = 7  # seconds
TRANSITION_FRAMES = 30  # 1 second cross-dissolve

scenes_data = [
    {
        "img_path": r"C:\Users\enero\.gemini\antigravity\brain\f97b7984-4585-419a-88c9-e03855604772\video_scene1_intro_1787325394198.jpg",
        "title": "QUINIELA MASTER PRO AI",
        "subtitle": "Inteligencia Artificial Predictiva de Sorteos",
        "badge": "74.2% EFECTIVIDAD COMPROBADA",
        "tag": "RED NEURONAL CUÁNTICA & MARKOV",
        "zoom_in": True
    },
    {
        "img_path": r"C:\Users\enero\.gemini\antigravity\brain\f97b7984-4585-419a-88c9-e03855604772\video_scene2_radar_1787325406774.jpg",
        "title": "RADAR TÉRMICO DE PROBABILIDADES",
        "subtitle": "Escáner Integral de Números del 00 al 99",
        "badge": "89.3% PRECISIÓN DEL RADAR",
        "tag": "DETECTOR DE NÚMEROS CALIENTES & ATRASOS CRÍTICOS",
        "zoom_in": False
    },
    {
        "img_path": r"C:\Users\enero\.gemini\antigravity\brain\f97b7984-4585-419a-88c9-e03855604772\video_scene3_dreams_1787325420197.jpg",
        "title": "ORÁCULO DE SUEÑOS CON IA",
        "subtitle": "Decodificador Psicológico y Onírico en Lenguaje Natural",
        "badge": "AMBO + TERNO + CUATERNO + REDOBLONA",
        "tag": "TRANSMUTA TUS SUEÑOS EN NÚMEROS GANADORES",
        "zoom_in": True
    },
    {
        "img_path": r"C:\Users\enero\.gemini\antigravity\brain\f97b7984-4585-419a-88c9-e03855604772\video_scene4_strategy_1787325432570.jpg",
        "title": "PLAN DE APUESTAS & AUDITOR OFICIAL",
        "subtitle": "Calculadora Inteligente de Cobertura y Protección de Capital",
        "badge": "DISPONIBLE EN GOOGLE PLAY",
        "tag": "¡DESCARGA HOY Y OBTÉN 15 DÍAS VIP GRATIS!",
        "zoom_in": False
    }
]

# Load default font
try:
    font_title = ImageFont.truetype("arialbd.ttf", 52)
    font_sub = ImageFont.truetype("arial.ttf", 32)
    font_badge = ImageFont.truetype("arialbd.ttf", 26)
    font_tag = ImageFont.truetype("arialbd.ttf", 22)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()
    font_tag = ImageFont.load_default()

def draw_overlay(pil_img, scene, progress):
    draw = ImageDraw.Draw(pil_img, 'RGBA')
    
    # Top Logo Banner
    top_bar_h = 100
    draw.rectangle([(0, 0), (WIDTH, top_bar_h)], fill=(11, 15, 25, 210))
    draw.line([(0, top_bar_h), (WIDTH, top_bar_h)], fill=(245, 158, 11, 180), width=3)
    
    # Top Logo text
    draw.text((60, 25), "QUINIELA MASTER PRO", fill=(255, 255, 255), font=font_title)
    
    # Top Right VIP Badge
    badge_w, badge_h = 360, 48
    bx, by = WIDTH - badge_w - 60, 26
    draw.rounded_rectangle([(bx, by), (bx + badge_w, by + badge_h)], radius=12, fill=(245, 158, 11, 230))
    draw.text((bx + 20, by + 10), "★ 15 DÍAS VIP GRATIS ★", fill=(11, 15, 25), font=font_badge)

    # Bottom Lower Third Overlay (Cinematic Glass Card)
    card_w, card_h = WIDTH - 120, 210
    cx, cy = 60, HEIGHT - card_h - 60
    
    # Semi-transparent dark card
    draw.rounded_rectangle([(cx, cy), (cx + card_w, cy + card_h)], radius=24, fill=(11, 15, 25, 225), outline=(245, 158, 11, 200), width=3)
    
    # Glowing Tag Pill
    tag_w = len(scene["tag"]) * 14 + 30
    draw.rounded_rectangle([(cx + 35, cy + 25), (cx + 35 + tag_w, cy + 62)], radius=10, fill=(16, 185, 129, 200))
    draw.text((cx + 50, cy + 32), scene["tag"], fill=(255, 255, 255), font=font_tag)
    
    # Scene Title
    draw.text((cx + 35, cy + 78), scene["title"], fill=(255, 215, 0), font=font_title)
    
    # Scene Subtitle
    draw.text((cx + 35, cy + 148), scene["subtitle"], fill=(226, 232, 240), font=font_sub)

    # Metric Badge on Right side of bottom card
    metric_text = scene["badge"]
    mb_w = len(metric_text) * 16 + 40
    mb_x = cx + card_w - mb_w - 35
    mb_y = cy + 70
    draw.rounded_rectangle([(mb_x, mb_y), (mb_x + mb_w, mb_y + 60)], radius=16, fill=(245, 158, 11, 40), outline=(245, 158, 11, 240), width=2)
    draw.text((mb_x + 20, mb_y + 14), metric_text, fill=(251, 191, 36), font=font_badge)

    return pil_img

def generate_scene_frames(scene):
    src_img = Image.open(scene["img_path"]).convert("RGB")
    total_frames = FPS * DURATION_PER_SCENE
    frames = []
    
    orig_w, orig_h = src_img.size
    
    for f in range(total_frames):
        t = f / float(total_frames)
        
        # Ken Burns zoom calculation
        if scene["zoom_in"]:
            scale = 1.0 + 0.12 * t
        else:
            scale = 1.12 - 0.12 * t
            
        crop_w = int(orig_w / scale)
        crop_h = int(orig_h / scale)
        
        # Center crop
        left = (orig_w - crop_w) // 2
        top = (orig_h - crop_h) // 2
        cropped = src_img.crop((left, top, left + crop_w, top + crop_h))
        resized = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)
        
        # Overlay UI
        with_overlay = draw_overlay(resized, scene, t)
        
        # Convert to OpenCV frame (BGR)
        np_frame = np.array(with_overlay)
        bgr_frame = cv2.cvtColor(np_frame, cv2.COLOR_RGB2BGR)
        frames.append(bgr_frame)
        
    return frames

print("Rendering video frames...")
all_scene_frames = []
for i, scene in enumerate(scenes_data):
    print(f"Generating Scene {i+1} of {len(scenes_data)}...")
    all_scene_frames.append(generate_scene_frames(scene))

# Assemble video with cross-dissolve transitions
final_frames = []
for i in range(len(all_scene_frames)):
    curr_frames = all_scene_frames[i]
    if i == 0:
        final_frames.extend(curr_frames[:-TRANSITION_FRAMES])
    else:
        # Cross dissolve between prev and curr
        prev_frames = all_scene_frames[i-1]
        for tf in range(TRANSITION_FRAMES):
            alpha = tf / float(TRANSITION_FRAMES)
            blended = cv2.addWeighted(prev_frames[-TRANSITION_FRAMES + tf], 1.0 - alpha, curr_frames[tf], alpha, 0)
            final_frames.append(blended)
            
        if i < len(all_scene_frames) - 1:
            final_frames.extend(curr_frames[TRANSITION_FRAMES:-TRANSITION_FRAMES])
        else:
            final_frames.extend(curr_frames[TRANSITION_FRAMES:])

# Outro screen (3 seconds)
outro_bg = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
outro_bg[:] = (25, 15, 11)  # dark slate BGR
outro_pil = Image.fromarray(cv2.cvtColor(outro_bg, cv2.COLOR_BGR2RGB))
draw_o = ImageDraw.Draw(outro_pil)
draw_o.text((WIDTH//2 - 350, HEIGHT//2 - 140), "QUINIELA MASTER PRO AI", fill=(255, 215, 0), font=font_title)
draw_o.text((WIDTH//2 - 300, HEIGHT//2 - 50), "La Ciencia Detrás de tus Premios", fill=(255, 255, 255), font=font_sub)
draw_o.rounded_rectangle([(WIDTH//2 - 280, HEIGHT//2 + 30), (WIDTH//2 + 280, HEIGHT//2 + 100)], radius=20, fill=(16, 185, 129))
draw_o.text((WIDTH//2 - 240, HEIGHT//2 + 48), "DESCARGA EN GOOGLE PLAY", fill=(255, 255, 255), font=font_badge)
draw_o.text((WIDTH//2 - 180, HEIGHT//2 + 130), "Desarrollado por ING JH", fill=(148, 163, 184), font=font_tag)

outro_bgr = cv2.cvtColor(np.array(outro_pil), cv2.COLOR_RGB2BGR)

# Transition to outro
last_scene_frame = final_frames[-1]
for tf in range(TRANSITION_FRAMES):
    alpha = tf / float(TRANSITION_FRAMES)
    blended = cv2.addWeighted(last_scene_frame, 1.0 - alpha, outro_bgr, alpha, 0)
    final_frames.append(blended)

# Hold outro for 3 seconds (90 frames)
for _ in range(FPS * 3):
    final_frames.append(outro_bgr)

out_paths = [
    r"C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app\play_store_package\video_promocional_quinela.mp4",
    r"C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app\video_promocional_quinela.mp4"
]

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(out_paths[0], fourcc, FPS, (WIDTH, HEIGHT))

print(f"Encoding final MP4 video ({len(final_frames)} frames @ 30 FPS)...")
for f in final_frames:
    writer.write(f)

writer.release()

# Copy to root
import shutil
shutil.copyfile(out_paths[0], out_paths[1])

print(f"Video MP4 created successfully! Total duration: {len(final_frames)/FPS:.1f} seconds")
