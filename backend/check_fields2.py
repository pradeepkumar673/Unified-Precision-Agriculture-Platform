import requests, sqlite3

conn = sqlite3.connect('app.db')
c = conn.cursor()
c.execute('SELECT id FROM farms LIMIT 1')
farm_id = c.fetchone()[0]
conn.close()
print('farm_id:', farm_id)

# convert from hex to UUID
import uuid
uid = str(uuid.UUID(farm_id))
print('UUID:', uid)

with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

with open('dummy.jpg', 'rb') as f:
    r = requests.post('http://localhost:8000/api/v1/vision_forecast/plant-count',
        files={'file': ('dummy.jpg', f, 'image/jpeg')},
        data={'farm_id': uid})
    print('Status:', r.status_code)
    print('Body:', r.text)
