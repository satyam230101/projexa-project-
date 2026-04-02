from langchain_openai import ChatOpenAI

from app.core.config import get_settings


class AgentService:
    def __init__(self):
        self.settings = get_settings()

    def _has_valid_openrouter_key(self) -> bool:
        key = (self.settings.openrouter_api_key or '').strip()
        if not key:
            return False

        placeholders = {
            'your_openrouter_key_here',
            'sk-or-v1-your-openrouter-api-key',
            'replace_with_openrouter_key',
        }
        if key.lower() in placeholders:
            return False

        return key.startswith('sk-or-v1-')

    def _is_small_talk(self, text: str) -> bool:
        normalized = (text or '').strip().lower()
        if not normalized:
            return True

        small_talk_inputs = {
            'hi',
            'hii',
            'hiii',
            'hello',
            'hey',
            'good morning',
            'good afternoon',
            'good evening',
            'thanks',
            'thank you',
            'ok',
            'okay',
        }
        return normalized in small_talk_inputs

    def _small_talk_reply(self) -> str:
        return (
            'Hello! I am MediBot, your healthcare assistant. '
            'I can help with symptoms, possible causes, first-aid guidance, and when to see a doctor. '
            'Tell me your health concern in a sentence.'
        )

    def _symptom_fallback_reply(self, text: str) -> str | None:
        normalized = (text or '').lower()

        if 'fever' in normalized:
            return (
                'For fever, drink plenty of fluids, rest, and monitor your temperature every 4-6 hours. '
                'Adults can usually use paracetamol/acetaminophen if suitable for them. '
                'Seek urgent care if fever is very high (>=103F / 39.4C), lasts more than 3 days, '
                'or there are warning signs like breathing trouble, confusion, severe dehydration, chest pain, '
                'persistent vomiting, rash, or seizures.\n\n'
                'If you want, share age, temperature, and other symptoms so I can guide next steps.'
            )

        if 'headache' in normalized:
            return (
                'For headache, hydrate, rest in a quiet dark room, and avoid excessive screen time. '
                'Urgent evaluation is needed for sudden worst-ever headache, weakness, trouble speaking, '
                'fainting, high fever with stiff neck, head injury, or vision changes.\n\n'
                'If you want, share how long it has lasted and associated symptoms.'
            )

        if 'cough' in normalized or 'cold' in normalized or 'sore throat' in normalized:
            return (
                'For cough/cold symptoms, rest, hydrate, and consider steam inhalation and warm fluids. '
                'Seek care quickly for shortness of breath, chest pain, high persistent fever, '
                'blood in sputum, or symptoms worsening after a few days.\n\n'
                'Share duration and other symptoms to get more specific guidance.'
            )

        return None

    def answer_with_citations(self, user_question: str, trusted_evidence: list[dict], model_id: str | None = None) -> dict:
        if self._is_small_talk(user_question):
            return {
                'response': self._small_talk_reply(),
                'citations': [],
            }

        if not trusted_evidence:
            symptom_reply = self._symptom_fallback_reply(user_question)
            if symptom_reply:
                return {
                    'response': symptom_reply,
                    'citations': [],
                }

            return {
                'response': (
                    'I could not find sufficient evidence from trusted medical sources '
                    '(WHO/AIIMS/approved global sources). Please consult a licensed doctor for personalized advice.'
                ),
                'citations': [],
            }

        if not self._has_valid_openrouter_key():
            # Safe fallback without hallucination if model key is missing.
            summary = '\n'.join([f"- {e.get('snippet', '')}" for e in trusted_evidence[:3]])
            return {
                'response': f'Trusted evidence summary for your question:\n{summary}',
                'citations': trusted_evidence,
            }

        model = model_id or self.settings.openrouter_model or 'openai/gpt-4o-mini'
        llm = ChatOpenAI(
            model=model,
            api_key=self.settings.openrouter_api_key,
            base_url='https://openrouter.ai/api/v1',
            default_headers={
                'HTTP-Referer': self.settings.openrouter_site_url,
                'X-Title': self.settings.openrouter_site_name,
            },
            temperature=0.2,
        )

        context = '\n'.join([f"Source: {e['source']} | {e['title']} | {e['url']}\nSnippet: {e['snippet']}" for e in trusted_evidence])
        prompt = (
            'You are a medical support assistant. Use only the provided trusted evidence. '
            'Do not provide unsupported claims. Include concise safety guidance and suggest consulting a doctor.\n\n'
            f'User question: {user_question}\n\nTrusted evidence:\n{context}'
        )

        try:
            resp = llm.invoke(prompt)
            return {'response': str(resp.content), 'citations': trusted_evidence}
        except Exception:
            # If model provider fails at runtime, return grounded fallback instead of 500.
            summary = '\n'.join([f"- {e.get('snippet', '')}" for e in trusted_evidence[:3]])
            return {
                'response': (
                    'I could not reach the model provider right now. '
                    'Here is a trusted evidence summary:\n'
                    f'{summary}'
                ),
                'citations': trusted_evidence,
            }
