from fastapi import APIRouter

from app.db.firebase import get_firestore_client

router = APIRouter(prefix='/api/doctors', tags=['doctors'])


def get_db():
    return get_firestore_client()


def _seed_doctors_if_empty():
    db = get_db()
    docs = list(db.collection('doctors').limit(1).stream())
    if docs:
        return

    sample = [
        {
            'id': 'doc1',
            'name': 'Dr. Arjun Sharma',
            'specialty': 'Cardiologist',
            'experience': '15 years',
            'rating': 4.9,
            'available': True,
            'fee': 800,
            'image': 'https://images.unsplash.com/photo-1699883430258-785510b807db?w=400',
            'bio': 'Expert in heart diseases and cardiovascular health.',
            'qualifications': 'MBBS, MD Cardiology',
            'languages': ['English', 'Hindi'],
            'consultations': 2450,
        },
        {
            'id': 'doc2',
            'name': 'Dr. Priya Menon',
            'specialty': 'Pediatrician',
            'experience': '12 years',
            'rating': 4.8,
            'available': True,
            'fee': 600,
            'image': 'https://images.unsplash.com/photo-1628320645101-5a41b1f88c0b?w=400',
            'bio': 'Specialized in child health and development.',
            'qualifications': 'MBBS, MD Pediatrics',
            'languages': ['English', 'Malayalam'],
            'consultations': 1890,
        },
    ]
    for doctor in sample:
        db.collection('doctors').document(doctor['id']).set(doctor)


@router.get('')
def list_doctors(specialty: str | None = None, available: str | None = None):
    db = get_db()
    _seed_doctors_if_empty()
    docs = [d.to_dict() for d in db.collection('doctors').stream()]

    if specialty and specialty.lower() != 'all':
        docs = [d for d in docs if specialty.lower() in str(d.get('specialty', '')).lower()]
    if available == 'true':
        docs = [d for d in docs if bool(d.get('available', False))]

    return {'doctors': docs}
