from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.models.chat import ChatRequest, ChatResponse
from app.services.agent_service import AgentService
from app.services.disease_kb_service import DiseaseKnowledgeService
from app.services.trusted_sources_service import TrustedSourcesService

router = APIRouter(prefix='/api/chat', tags=['chat'])
trusted = TrustedSourcesService()
disease_kb = DiseaseKnowledgeService()
agent = AgentService()


def _merge_evidence(primary: list[dict], secondary: list[dict], limit: int = 6) -> list[dict]:
    merged: list[dict] = []
    seen_keys: set[str] = set()

    for item in [*primary, *secondary]:
        key = f"{item.get('url', '')}|{item.get('title', '')}".strip()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        merged.append(item)
        if len(merged) >= limit:
            break

    return merged


@router.post('/agent', response_model=ChatResponse)
def chat_agent(payload: ChatRequest, user=Depends(get_current_user)):
    del user
    dataset_evidence = disease_kb.search(payload.message, max_results=4)

    query = f"{payload.message} WHO AIIMS MedlinePlus guideline"
    web_evidence = trusted.search_guidelines(query=query, max_results=6)

    evidence = _merge_evidence(dataset_evidence, web_evidence, limit=6)
    result = agent.answer_with_citations(payload.message, evidence, model_id=payload.model_id)
    return ChatResponse(**result)
