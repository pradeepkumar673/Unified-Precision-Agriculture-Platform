import sys
sys.path.append(".")
from app.core.db import SessionLocal
from app.api.v1.community import get_active_fpo

db = SessionLocal()
try:
    res = get_active_fpo(db)
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
