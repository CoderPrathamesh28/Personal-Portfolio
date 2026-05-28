import os
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

# Import database functions
from database import query_db, execute_db

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-dev-key")

# Enable CORS for cross-origin API testing
CORS(app)

# Helper function to check admin session
def is_admin_logged_in():
    return session.get("admin_logged_in", False)

# ----------------- PAGE ROUTES -----------------

@app.route('/')
def home():
    """Serves the portfolio homepage."""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Serves the admin panel dashboard."""
    return render_template('admin.html')

# ----------------- PUBLIC API ENDPOINTS -----------------

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Fetches all projects from database."""
    try:
        projects = query_db("SELECT * FROM projects ORDER BY id DESC")
        return jsonify(projects), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Fetches all skills from database."""
    try:
        skills = query_db("SELECT * FROM skills ORDER BY category, proficiency DESC")
        return jsonify(skills), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/contacts', methods=['POST'])
def submit_contact():
    """Submits contact form, saving to database."""
    try:
        data = request.json or request.form
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        subject = data.get("subject", "").strip()
        message = data.get("message", "").strip()

        # Simple validation
        if not name or not email or not subject or not message:
            return jsonify({"error": "All fields are required."}), 400

        # Insert into database
        query = "INSERT INTO contacts (name, email, subject, message) VALUES (%s, %s, %s, %s)"
        execute_db(query, (name, email, subject, message))

        return jsonify({"success": "Your message has been sent successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- ADMIN API ENDPOINTS -----------------

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Authenticates admin users."""
    try:
        data = request.json or request.form
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        # Fetch admin user from DB
        admin_user = query_db("SELECT * FROM admin_users WHERE username = %s", (username,), one=True)

        if admin_user and check_password_hash(admin_user['password_hash'], password):
            session["admin_logged_in"] = True
            session["admin_username"] = username
            return jsonify({"success": "Logged in successfully", "username": username}), 200
        else:
            return jsonify({"error": "Invalid username or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    """Logs out admin user."""
    session.pop("admin_logged_in", None)
    session.pop("admin_username", None)
    return jsonify({"success": "Logged out successfully"}), 200

@app.route('/api/admin/status', methods=['GET'])
def admin_status():
    """Checks current session login status."""
    if is_admin_logged_in():
        return jsonify({"authenticated": True, "username": session.get("admin_username")}), 200
    else:
        return jsonify({"authenticated": False}), 200

@app.route('/api/admin/messages', methods=['GET'])
def get_admin_messages():
    """Fetches all contact form messages (Requires Admin auth)."""
    if not is_admin_logged_in():
        return jsonify({"error": "Unauthorized access."}), 403

    try:
        messages = query_db("SELECT * FROM contacts ORDER BY created_at DESC")
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/projects', methods=['POST'])
def add_project():
    """Creates a new project (Requires Admin auth)."""
    if not is_admin_logged_in():
        return jsonify({"error": "Unauthorized access."}), 403

    try:
        data = request.json
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        category = data.get("category", "").strip()
        technologies = data.get("technologies", "").strip()
        image_url = data.get("image_url", "").strip() or "/static/images/placeholder.jpg"
        live_url = data.get("live_url", "").strip() or None
        github_url = data.get("github_url", "").strip() or None

        if not title or not description or not category or not technologies:
            return jsonify({"error": "Title, Description, Category, and Technologies are required."}), 400

        query = """INSERT INTO projects (title, description, category, technologies, image_url, live_url, github_url) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        project_id = execute_db(query, (title, description, category, technologies, image_url, live_url, github_url))
        
        return jsonify({"success": "Project added successfully", "project_id": project_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/projects/<int:project_id>', methods=['PUT'])
def edit_project(project_id):
    """Updates an existing project (Requires Admin auth)."""
    if not is_admin_logged_in():
        return jsonify({"error": "Unauthorized access."}), 403

    try:
        data = request.json
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        category = data.get("category", "").strip()
        technologies = data.get("technologies", "").strip()
        image_url = data.get("image_url", "").strip() or "/static/images/placeholder.jpg"
        live_url = data.get("live_url", "").strip() or None
        github_url = data.get("github_url", "").strip() or None

        if not title or not description or not category or not technologies:
            return jsonify({"error": "Title, Description, Category, and Technologies are required."}), 400

        query = """UPDATE projects 
                   SET title = %s, description = %s, category = %s, technologies = %s, image_url = %s, live_url = %s, github_url = %s 
                   WHERE id = %s"""
        execute_db(query, (title, description, category, technologies, image_url, live_url, github_url, project_id))
        
        return jsonify({"success": "Project updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Deletes a project (Requires Admin auth)."""
    if not is_admin_logged_in():
        return jsonify({"error": "Unauthorized access."}), 403

    try:
        query = "DELETE FROM projects WHERE id = %s"
        execute_db(query, (project_id,))
        return jsonify({"success": "Project deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
