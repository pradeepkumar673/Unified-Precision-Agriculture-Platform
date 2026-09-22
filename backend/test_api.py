import requests

with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

try:
    with open('dummy.jpg', 'rb') as f:
        files = {'file': ('dummy.jpg', f, 'image/jpeg')}
        data = {'farm_id': '00000000-0000-0000-0000-000000000000'}
        r = requests.post('http://localhost:8000/api/v1/vision_forecast/plant-count', files=files, data=data)
        print('Status:', r.status_code)
        print('Response:', r.json())
except Exception as e:
    print('Error:', e)
