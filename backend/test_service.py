import os
import sys

sys.path.append(os.getcwd())
from app.services.vision_forecast import count_plants_from_video

with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

res = count_plants_from_video('dummy.jpg')
print(res)
