import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
except ImportError:
    Groq = None

# We can initialize it lazily or globally if the key is available
client = None
if Groq and os.getenv("GROQ_API_KEY"):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

DEFAULT_MODEL = "openai/gpt-oss-120b"

def generate_crop_plan_reasoning(crop: str, soil_type: str, season: str, confidence: float) -> str:
    """Generate agronomic reasoning for why a crop was selected using Groq."""
    if not client:
        print("DEBUG: Groq client is None!")
        return f"XGBoost crop planner recommends {crop} for {soil_type} soil in {season} season (confidence {confidence:.0%})."
    
    prompt = (
        f"You are an expert agronomist in India. "
        f"Our AI model just recommended growing {crop} during the {season} season on a plot with {soil_type} soil, "
        f"with a confidence score of {confidence:.0%}.\n"
        f"Write exactly 1-2 concise, highly specific sentences explaining WHY this crop is a biologically and economically excellent match for this soil and season. "
        f"Do not mention the AI model or confidence score. Just explain the agronomic reasoning."
    )
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=DEFAULT_MODEL,
            max_tokens=512,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip().replace('"', '')
    except Exception as e:
        print(f"DEBUG Groq API error: {e}")
        return f"XGBoost crop planner recommends {crop} for {soil_type} soil in {season} season (confidence {confidence:.0%})."


def generate_rotation_reasoning(next_crop: str, soil_nitrogen: float, soil_organic_carbon: float, last_3_crops: List[str]) -> str:
    """Generate agronomic reasoning for crop rotation selection using Groq."""
    fallback_msg = f"RL agent selected {next_crop} based on past crops: {', '.join(last_3_crops)}."
    
    if not client:
        return fallback_msg
        
    prompt = (
        f"You are an expert agronomist in India. "
        f"A plot has soil nitrogen levels of {soil_nitrogen:.1f} kg/ha and soil organic carbon of {soil_organic_carbon:.2f}%. "
        f"The last 3 crops grown here were: {', '.join(last_3_crops) if last_3_crops else 'None'}. "
        f"We are recommending {next_crop} as the next crop in the rotation sequence.\n"
        f"Write exactly 1-2 concise, highly specific sentences explaining WHY {next_crop} is the optimal choice right now to improve soil health and break pest cycles. "
        f"Do not introduce yourself or use fluff words."
    )
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=DEFAULT_MODEL,
            max_tokens=512,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip().replace('"', '')
    except Exception as e:
        print(f"Groq API error: {e}")
        return fallback_msg


def generate_rich_varieties(crop: str, soil_type: str, district: str) -> List[dict]:
    """Generate rich, dynamic seed variety recommendations using Groq."""
    if not client:
        print("DEBUG: Groq client is None! Returning empty.")
        return []

    prompt = f"""
You are an expert agronomist in India.
We need to recommend 3 specific, real-world seed varieties for `{crop}` that perform exceptionally well in `{soil_type}` soil in `{district}` district.

Provide the result as a JSON object with a single key "varieties" containing an array of objects. Each object must exactly match this structure:
{{
  "id": "Short variety code (e.g. HD-2967)",
  "name": "Full Marketing Name (e.g. Sharbati Gold)",
  "match": integer score between 75 and 99,
  "types": ["all", "yield", "drought", "early"] (pick 2-3 relevant ones),
  "desc": "1-2 sentence compelling description tailored to this soil and district",
  "days": "e.g. 120-125",
  "yield": "e.g. 21-24",
  "cost": "e.g. ₹1,250",
  "traits": [
    {{ "text": "emoji + short trait (e.g. ⭐ Premium rate)", "color": "bg-primary-container text-on-primary-container" }},
    {{ "text": "emoji + short trait (e.g. 💧 Mod. water)", "color": "bg-surface-container-high text-on-surface-variant" }}
  ]
}}

Return ONLY valid JSON.
    """

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="qwen/qwen3.8-27b",
            max_tokens=1500,
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        
        # Strip codeblock markdown if it exists
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        # Try to parse
        import json
        data = json.loads(content)
        if isinstance(data, dict):
            # Try to find the array
            for k, v in data.items():
                if isinstance(v, list):
                    return v
            return [data] # Fallback
        elif isinstance(data, list):
            return data
            
    except Exception as e:
        print(f"DEBUG Groq API error generating varieties: {e}")
        return []


