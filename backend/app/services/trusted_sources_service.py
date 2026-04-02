import httpx
from app.core.config import get_settings


class TrustedSourcesService:
    def __init__(self):
        self.settings = get_settings()
        self.allowed_domains = [d.strip() for d in self.settings.trusted_guideline_sources.split(',') if d.strip()]

    def search_guidelines(self, query: str, max_results: int = 5) -> list[dict]:
        provider = self.settings.search_provider.lower()
        search_order = []
        if provider == 'auto':
            search_order = ['tavily', 'serpapi', 'duckduckgo']
        else:
            search_order = [provider, 'duckduckgo']

        for name in search_order:
            try:
                if name == 'tavily':
                    results = self._search_tavily(query, max_results)
                elif name == 'serpapi':
                    results = self._search_serpapi(query, max_results)
                elif name == 'duckduckgo':
                    results = self._search_duckduckgo(query, max_results)
                else:
                    continue

                if results:
                    return results
            except Exception:
                continue

        return []

    def _search_tavily(self, query: str, max_results: int) -> list[dict]:
        if not self.settings.tavily_api_key:
            return []

        from tavily import TavilyClient

        client = TavilyClient(api_key=self.settings.tavily_api_key)
        response = client.search(query=query, search_depth='advanced', max_results=max_results * 3)
        items = response.get('results', [])
        return self._filter_results(
            [
                {
                    'title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'snippet': item.get('content', ''),
                }
                for item in items
            ],
            max_results,
        )

    def _search_serpapi(self, query: str, max_results: int) -> list[dict]:
        if not self.settings.serpapi_api_key:
            return []

        params = {
            'q': query,
            'api_key': self.settings.serpapi_api_key,
            'engine': 'google',
            'num': max_results * 3,
        }
        with httpx.Client(timeout=20) as client:
            response = client.get('https://serpapi.com/search.json', params=params)
            response.raise_for_status()
            data = response.json()

        organic = data.get('organic_results', [])
        return self._filter_results(
            [
                {
                    'title': item.get('title', ''),
                    'url': item.get('link', ''),
                    'snippet': item.get('snippet', ''),
                }
                for item in organic
            ],
            max_results,
        )

    def _search_duckduckgo(self, query: str, max_results: int) -> list[dict]:
        # Free fallback (no API key) for development.
        from duckduckgo_search import DDGS

        rows: list[dict] = []
        with DDGS() as ddgs:
            for item in ddgs.text(query, max_results=max_results * 3):
                rows.append(
                    {
                        'title': item.get('title', ''),
                        'url': item.get('href', ''),
                        'snippet': item.get('body', ''),
                    }
                )
        return self._filter_results(rows, max_results)

    def _filter_results(self, rows: list[dict], max_results: int) -> list[dict]:
        results: list[dict] = []
        for item in rows:
            link = item.get('url', '')
            if any(domain in link for domain in self.allowed_domains):
                results.append(
                    {
                        'title': item.get('title', ''),
                        'url': link,
                        'snippet': item.get('snippet', ''),
                        'source': self._extract_source(link),
                    }
                )
            if len(results) >= max_results:
                break
        return results

    def _extract_source(self, url: str) -> str:
        for domain in self.allowed_domains:
            if domain in url:
                return domain
        return 'trusted-source'
