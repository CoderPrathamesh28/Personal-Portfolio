import requests

BASE_URL = "http://127.0.0.1:5000"
session = requests.Session()

def run_tests():
    print("=== STARTING ENDPOINT INTEGRATION TESTS ===")

    # Test 1: Home page
    print("\n1. Testing Public Home Page...")
    r = session.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "PORTFOLIO" in r.text, "Page content mismatch"
    print("PASS: Home page works.")

    # Test 2: Public Projects API
    print("\n2. Testing Public Projects API...")
    r = session.get(f"{BASE_URL}/api/projects")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    projects = r.json()
    assert isinstance(projects, list), "Expected list of projects"
    assert len(projects) > 0, "Seed projects list empty"
    print(f"PASS: Projects API returned {len(projects)} projects.")
    for p in projects:
        print(f" - Project: {p['title']} ({p['category']})")

    # Test 3: Public Skills API
    print("\n3. Testing Public Skills API...")
    r = session.get(f"{BASE_URL}/api/skills")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    skills = r.json()
    assert isinstance(skills, list), "Expected list of skills"
    assert len(skills) > 0, "Seed skills list empty"
    print(f"PASS: Skills API returned {len(skills)} skills.")

    # Test 4: Contact Form submission
    print("\n4. Testing Contact Message Submission...")
    contact_data = {
        "name": "Test Client",
        "email": "test@client.com",
        "subject": "Inquiry about fullstack design",
        "message": "Hello, I am testing your contact form. Hope it works well!"
    }
    r = session.post(f"{BASE_URL}/api/contacts", json=contact_data)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}"
    print(f"PASS: Contact message submitted successfully: {r.json()}")

    # Test 5: Unauthenticated Admin message retrieval
    print("\n5. Testing Unauthenticated Admin Access Blocking...")
    r = session.get(f"{BASE_URL}/api/admin/messages")
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
    print("PASS: Unauthenticated access blocked correctly.")

    # Test 6: Admin Login
    print("\n6. Testing Admin Login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    r = session.post(f"{BASE_URL}/api/admin/login", json=login_data)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    print(f"PASS: Login successful: {r.json()}")

    # Test 7: Admin Session Status check
    print("\n7. Checking Admin Authentication Status...")
    r = session.get(f"{BASE_URL}/api/admin/status")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data.get("authenticated") is True, "Session did not persist auth status"
    print("PASS: Session is authenticated.")

    # Test 8: Authenticated Admin message retrieval
    print("\n8. Testing Authenticated Admin Messages Fetch...")
    r = session.get(f"{BASE_URL}/api/admin/messages")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    messages = r.json()
    assert len(messages) >= 1, "Expected at least 1 message in database"
    assert messages[0]["name"] == "Test Client", "Submitted contact details mismatch"
    print(f"PASS: Retrieved {len(messages)} inbox messages. First sender: {messages[0]['name']}")

    # Test 9: Admin Project CRUD - CREATE
    print("\n9. Testing Admin Project Creation (C)...")
    new_project = {
        "title": "CRUD Testing App",
        "description": "An application created to verify full stack CREATE and DELETE database API workflows.",
        "category": "Web App",
        "technologies": "Flask, MySQL, TestTools",
        "image_url": "",
        "live_url": "https://test.com",
        "github_url": "https://github.com/test"
    }
    r = session.post(f"{BASE_URL}/api/admin/projects", json=new_project)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}"
    project_id = r.json().get("project_id")
    assert project_id is not None, "Project ID not returned"
    print(f"PASS: Project created with ID {project_id}.")

    # Test 10: Admin Project CRUD - UPDATE
    print("\n10. Testing Admin Project Editing (U)...")
    updated_project = new_project.copy()
    updated_project["title"] = "CRUD Testing App (Modified)"
    r = session.put(f"{BASE_URL}/api/admin/projects/{project_id}", json=updated_project)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    # Verify title changed
    r_check = session.get(f"{BASE_URL}/api/projects")
    assert r_check.status_code == 200
    all_projects = r_check.json()
    updated_in_list = [p for p in all_projects if p["id"] == project_id]
    assert len(updated_in_list) == 1
    assert updated_in_list[0]["title"] == "CRUD Testing App (Modified)", "Title was not updated in database"
    print("PASS: Project title updated successfully.")

    # Test 11: Admin Project CRUD - DELETE
    print("\n11. Testing Admin Project Deletion (D)...")
    r = session.delete(f"{BASE_URL}/api/admin/projects/{project_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    # Verify project is gone
    r_check = session.get(f"{BASE_URL}/api/projects")
    all_projects = r_check.json()
    deleted_in_list = [p for p in all_projects if p["id"] == project_id]
    assert len(deleted_in_list) == 0, "Project was not deleted from database"
    print("PASS: Project deleted successfully.")

    print("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\nTEST FAILURE: {e}")
    except Exception as e:
        print(f"\nUNEXPECTED ERROR: {e}")
