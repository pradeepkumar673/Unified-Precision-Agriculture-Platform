import requests

with open('dummy.jpg', 'wb') as f:
    f.write(b'dummy')

r = requests.post('http://localhost:8001/api/v1/vision_forecast/plant-count',
    files={'file': ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg')},
    data={'farm_id': '00000000-0000-0000-0000-000000000000'})
print('Status:', r.status_code)
print('Body:', r.text)