_timeline_cache: dict = {}

# Indian agricultural calendar: crop → (season_id, season_name, month_start, month_end, total_days, nodeIcon)
_CROP_CALENDAR = {
    "sugarcane":  ("kharif",  "Kharif",  "Jun",  "May",  365, "grass"),
    "rice":       ("kharif",  "Kharif",  "Jun",  "Oct",  130, "grain"),
    "wheat":      ("rabi",    "Rabi",    "Nov",  "Mar",  120, "grain"),
    "cotton":     ("kharif",  "Kharif",  "May",  "Nov",  180, "eco"),
    "maize":      ("kharif",  "Kharif",  "Jun",  "Oct",  110, "grain"),
    "soybean":    ("kharif",  "Kharif",  "Jun",  "Oct",  100, "eco"),
    "groundnut":  ("kharif",  "Kharif",  "Jun",  "Oct",  120, "eco"),
    "chickpea":   ("rabi",    "Rabi",    "Oct",  "Feb",  110, "eco"),
    "moong":      ("zaid",    "Zaid",    "Mar",  "Jun",   65, "wb_sunny"),
    "fallow":     ("kharif",  "Kharif",  "Jun",  "Oct",   90, "eco"),
}
_DEFAULT_CAL = ("kharif", "Kharif", "Jun", "Oct", 120, "grain")


def _get_crop_stage(day: int, total: int) -> str:
    pct = day / total if total else 0
    if pct < 0.15: return "Germination"
    if pct < 0.35: return "Vegetative stage"
    if pct < 0.55: return "Tillering / Branching"
    if pct < 0.75: return "Flowering stage"
    if pct < 0.90: return "Grain filling / Maturation"
    return "Pre-harvest"


def _get_task(crop: str, stage: str) -> str:
    tasks = {
        "Germination":             f"Monitor {crop} emergence and gap-fill bare patches.",
        "Vegetative stage":        f"Apply first nitrogen split dose. Scout for early pests in {crop}.",
        "Tillering / Branching":   f"Irrigation critical at this stage. Check {crop} for weed pressure.",
        "Flowering stage":         f"Avoid any water stress. Do NOT spray pesticides during {crop} flowering.",
        "Grain filling / Maturation": f"Stop irrigation 2 weeks before harvest. Monitor {crop} for grain borer.",
        "Pre-harvest":             f"Plan harvest logistics and market linkage for {crop}.",
    }
    return tasks.get(stage, f"Monitor {crop} field and follow recommended package of practices.")


def _make_season_card(status: str, crop: str, season_name: str, year_range: str,
                      note: str, cal: tuple, day: int = None, metrics=None,
                      profit: str = None, variety: str = None) -> dict:
    season_id, _, start_m, end_m, total_days, icon = cal
    status_styles = {
        "completed": ("bg-surface-container-high", "text-on-surface-variant",
                      "bg-surface-container-high text-on-surface-variant", "bg-surface-container"),
        "active":    ("bg-primary-fixed", "text-primary",
                      "bg-primary-container text-on-primary-container",
                      "bg-surface-container-lowest shadow-md border border-primary-fixed/30"),
        "upcoming":  ("bg-secondary/10", "text-secondary",
                      "bg-secondary-container/20 text-secondary", "bg-surface-container-lowest shadow-sm"),
        "future":    ("bg-surface-container-highest", "text-on-surface-variant",
                      "bg-surface-container-high text-on-surface-variant", "bg-surface-container shadow-sm"),
    }
    status_labels = {
        "completed": "Completed ✓",
        "active":    "● Active Season",
        "upcoming":  "Upcoming · Planning Open",
        "future":    "Future Season",
    }
    sb, sc, nc, cb = status_styles[status]

    card: dict = {
        "id": f"{season_id}_{status}",
        "status": status,
        "statusLabel": status_labels[status],
        "statusBg": sb, "statusColor": sc,
        "dateRange": year_range,
        "nodeColor": nc, "cardBg": cb,
        "crop": crop,
        "cropImg": None,
        "cropNote": note,
        "cropVariety": variety,
        "nodeIcon": icon,
        "day": None, "totalDays": None, "progressPct": None,
        "stage": None, "sowDate": None, "harvestDate": None,
        "taskLabel": None, "profit": None, "metrics": None,
    }

    if status == "active" and day is not None:
        stage = _get_crop_stage(day, total_days)
        card.update({
            "day": day,
            "totalDays": total_days,
            "progressPct": round(day / total_days * 100, 1),
            "stage": stage,
            "sowDate": f"15 {start_m}",
            "harvestDate": f"15 {end_m}",
            "taskLabel": _get_task(crop, stage),
        })

    if status == "completed" and metrics:
        card["metrics"] = metrics

    if status == "upcoming" and profit:
        card["profit"] = profit

    return card


