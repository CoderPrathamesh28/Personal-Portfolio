import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DB config from environment
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "portfolio_db")

# For Vercel cloud hosting or external databases, a single connection string might be used
# Example: mysql://user:password@host:port/database
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    """Establishes and returns a database connection."""
    if DATABASE_URL:
        # Parse DATABASE_URL if provided (e.g. on Vercel/Render)
        # Format: mysql://user:pass@host:port/dbname
        try:
            from urllib.parse import urlparse, unquote, parse_qs
            url = urlparse(DATABASE_URL)
            
            user = unquote(url.username) if url.username else None
            password = unquote(url.password) if url.password else None
            database = url.path.lstrip('/')
            
            # Parse query parameters for ssl configuration
            query_params = parse_qs(url.query)
            ssl_mode_param = query_params.get('ssl-mode', ['PREFERRED'])[0]
            
            # Force SSL REQUIRED if hosting on Aiven or if requested in parameters
            if 'aivencloud' in (url.hostname or '').lower() or ssl_mode_param.upper() == 'REQUIRED':
                ssl_mode = 'REQUIRED'
            else:
                ssl_mode = 'PREFERRED'

            ssl_args = {}
            if 'aivencloud' in (url.hostname or '').lower() or ssl_mode_param.upper() == 'REQUIRED':
                ssl_args['ssl_disabled'] = False

            db_conn = mysql.connector.connect(
                host=url.hostname,
                port=url.port or 3306,
                user=user,
                password=password,
                database=database,
                **ssl_args
            )
            return db_conn
        except Exception as e:
            print(f"Error parsing DATABASE_URL: {e}. Falling back to default config.")
    
    # Fallback to individual env vars (e.g. local)
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def query_db(query, args=(), one=False):
    """Executes a query and returns results as dicts."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, args)
        rv = cursor.fetchall()
        conn.close()
        return (rv[0] if rv else None) if one else rv
    except Exception as e:
        conn.close()
        raise e

def execute_db(query, args=()):
    """Executes an INSERT, UPDATE, or DELETE query and returns the last row ID or rowcount."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, args)
        conn.commit()
        last_id = cursor.lastrowid
        row_count = cursor.rowcount
        conn.close()
        return last_id if last_id else row_count
    except Exception as e:
        conn.rollback()
        conn.close()
        raise e
