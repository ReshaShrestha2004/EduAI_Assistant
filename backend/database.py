import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'eduai_db')
}

connection_pool = None

def init_pool():
    global connection_pool
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="eduai_pool",
        pool_size=5,
        **db_config
    )

def get_db_connection():
    return connection_pool.get_connection()

if __name__ == "__main__":
    print("Starting DB connection test...")

    try:
        init_pool()
        conn = get_db_connection()
        print("Database connection successful!")
        conn.close()
    except Exception as e:
        print("Database connection failed")
        print(type(e).__name__, ":", e)
