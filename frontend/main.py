"""Frontend Python launcher that connects .env to the AI assistant client."""

from __future__ import annotations

from pathlib import Path

from ai_assistant import run_chat_loop


def load_env_file(env_path: Path) -> dict[str, str]:
	values: dict[str, str] = {}
	if not env_path.exists():
		return values

	for raw_line in env_path.read_text(encoding="utf-8").splitlines():
		line = raw_line.strip()
		if not line or line.startswith("#") or "=" not in line:
			continue
		key, value = line.split("=", 1)
		values[key.strip()] = value.strip().strip('"').strip("'")
	return values


def resolve_api_base_url(env_values: dict[str, str]) -> str:
	api_base = env_values.get("API_BASE_URL") or env_values.get("VITE_API_BASE_URL") or "http://localhost:8000/api"
	if api_base.startswith("/"):
		return f"http://localhost:8000{api_base}"
	return api_base


def main() -> int:
	current_dir = Path(__file__).resolve().parent
	env_values = load_env_file(current_dir / ".env")
	api_base_url = resolve_api_base_url(env_values)
	bearer_token = env_values.get("ASSISTANT_BEARER_TOKEN", "")

	print(f"Loaded API base URL from .env: {api_base_url}")
	try:
		run_chat_loop(api_base_url, bearer_token)
	except KeyboardInterrupt:
		print("\nInterrupted.")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
