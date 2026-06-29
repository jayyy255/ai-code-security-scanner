import subprocess

password = "admin123"

user_input = input()

query = f"SELECT * FROM users WHERE id = {user_input}"

cursor.execute(query)

subprocess.run(user_input, shell=True)