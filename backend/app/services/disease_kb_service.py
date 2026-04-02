import json
import re
from pathlib import Path

from app.models.disease_kb import DiseaseDataset, DiseaseRecord


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = BACKEND_ROOT / 'app' / 'data' / 'diseases.json'
INDEX_PATH = BACKEND_ROOT / 'app' / 'data' / 'disease_index.json'
MEDICINES_PATH = BACKEND_ROOT / 'app' / 'data' / 'medicine_list.json'
_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9_\-]+")


class DiseaseKnowledgeService:
    def __init__(self):
        self._dataset: DiseaseDataset | None = None
        self._index: dict[str, set[str]] = {}
        self._records_by_id: dict[str, DiseaseRecord] = {}
        self._medicines_by_disease_id: dict[str, list[dict]] = {}
        self._load()

    def _load(self) -> None:
        if not DATASET_PATH.exists():
            self._dataset = None
            return

        raw = json.loads(DATASET_PATH.read_text(encoding='utf-8'))
        self._dataset = DiseaseDataset.model_validate(raw)
        self._records_by_id = {record.disease_id: record for record in self._dataset.diseases}

        if INDEX_PATH.exists():
            raw_index = json.loads(INDEX_PATH.read_text(encoding='utf-8'))
            self._index = {
                disease_id: set(tokens)
                for disease_id, tokens in raw_index.get('token_index', {}).items()
                if disease_id in self._records_by_id
            }
        else:
            self._index = {record.disease_id: self._build_tokens(record) for record in self._dataset.diseases}

        self._medicines_by_disease_id = {}
        if MEDICINES_PATH.exists():
            raw_medicines = json.loads(MEDICINES_PATH.read_text(encoding='utf-8'))
            entries = raw_medicines.get('diseases', [])
            for item in entries:
                disease_id = str(item.get('disease_id', '')).strip()
                medicines = item.get('medicines', [])
                if not disease_id or not isinstance(medicines, list):
                    continue
                self._medicines_by_disease_id[disease_id] = medicines

    def _build_tokens(self, record: DiseaseRecord) -> set[str]:
        fields = [
            record.disease_name,
            *record.aliases,
            *record.common_symptoms,
            *record.differential_clues,
            *record.risk_factors,
            *record.red_flags,
        ]
        text = ' '.join(fields).lower()
        return set(_TOKEN_RE.findall(text))

    def search(self, user_query: str, max_results: int = 4) -> list[dict]:
        if not self._dataset or not user_query.strip():
            return []

        query_tokens = set(_TOKEN_RE.findall(user_query.lower()))
        if not query_tokens:
            return []

        scored: list[tuple[float, DiseaseRecord]] = []
        for disease_id, tokens in self._index.items():
            overlap = len(tokens.intersection(query_tokens))
            if overlap <= 0:
                continue

            score = overlap / max(1, len(query_tokens))
            record = self._records_by_id[disease_id]
            scored.append((score, record))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:max_results]
        return [self._to_evidence(record, score) for score, record in top]

    def _to_evidence(self, record: DiseaseRecord, score: float) -> dict:
        source = record.sources[0]
        snippet_parts = []
        if record.common_symptoms:
            snippet_parts.append('Common symptoms: ' + ', '.join(record.common_symptoms[:5]))
        medicine_items = self._medicines_by_disease_id.get(record.disease_id, [])
        if medicine_items:
            short_list = []
            for med in medicine_items[:3]:
                name = str(med.get('name', '')).strip()
                usage = str(med.get('usage', '')).strip()
                if not name:
                    continue
                short_list.append(f"{name} ({usage})" if usage else name)
            if short_list:
                snippet_parts.append('Possible medicine options: ' + '; '.join(short_list))
        if record.red_flags:
            snippet_parts.append('Red flags: ' + ', '.join(record.red_flags[:3]))
        if record.when_to_seek_doctor:
            snippet_parts.append('Seek doctor when: ' + '; '.join(record.when_to_seek_doctor[:2]))

        return {
            'title': f"{record.disease_name} (dataset)",
            'url': source.url,
            'snippet': ' | '.join(snippet_parts),
            'source': f"dataset:{source.publisher}",
            'score': round(score, 3),
            'disease_id': record.disease_id,
            'medicine_suggestions': medicine_items,
        }
