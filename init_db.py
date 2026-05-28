import os
import mysql.connector
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from database import get_db_connection

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "portfolio_db")
DATABASE_URL = os.getenv("DATABASE_URL")

def init_db():
    print("Connecting to MySQL...")
    
    if DATABASE_URL:
        # Cloud/Prod setup: connect directly to pre-created database
        print("DATABASE_URL detected. Connecting directly to cloud database...")
        conn = get_db_connection()
    else:
        # Local setup: connect without database first to ensure database exists
        try:
            conn = mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD
            )
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
            print(f"Database '{DB_NAME}' verified/created.")
            conn.close()
        except Exception as e:
            print(f"Warning: Could not verify database creation: {e}. Trying direct connection...")
            
        # Connect to local database
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
    
    cursor = conn.cursor()
    
    # Read schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    print(f"Reading schema from {schema_path}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
        
    # Split schema queries (basic parsing by semicolon)
    queries = schema_sql.split(';')
    for query in queries:
        clean_query = query.strip()
        if clean_query:
            try:
                cursor.execute(clean_query)
            except Exception as e:
                print(f"Error executing statement: {clean_query[:50]}...\nError: {e}")
                conn.rollback()
                conn.close()
                return False
                
    print("Tables created successfully.")
    
    # Check if admin already exists
    cursor.execute("SELECT COUNT(*) FROM admin_users")
    if cursor.fetchone()[0] == 0:
        # Create default admin: admin / admin123
        username = "admin"
        password = "admin123"
        pwd_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)",
            (username, pwd_hash)
        )
        print(f"Default admin user created: Username='{username}', Password='{password}'")
    else:
        print("Admin user already exists. Skipping admin creation.")
        
    # Check if skills exist, seed if empty
    cursor.execute("SELECT COUNT(*) FROM skills")
    if cursor.fetchone()[0] == 0:
        skills_data = [
            # Frontend
            ("HTML5 & CSS3", "Frontend", 95),
            ("JavaScript", "Frontend", 70),
            ("React.js", "Frontend", 70),
            # Backend
            ("Python & Flask/Django", "Backend", 85),
            ("C & C++", "Backend", 90),
            ("Java", "Backend", 80),
            ("Node.js & Express", "Backend", 65),
            # Database
            ("MySQL", "Database", 80),
            ("MySQL Workbench", "Database", 85),
            ("SQLite", "Database", 80),
            # Tools
            ("Git & GitHub", "Tools", 80),
        ]
        cursor.executemany(
            "INSERT INTO skills (name, category, proficiency) VALUES (%s, %s, %s)",
            skills_data
        )
        print(f"Inserted {len(skills_data)} default skills.")
        
    # Check if projects exist, seed if empty
    cursor.execute("SELECT COUNT(*) FROM projects")
    if cursor.fetchone()[0] == 0:
        projects_data = [
            (
                "Hackathon Management Platform",
                "A full-stack collaborative platform designed to coordinate, submit, and judge hackathons. Features real-time leaderboards, team formation tools, and automated notifications.",
                "Web App",
                "/static/images/projects/hackathon.jpg",
                "https://hackathon-platform.vercel.app",
                "https://github.com/example/hackathon-platform",
                "Flask, SQLite, HTML5, CSS3, JavaScript, SMTP"
            ),
            (
                "AI Attendance & Face Recognition Software",
                "Desktop software utilizing OpenCV and Haar-Cascade classifiers to capture and recognize faces in real-time. Automatically registers attendance into a local MySQL database.",
                "AI & ML",
                "/static/images/projects/facerec.jpg",
                None,
                "https://github.com/example/face-recognition-attendance",
                "Python, OpenCV, Tkinter, MySQL"
            ),
            (
                "Glassmorphic Crypto Analytics Dashboard",
                "A visual web dashboard displaying live cryptocurrency values, historical performance, and sentiment analysis. Features CSS Glassmorphic design and responsive interactive graphs.",
                "Frontend",
                "/static/images/projects/crypto.jpg",
                "https://crypto-dashboard.vercel.app",
                "https://github.com/example/crypto-glass-dashboard",
                "React, Chart.js, Tailwind CSS, CoinGecko API"
            ),
            (
                "Developer Personal Portfolio",
                "A responsive, full-stack personal portfolio showcasing software projects and core competencies. Built with a Flask administration console to manage projects in real time.",
                "Web App",
                "/static/images/projects/portfolio.jpg",
                "https://portfolio.vercel.app",
                "https://github.com/example/personal-portfolio",
                "Flask, MySQL, Vanilla HTML, CSS, JavaScript"
            )
        ]
        cursor.executemany(
            "INSERT INTO projects (title, description, category, image_url, live_url, github_url, technologies) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            projects_data
        )
        print(f"Inserted {len(projects_data)} default projects.")
        
    conn.commit()
    conn.close()
    print("Database initialization complete!")
    return True

if __name__ == "__main__":
    init_db()