def generate_rich_timeline(
    crop: str,
    soil_type: str,
    district: str,
    next_crop: str,
    last_3_crops: List[str],
) -> List[dict]:
    """Build a rich 4-season crop rotation timeline from farm data (no LLM, instant & reliable)."""
    from datetime import datetime

    cache_key = f"{district}:{soil_type}:{next_crop}:{','.join(last_3_crops)}"
    if cache_key in _timeline_cache:
        return _timeline_cache[cache_key]

    yr = datetime.now().year
    prev_crop = last_3_crops[0] if last_3_crops else "rice"
    curr_crop = last_3_crops[-1] if last_3_crops else crop

    prev_cal  = _CROP_CALENDAR.get(prev_crop.lower(),  _DEFAULT_CAL)
    curr_cal  = _CROP_CALENDAR.get(curr_crop.lower(),  _DEFAULT_CAL)
    next_cal  = _CROP_CALENDAR.get(next_crop.lower(),  _DEFAULT_CAL)

    # Estimate where the farmer is in the current crop cycle
    curr_day = 55  # Default mid-season
    curr_total = curr_cal[4]

    # Build 4 cards
    timeline = [
        _make_season_card(
            "completed", prev_crop.capitalize(),
            f"{prev_cal[1]} {yr - 1}",
            f"{prev_cal[2]} – {prev_cal[3]} {yr - 1}",
            f"Previous season with {prev_crop}. Field prepared for current season.",
            prev_cal,
            metrics=[
                {"label": "Yield Achieved", "value": f"~{curr_cal[4] // 6} q/acre", "color": "text-primary"},
                {"label": "Soil Organic Carbon", "value": f"{0.8:.1f}%", "color": "text-on-surface"},
            ]
        ),
        _make_season_card(
            "active", curr_crop.capitalize(),
            f"{curr_cal[1]} {yr} (Active)",
            f"{curr_cal[2]} – {curr_cal[3]} {yr}",
            f"Currently growing {curr_crop} on {soil_type} soil in {district}.",
            curr_cal,
            day=curr_day,
            variety=f"Recommended variety for {district}",
        ),
        _make_season_card(
            "upcoming", next_crop.capitalize(),
            f"{next_cal[1]} {yr} / {yr + 1} (Planned)",
            f"{next_cal[2]} – {next_cal[3]} {yr + 1}",
            f"AI rotation model recommends {next_crop} to improve soil health and break pest cycles.",
            next_cal,
            profit="+₹85,000 / Acre",
            variety=f"AI-recommended variety for {next_crop} in {district}",
        ),
        _make_season_card(
            "future", "Rotation TBD",
            f"Future Season {yr + 1}",
            f"Jun – Nov {yr + 1}",
            "Season plan will be auto-generated based on soil test results after harvest.",
            _CROP_CALENDAR.get("fallow", _DEFAULT_CAL),
        ),
    ]

    _timeline_cache[cache_key] = timeline
    print(f"DEBUG: Generated deterministic timeline for {district}/{curr_crop} → {next_crop}")
    return timeline
