from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.firebase import get_firestore_client

router = APIRouter(prefix='/api/user', tags=['user'])


@router.get('/profile')
def get_profile(claims=Depends(get_current_user)):
    user_id = claims.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    db = get_firestore_client()
    doc = db.collection('users').document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Profile not found')

    profile = doc.to_dict()
    profile['createdAt'] = profile.get('created_at', profile.get('createdAt'))
    return {'profile': profile}


@router.put('/profile')
def update_profile(payload: dict, claims=Depends(get_current_user)):
    user_id = claims.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    db = get_firestore_client()
    doc_ref = db.collection('users').document(user_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Profile not found')

    safe_updates = {k: v for k, v in payload.items() if k not in {'id', 'email', 'password_hash'}}
    safe_updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    doc_ref.update(safe_updates)

    updated = doc_ref.get().to_dict()
    updated['createdAt'] = updated.get('created_at', updated.get('createdAt'))
    return {'success': True, 'profile': updated}
