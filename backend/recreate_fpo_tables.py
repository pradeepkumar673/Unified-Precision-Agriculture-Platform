import sys
sys.path.append(".")
from app.core.db import engine, Base
from app.models.community import FPOGroup, FPOMember, FPOTender

# Drop specific tables
FPOMember.__table__.drop(engine, checkfirst=True)
FPOTender.__table__.drop(engine, checkfirst=True)
FPOGroup.__table__.drop(engine, checkfirst=True)

# Recreate them
Base.metadata.create_all(engine)
print("FPO tables recreated!")
