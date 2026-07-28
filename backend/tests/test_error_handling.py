from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def test_successful_responses_include_a_request_id() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["X-Request-ID"]


def test_unknown_routes_use_the_standard_error_contract() -> None:
    response = client.get("/does-not-exist", headers={"X-Request-ID": "request-123"})

    assert response.status_code == 404
    assert response.headers["X-Request-ID"] == "request-123"
    assert response.json()["error"] == {
        "code": "http_error",
        "request_id": "request-123",
    }


def test_request_validation_errors_do_not_include_raw_input() -> None:
    response = client.post("/api/v1/leagues/", json={"name": "x"})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "request_validation_error"
    assert error["request_id"]
    assert all("input" not in issue for issue in response.json()["detail"])
