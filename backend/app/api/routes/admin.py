from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.firebase import get_firestore_client

router = APIRouter(prefix='/api/admin', tags=['admin'])


def get_db():
    return get_firestore_client()


def _require_admin(claims: dict):
    if claims.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')


@router.get('/stats')
def admin_stats(claims=Depends(get_current_user)):
    db = get_db()
    _require_admin(claims)
    users = [d.to_dict() for d in db.collection('users').stream()]
    consultations = [d.to_dict() for d in db.collection('consultations').stream()]
    reports = [d.to_dict() for d in db.collection('reports').stream()]
    contacts = [d.to_dict() for d in db.collection('contacts').where('status', '==', 'new').stream()]

    total_patients = len([u for u in users if u.get('role') == 'patient'])
    total_doctors = len([u for u in users if u.get('role') == 'doctor'])
    stats = {
        'totalUsers': len(users),
        'totalPatients': total_patients,
        'totalDoctors': total_doctors,
        'totalConsultations': len(consultations),
        'totalReports': len(reports),
        'pendingContacts': len(contacts),
    }

    weekly = []
    for i in range(7):
        day = datetime.now() - timedelta(days=(6 - i))
        label = day.strftime('%a')
        weekly.append({'day': label, 'consultations': 0, 'registrations': 0, 'reports': 0})

    return {'stats': stats, 'weeklyData': weekly, 'timestamp': datetime.now().isoformat()}


@router.get('/users')
def admin_users(claims=Depends(get_current_user)):
    db = get_db()
    _require_admin(claims)
    users = [d.to_dict() for d in db.collection('users').stream()]
    return {'users': users}


@router.get('/consultations')
def admin_consultations(claims=Depends(get_current_user)):
    db = get_db()
    _require_admin(claims)
    rows = [d.to_dict() for d in db.collection('consultations').stream()]
    return {'consultations': rows}


@router.get('/contacts')
def admin_contacts(claims=Depends(get_current_user)):
    db = get_db()
    _require_admin(claims)
    rows = [d.to_dict() for d in db.collection('contacts').stream()]
    return {'contacts': rows}
