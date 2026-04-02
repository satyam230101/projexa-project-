from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.db.firebase import get_firestore_client

router = APIRouter(prefix='/api/consultations', tags=['consultations'])


def get_db():
    return get_firestore_client()


def _build_meeting_link(consult_id: str, consult_type: str) -> str | None:
    """Return a join URL for video consultations using configured provider."""
    if (consult_type or 'video').lower() != 'video':
        return None

    settings = get_settings()
    base_url = (settings.video_meeting_base_url or 'https://meet.jit.si').rstrip('/')
    room_prefix = (settings.video_meeting_room_prefix or 'mediplus').strip('-_ ')
    room_name = f"{room_prefix}-{consult_id}" if room_prefix else consult_id
    return f"{base_url}/{room_name}"


@router.post('')
def create_consultation(payload: dict, claims=Depends(get_current_user)):
    db = get_db()
    user_id = claims.get('sub')
    email = claims.get('email')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    doctor_id = payload.get('doctorId')
    date = payload.get('date')
    time = payload.get('time')
    if not doctor_id or not date or not time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='doctorId, date and time are required')

    user_doc = db.collection('users').document(user_id).get()
    user_name = user_doc.to_dict().get('name', 'Unknown') if user_doc.exists else 'Unknown'

    consult_id = f'consult_{uuid.uuid4().hex[:12]}'
    item = {
        'id': consult_id,
        'patientId': user_id,
        'patientName': user_name,
        'patientEmail': email,
        'doctorId': doctor_id,
        'doctorName': payload.get('doctorName'),
        'specialty': payload.get('specialty'),
        'date': date,
        'time': time,
        'type': payload.get('type', 'video'),
        'symptoms': payload.get('symptoms'),
        'notes': payload.get('notes'),
        'status': 'confirmed',
        'meetingLink': _build_meeting_link(consult_id, payload.get('type', 'video')),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    db.collection('consultations').document(consult_id).set(item)
    return {'success': True, 'consultation': item}


@router.get('/my')
def my_consultations(claims=Depends(get_current_user)):
    db = get_db()
    user_id = claims.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    role = claims.get('role', 'patient')
    field = 'doctorId' if role == 'doctor' else 'patientId'

    docs = db.collection('consultations').where(field, '==', user_id).stream()
    rows = [doc.to_dict() for doc in docs]
    rows.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {'consultations': rows}
