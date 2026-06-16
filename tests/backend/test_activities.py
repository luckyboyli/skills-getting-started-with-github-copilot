"""
Tests for FastAPI activities endpoint using Arrange-Act-Assert pattern.
"""

import pytest
from copy import deepcopy
from fastapi.testclient import TestClient
from src.app import app, activities


# Fixture to maintain test isolation
@pytest.fixture(autouse=True)
def reset_activities():
    """Backup activities before each test and restore after."""
    backup = deepcopy(activities)
    yield
    activities.clear()
    activities.update(backup)


@pytest.fixture
def client():
    """Provide TestClient for synchronous testing."""
    return TestClient(app)


def test_get_activities_returns_expected_structure(client):
    """Test that GET /activities returns activities with expected structure."""
    # Arrange
    expected_keys = {"description", "schedule", "max_participants", "participants"}

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0
    for activity_name, activity_details in data.items():
        assert isinstance(activity_name, str)
        assert isinstance(activity_details, dict)
        assert expected_keys.issubset(set(activity_details.keys()))
        assert isinstance(activity_details["participants"], list)


def test_signup_adds_participant_then_delete_removes(client):
    """Test that signup adds a participant and delete removes them."""
    # Arrange
    activity_name = "Chess Club"
    test_email = "test.student@mergington.edu"

    # Act - Sign up
    signup_response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": test_email}
    )

    # Assert - Signup successful
    assert signup_response.status_code == 200

    # Act - Verify participant added
    get_response = client.get("/activities")
    activities_data = get_response.json()

    # Assert - Participant in list
    assert test_email in activities_data[activity_name]["participants"]

    # Act - Delete participant
    delete_response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": test_email}
    )

    # Assert - Delete successful
    assert delete_response.status_code == 200

    # Act - Verify participant removed
    final_response = client.get("/activities")
    final_data = final_response.json()

    # Assert - Participant no longer in list
    assert test_email not in final_data[activity_name]["participants"]


def test_delete_nonexistent_participant_returns_404(client):
    """Test that deleting a nonexistent participant returns 404."""
    # Arrange
    activity_name = "Programming Class"
    nonexistent_email = "notasignedupstudent@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": nonexistent_email}
    )

    # Assert
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

