from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException, status

from app.db.firebase import get_firestore_client

router = APIRouter(prefix='/api/contact', tags=['contact'])


def get_db():
    return get_firestore_client()


@router.post('')
def create_contact(payload: dict):
    db = get_db()
    if not payload.get('name') or not payload.get('email') or not payload.get('message'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing required fields')

    contact_id = f'contact_{uuid.uuid4().hex[:12]}'
    item = {
        'id': contact_id,
        'name': payload.get('name'),
        'email': payload.get('email'),
        'phone': payload.get('phone'),
        'subject': payload.get('subject'),
        'message': payload.get('message'),
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    db.collection('contacts').document(contact_id).set(item)
    return {'success': True, 'message': "Message received! We'll get back to you within 24 hours."}
