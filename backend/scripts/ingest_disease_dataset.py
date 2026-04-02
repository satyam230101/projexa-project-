import argparse
import json
import re
import sys
from pathlib import Path

from pydantic import ValidationError

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.models.disease_kb import DiseaseDataset


_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9_\-]+")


def _build_tokens(record: dict) -> list[str]:
    fields = [
        record.get('disease_name', ''),
        *record.get('aliases', []),
        *record.get('common_symptoms', []),
        *record.get('differential_clues', []),
        *record.get('risk_factors', []),
        *record.get('red_flags', []),
    ]
    text = ' '.join(str(v) for v in fields).lower()
    return sorted(set(_TOKEN_RE.findall(text)))


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate and index disease dataset for MediBot.')
    parser.add_argument('--input', required=True, help='Path to input diseases JSON file.')
    parser.add_argument('--output-index', required=True, help='Path to output index JSON file.')
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output_index)

    if not input_path.exists():
        print(f'Input file not found: {input_path}')
        return 1

    raw = json.loads(input_path.read_text(encoding='utf-8'))
    try:
        dataset = DiseaseDataset.model_validate(raw)
    except ValidationError as exc:
        print('Dataset validation failed:')
        print(exc)
        return 1

    token_index: dict[str, list[str]] = {}
    for record in dataset.diseases:
        token_index[record.disease_id] = _build_tokens(record.model_dump())

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_payload = {
        'version': dataset.version,
        'updated_at': dataset.updated_at,
        'records_count': len(dataset.diseases),
        'token_index': token_index,
    }
    output_path.write_text(json.dumps(output_payload, indent=2), encoding='utf-8')

    print(f'Validated {len(dataset.diseases)} disease records.')
    print(f'Index written to: {output_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
