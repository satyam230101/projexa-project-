"""Simple CLI AI assistant client for the Telemedicine backend."""

from __future__ import annotations

import json
import os
import getpass
import urllib.error
import urllib.request


DEFAULT_API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")
DEFAULT_BEARER_TOKEN = os.getenv("ASSISTANT_BEARER_TOKEN", "")


def build_chat_endpoint(api_base_url: str | None = None) -> str:
    base_url = (api_base_url or DEFAULT_API_BASE_URL).rstrip("/")
    return f"{base_url}/chat/agent"


def build_health_endpoint(api_base_url: str | None = None) -> str:
    base_url = (api_base_url or DEFAULT_API_BASE_URL).rstrip("/")
    return f"{base_url}/health"


def build_signin_endpoint(api_base_url: str | None = None) -> str:
    base_url = (api_base_url or DEFAULT_API_BASE_URL).rstrip("/")
    return f"{base_url}/auth/signin"


def check_backend_health(api_base_url: str | None = None) -> tuple[bool, str]:
    health_endpoint = build_health_endpoint(api_base_url)
    req = urllib.request.Request(health_endpoint, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return True, "Backend is reachable."
            return False, f"Unexpected health status: {response.status}"
    except urllib.error.URLError as exc:
        return False, f"Could not reach backend health endpoint: {exc.reason}"


def signin_for_token(api_base_url: str, email: str, password: str) -> tuple[str | None, str | None]:
    signin_endpoint = build_signin_endpoint(api_base_url)
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        signin_endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
            token = data.get("access_token")
            if token:
                return token, None
            return None, "Signin succeeded but no access_token was returned."
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return None, f"Signin failed (HTTP {exc.code}): {body}"
    except urllib.error.URLError as exc:
        return None, f"Signin failed: {exc.reason}"
    except json.JSONDecodeError:
        return None, "Signin failed: backend returned invalid JSON."


def prompt_signin(api_base_url: str) -> str | None:
    print("Sign in is required because /api/chat/agent is protected.")
    for attempt in range(1, 4):
        email = input("Email (press Enter to cancel): ").strip()
        if not email:
            return None

        password = getpass.getpass("Password: ")
        token, signin_error = signin_for_token(api_base_url, email, password)
        if token:
            print("Signin successful. Continuing with authenticated chat.")
            return token

        if signin_error:
            print(f"Warning: {signin_error}")
            if "Invalid credentials" in signin_error:
                print("Hint: Use the same email/password you use in the app, or sign up first.")

        if attempt < 3:
            should_retry = input("Try signin again? (y/N): ").strip().lower()
            if should_retry not in {"y", "yes"}:
                return None

    return None


def ask_backend(question: str, chat_endpoint: str, bearer_token: str | None = None) -> dict:
    payload = json.dumps({"message": question}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"

    req = urllib.request.Request(
        chat_endpoint,
        data=payload,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 401:
            return {
                "error": (
                    "HTTP 401 Unauthorized. Please sign in with a valid app account "
                    "to get a JWT access token."
                )
            }
        return {"error": f"HTTP {exc.code}: {body}"}
    except urllib.error.URLError as exc:
        return {"error": f"Connection failed: {exc.reason}"}
    except json.JSONDecodeError:
        return {"error": "Backend returned invalid JSON."}


def print_answer(result: dict) -> None:
    if "error" in result:
        print(f"Error: {result['error']}")
        return

    answer = result.get("response") or result.get("answer") or "No response received."
    citations = result.get("citations", [])

    print("\nAssistant:")
    print(answer)

    if citations:
        print("\nCitations:")
        for idx, item in enumerate(citations, start=1):
            title = item.get("title", "Untitled")
            url = item.get("url", "")
            source = item.get("source", "")
            print(f"{idx}. {title} | {source} | {url}")


def run_chat_loop(api_base_url: str | None = None, bearer_token: str | None = None) -> None:
    chat_endpoint = build_chat_endpoint(api_base_url)
    token = bearer_token if bearer_token is not None else DEFAULT_BEARER_TOKEN
    resolved_api_base = (api_base_url or DEFAULT_API_BASE_URL).rstrip("/")

    print("Telemedicine AI Assistant")
    print(f"API endpoint: {chat_endpoint}")

    healthy, health_message = check_backend_health(api_base_url)
    if not healthy:
        print(f"Error: {health_message}")
        print("Start backend first: cd backend ; python run.py")
        return

    if not token:
        print("No ASSISTANT_BEARER_TOKEN found.")
        token = prompt_signin(resolved_api_base)
        if not token:
            print("Authentication is required. Exiting assistant.")
            return

    print("Type 'exit' to quit.\n")

    while True:
        question = input("You: ").strip()
        if not question:
            continue
        if question.lower() in {"exit", "quit"}:
            print("Goodbye.")
            return

        result = ask_backend(question, chat_endpoint, token)
        if "error" in result and "401 Unauthorized" in str(result.get("error", "")):
            print("Session unauthorized. Please sign in to refresh token.")
            token = prompt_signin(resolved_api_base)
            if token:
                print("Retrying your question.")
                result = ask_backend(question, chat_endpoint, token)
            else:
                print("Could not re-authenticate. Please run again and sign in with valid credentials.")
                continue

        print_answer(result)
        print()


def main() -> int:
    try:
        run_chat_loop()
    except KeyboardInterrupt:
        print("\nInterrupted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
