import requests
import sqlite3

conn = sqlite3.connect('app.db')
cursor = conn.cursor()
cursor.execute('SELECT id FROM farms LIMIT 1')
row = cursor.fetchone()
conn.close()

if not row:
    print('No farm found in DB!')
    exit(1)

farm_id = row[0]
print(f'Using farm_id: {farm_id}')

with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

try:
    with open('dummy.jpg', 'rb') as f:
        files = {'file': ('dummy.jpg', f, 'image/jpeg')}
        data = {'farm_id': farm_id}
        r = requests.post('http://localhost:8000/api/v1/vision_forecast/plant-count', files=files, data=data)
        print('Status:', r.status_code)
        print('Response:', r.json())
except Exception as e:
    print('Error:', e)
