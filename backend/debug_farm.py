import requests, sqlite3

# First check DB farms
conn = sqlite3.connect('app.db')
c = conn.cursor()
c.execute('SELECT id, name FROM farms LIMIT 3')
rows = c.fetchall()
conn.close()
print('Farms in DB:', rows)

# Test with 000 UUID
with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

with open('dummy.jpg', 'rb') as f:
    r = requests.post('http://localhost:8000/api/v1/vision_forecast/plant-count',
        files={'file': ('dummy.jpg', f, 'image/jpeg')},
        data={'farm_id': '00000000-0000-0000-0000-000000000000'})
    print('Status:', r.status_code)
    print('Body:', r.text[:500])
