from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.dependencies import get_current_user
from app.db.firebase import get_firestore_client, get_storage_bucket
from app.models.report import AnalyzeTextRequest, ReportAnalysisResponse
from app.services.report_analysis_service import ReportAnalysisService

router = APIRouter(prefix='/api/reports', tags=['reports'])
analysis_service = ReportAnalysisService()


def get_db():
    return get_firestore_client()


def _doctor_consults_patient(db, doctor_id: str, patient_id: str) -> bool:
    consults = (
        db.collection('consultations')
        .where('doctorId', '==', doctor_id)
        .where('patientId', '==', patient_id)
        .limit(1)
        .stream()
    )
    return any(True for _ in consults)


@router.post('/legacy-upload')
def legacy_upload(payload: dict, user=Depends(get_current_user)):
    db = get_db()
    user_id = user.get('sub', 'unknown')
    now = datetime.now(timezone.utc).isoformat()
    report_doc = db.collection('reports').document()
    report_doc.set({
        'id': report_doc.id,
        'user_id': user_id,
        'fileName': payload.get('fileName'),
        'file_name': payload.get('fileName'),
        'fileType': payload.get('fileType'),
        'content_type': payload.get('fileType'),
        'fileSize': payload.get('fileSize'),
        'file_size': payload.get('fileSize'),
        'category': payload.get('category', 'General'),
        'notes': payload.get('notes'),
        'status': 'uploaded',
        'uploadedAt': now,
        'created_at': now,
        'updated_at': now,
    })
    return {'success': True, 'report': report_doc.get().to_dict()}


@router.get('/legacy-my')
def legacy_my_reports(user=Depends(get_current_user)):
    db = get_db()
    user_id = user.get('sub', 'unknown')
    docs = db.collection('reports').where('user_id', '==', user_id).stream()
    rows = []
    for d in docs:
        raw = d.to_dict()
        rows.append(
            {
                **raw,
                'fileName': raw.get('fileName') or raw.get('file_name'),
                'fileType': raw.get('fileType') or raw.get('content_type'),
                'fileSize': raw.get('fileSize') or raw.get('file_size') or 0,
                'uploadedAt': raw.get('uploadedAt') or raw.get('created_at'),
                'status': raw.get('status', 'uploaded'),
                'notes': raw.get('notes') or '',
            }
        )
    rows.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {'reports': rows}


@router.post('/analyze-text', response_model=ReportAnalysisResponse)
def analyze_text(payload: AnalyzeTextRequest, user=Depends(get_current_user)):
    del user
    data = analysis_service.analyze_report_text(payload.text, context=payload.context)
    return ReportAnalysisResponse(**data)


@router.post('/upload-analysis', response_model=ReportAnalysisResponse)
async def upload_and_analyze(
    file: UploadFile = File(...),
    context: str | None = Form(default=None),
    user=Depends(get_current_user),
):
    db = get_db()
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing file name')

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Empty file')

    text = analysis_service.extract_text_from_upload(file.filename, file_bytes, file.content_type)
    result = analysis_service.analyze_report_text(text, context=context)

    user_id = user.get('sub', 'unknown')
    now = datetime.now(timezone.utc).isoformat()

    storage_url = None
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(f'reports/{user_id}/{int(datetime.now().timestamp())}_{file.filename}')
        blob.upload_from_string(file_bytes, content_type=file.content_type or 'application/octet-stream')
        storage_url = blob.public_url
    except Exception:
        storage_url = None

    report_doc = db.collection('reports').document()
    report_doc.set({
        'id': report_doc.id,
        'user_id': user_id,
        'file_name': file.filename,
        'content_type': file.content_type,
        'storage_url': storage_url,
        'extracted_text': text[:50000],
        'analysis': result,
        'created_at': now,
        'updated_at': now,
    })

    return ReportAnalysisResponse(**result)


@router.get('/patient/{patient_id}')
def get_patient_reports(patient_id: str, user=Depends(get_current_user)):
    """Allows a doctor to view reports for a specific patient they consult."""
    db = get_db()
    role = user.get('role', 'patient')

    if role != 'doctor':
        if user.get('sub') != patient_id:
            raise HTTPException(status_code=403, detail='Not authorized to view these reports')
    else:
        doctor_id = user.get('sub')
        if not doctor_id:
            raise HTTPException(status_code=401, detail='Invalid token')
        if not _doctor_consults_patient(db, doctor_id, patient_id):
            raise HTTPException(status_code=403, detail='Doctor is not assigned to this patient')

    docs = db.collection('reports').where('user_id', '==', patient_id).stream()
    rows = []
    for d in docs:
        raw = d.to_dict()
        rows.append({
            **raw,
            'fileName': raw.get('fileName') or raw.get('file_name'),
            'fileType': raw.get('fileType') or raw.get('content_type'),
            'fileSize': raw.get('fileSize') or raw.get('file_size') or 0,
            'uploadedAt': raw.get('uploadedAt') or raw.get('created_at'),
            'status': raw.get('status', 'uploaded'),
            'notes': raw.get('notes') or '',
        })

    rows.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {'reports': rows}


@router.post('/{report_id}/analyze', response_model=ReportAnalysisResponse)
def analyze_existing_report(report_id: str, payload: dict | None = None, user=Depends(get_current_user)):
    db = get_db()
    report_ref = db.collection('reports').document(report_id)
    report_doc = report_ref.get()

    if not report_doc.exists:
        raise HTTPException(status_code=404, detail='Report not found')

    report = report_doc.to_dict() or {}
    patient_id = report.get('user_id')
    caller_id = user.get('sub')
    role = user.get('role', 'patient')

    if not caller_id:
        raise HTTPException(status_code=401, detail='Invalid token')

    if role == 'doctor':
        if not patient_id or not _doctor_consults_patient(db, caller_id, patient_id):
            raise HTTPException(status_code=403, detail='Doctor is not assigned to this patient')
    elif caller_id != patient_id:
        raise HTTPException(status_code=403, detail='Not authorized to analyze this report')

    extracted_text = report.get('extracted_text')
    if not extracted_text:
        raise HTTPException(status_code=400, detail='This report has no extractable text for AI analysis')

    context = None
    if isinstance(payload, dict):
        context = payload.get('context')

    result = analysis_service.analyze_report_text(extracted_text, context=context)
    report_ref.update(
        {
            'analysis': result,
            'status': 'analyzed',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
    )

    return ReportAnalysisResponse(**result)
