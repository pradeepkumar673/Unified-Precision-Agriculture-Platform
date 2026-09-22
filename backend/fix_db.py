import sqlite3
c=sqlite3.connect('app.db')
c.execute("UPDATE farms SET user_id='fe9dd9b72f344f36922f43a9d3f8ebbc'")
c.commit()
