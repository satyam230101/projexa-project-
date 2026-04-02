import io
from pypdf import PdfReader

from app.services.agent_service import AgentService
from app.services.trusted_sources_service import TrustedSourcesService


class ReportAnalysisService:
    def __init__(self):
        self.trusted = TrustedSourcesService()
        self.agent = AgentService()

    def extract_text_from_upload(self, filename: str, file_bytes: bytes, content_type: str | None) -> str:
        lower_name = filename.lower()
        if lower_name.endswith('.pdf') or (content_type and 'pdf' in content_type.lower()):
            return self._extract_pdf_text(file_bytes)
        return 'Unsupported file type for extraction in current implementation. Please upload PDF for best results.'

    def analyze_report_text(self, text: str, context: str | None = None, model_id: str | None = None) -> dict:
        intent = self._detect_intent(text)
        query = f'{intent} guideline recommendations WHO AIIMS MedlinePlus'
        evidence = self.trusted.search_guidelines(query=query, max_results=6)

        agent_resp = self.agent.answer_with_citations(
            user_question=f'Analyze this medical report context: {context or "general"}. Text: {text[:2500]}',
            trusted_evidence=evidence,
            model_id=model_id,
        )

        recommendations = [
            'Consult a licensed physician for diagnosis and treatment decisions.',
            'Do not self-medicate based only on automated analysis.',
            'If severe symptoms are present, seek urgent medical care immediately.',
        ]

        return {
            'summary': agent_resp['response'],
            'risk_level': self._risk_from_text(text),
            'recommendations': recommendations,
            'citations': agent_resp['citations'],
            'intent': intent,
        }

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_chunks = []
        for page in reader.pages:
            text_chunks.append(page.extract_text() or '')
        return '\n'.join(text_chunks).strip()

    def _detect_intent(self, text: str) -> str:
        lowered = text.lower()
        if 'glucose' in lowered or 'hba1c' in lowered or 'diabetes' in lowered:
            return 'diabetes lab report interpretation'
        if 'cholesterol' in lowered or 'ldl' in lowered or 'triglyceride' in lowered:
            return 'lipid profile interpretation'
        if 'bp' in lowered or 'blood pressure' in lowered or 'hypertension' in lowered:
            return 'hypertension management'
        if 'hemoglobin' in lowered or 'cbc' in lowered:
            return 'cbc interpretation'
        return 'general medical report interpretation'

    def _risk_from_text(self, text: str) -> str:
        lowered = text.lower()
        if any(token in lowered for token in ['critical', 'urgent', 'severe', 'panic value']):
            return 'high'
        if any(token in lowered for token in ['abnormal', 'elevated', 'low', 'borderline']):
            return 'medium'
        return 'low'
