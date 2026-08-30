import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="session")
def client():
    """
    FastAPI TestClient fixture for sharing across all unit tests
    """
    with TestClient(app) as c:
        yield c
