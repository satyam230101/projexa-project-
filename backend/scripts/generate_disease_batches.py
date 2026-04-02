import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path


CATEGORY_TEMPLATES = {
    "respiratory": {
        "common_symptoms": ["cough", "breathlessness", "chest discomfort", "fatigue"],
        "risk_factors": ["smoking", "air pollution exposure", "chronic lung disease"],
        "red_flags": ["severe shortness of breath", "blue lips", "chest pain"],
        "home_care": ["rest", "adequate hydration", "avoid smoke exposure"],
        "when_to_seek_doctor": ["symptoms persist beyond 3 days", "breathing worsens"],
        "emergency_signs": ["oxygen saturation drop", "confusion", "inability to speak full sentences"],
        "diagnostics": ["clinical exam", "chest imaging when indicated", "blood oxygen check"],
        "treatment_overview": ["cause-specific treatment", "symptom control", "follow-up monitoring"],
        "prevention": ["hand hygiene", "vaccination when available", "mask use in outbreaks"],
        "source": {"title": "Respiratory diseases", "url": "https://www.who.int/health-topics/chronic-respiratory-diseases", "publisher": "WHO"},
    },
    "cardiovascular": {
        "common_symptoms": ["chest discomfort", "shortness of breath", "palpitations", "fatigue"],
        "risk_factors": ["high blood pressure", "diabetes", "smoking", "high cholesterol"],
        "red_flags": ["crushing chest pain", "fainting", "new neurological weakness"],
        "home_care": ["medication adherence", "salt restriction", "regular blood pressure checks"],
        "when_to_seek_doctor": ["persistent chest symptoms", "new swelling or reduced exercise tolerance"],
        "emergency_signs": ["severe chest pain", "stroke signs", "sudden breathlessness"],
        "diagnostics": ["ECG", "blood tests", "echocardiography when indicated"],
        "treatment_overview": ["risk-factor control", "evidence-based medicines", "urgent intervention when needed"],
        "prevention": ["exercise", "healthy diet", "blood pressure and sugar control", "stop smoking"],
        "source": {"title": "Cardiovascular diseases", "url": "https://www.who.int/health-topics/cardiovascular-diseases", "publisher": "WHO"},
    },
    "endocrine": {
        "common_symptoms": ["weight changes", "fatigue", "increased thirst or appetite", "mood changes"],
        "risk_factors": ["family history", "obesity", "sedentary lifestyle"],
        "red_flags": ["confusion", "dehydration", "severe weakness"],
        "home_care": ["regular monitoring", "balanced diet", "medication adherence"],
        "when_to_seek_doctor": ["uncontrolled symptoms", "recurrent low or high sugar symptoms"],
        "emergency_signs": ["altered consciousness", "persistent vomiting", "severe dehydration"],
        "diagnostics": ["hormone panel", "fasting glucose/HbA1c", "metabolic profile"],
        "treatment_overview": ["lifestyle management", "hormonal or glucose-lowering treatment"],
        "prevention": ["healthy weight", "routine screening for high-risk groups"],
        "source": {"title": "Diabetes and endocrine health", "url": "https://www.who.int/health-topics/diabetes", "publisher": "WHO"},
    },
    "gastrointestinal": {
        "common_symptoms": ["abdominal pain", "nausea", "vomiting", "bowel habit changes"],
        "risk_factors": ["unsafe food/water", "alcohol misuse", "high-fat diet"],
        "red_flags": ["blood in stool or vomit", "persistent severe pain", "dehydration"],
        "home_care": ["oral hydration", "light meals", "avoid trigger foods"],
        "when_to_seek_doctor": ["symptoms persist beyond 48-72 hours", "progressive pain"],
        "emergency_signs": ["severe abdominal rigidity", "continuous vomiting", "fainting"],
        "diagnostics": ["stool/blood tests", "ultrasound or endoscopy when indicated"],
        "treatment_overview": ["cause-targeted treatment", "rehydration", "dietary adjustments"],
        "prevention": ["safe food handling", "clean water", "limit alcohol"],
        "source": {"title": "Digestive health", "url": "https://medlineplus.gov/digestivediseases.html", "publisher": "MedlinePlus"},
    },
    "renal_urology": {
        "common_symptoms": ["urinary discomfort", "flank pain", "swelling", "fatigue"],
        "risk_factors": ["diabetes", "hypertension", "low fluid intake"],
        "red_flags": ["no urine output", "fever with flank pain", "blood in urine"],
        "home_care": ["adequate hydration", "blood pressure/sugar control", "medication adherence"],
        "when_to_seek_doctor": ["recurrent urinary symptoms", "worsening swelling or pain"],
        "emergency_signs": ["sepsis signs", "severe dehydration", "confusion"],
        "diagnostics": ["urinalysis", "renal function tests", "ultrasound"],
        "treatment_overview": ["treat infection or obstruction", "kidney-protective management"],
        "prevention": ["hydration", "prompt UTI treatment", "chronic disease control"],
        "source": {"title": "Kidney and urinary tract", "url": "https://medlineplus.gov/kidneydiseases.html", "publisher": "MedlinePlus"},
    },
    "neurology": {
        "common_symptoms": ["headache", "weakness", "numbness", "balance changes"],
        "risk_factors": ["vascular risk factors", "family history", "autoimmune tendency"],
        "red_flags": ["sudden weakness", "speech difficulty", "new seizures"],
        "home_care": ["sleep hygiene", "trigger tracking", "stress reduction"],
        "when_to_seek_doctor": ["new persistent neurological symptoms", "frequent disabling episodes"],
        "emergency_signs": ["stroke signs", "altered consciousness", "severe sudden headache"],
        "diagnostics": ["neurological exam", "brain imaging", "targeted lab tests"],
        "treatment_overview": ["condition-specific therapy", "rehabilitation when needed"],
        "prevention": ["risk-factor control", "regular follow-up", "medication adherence"],
        "source": {"title": "Neurological conditions", "url": "https://medlineplus.gov/neurologicdiseases.html", "publisher": "MedlinePlus"},
    },
    "eye_ent": {
        "common_symptoms": ["pain or irritation", "discharge", "reduced hearing or vision", "dizziness"],
        "risk_factors": ["allergies", "infections", "poor eye/ear hygiene"],
        "red_flags": ["sudden vision loss", "severe ear pain with fever", "persistent vertigo"],
        "home_care": ["rest", "avoid irritants", "follow local care advice"],
        "when_to_seek_doctor": ["symptoms persist >48 hours", "worsening pain"],
        "emergency_signs": ["sudden blindness", "facial weakness", "high fever with severe pain"],
        "diagnostics": ["eye/ear exam", "audiometry or pressure checks", "imaging if needed"],
        "treatment_overview": ["targeted antimicrobial/anti-inflammatory therapy"],
        "prevention": ["hand hygiene", "avoid sharing personal items", "routine eye checks"],
        "source": {"title": "Eye and ENT health", "url": "https://medlineplus.gov/eyeproblems.html", "publisher": "MedlinePlus"},
    },
    "musculoskeletal": {
        "common_symptoms": ["joint pain", "stiffness", "swelling", "movement limitation"],
        "risk_factors": ["age", "repetitive strain", "autoimmune disease"],
        "red_flags": ["hot swollen joint with fever", "trauma with deformity", "progressive weakness"],
        "home_care": ["rest and graded activity", "joint protection", "weight management"],
        "when_to_seek_doctor": ["pain >1 week", "morning stiffness worsening", "functional decline"],
        "emergency_signs": ["suspected fracture", "septic joint signs", "loss of bladder/bowel control with back pain"],
        "diagnostics": ["physical exam", "X-ray/ultrasound", "inflammatory markers"],
        "treatment_overview": ["pain control", "physiotherapy", "disease-modifying treatment when needed"],
        "prevention": ["exercise", "ergonomic posture", "adequate calcium/vitamin D"],
        "source": {"title": "Musculoskeletal conditions", "url": "https://www.who.int/news-room/fact-sheets/detail/musculoskeletal-conditions", "publisher": "WHO"},
    },
    "dermatology": {
        "common_symptoms": ["itching", "rash", "redness", "skin irritation"],
        "risk_factors": ["allergen exposure", "immune dysregulation", "skin barrier damage"],
        "red_flags": ["rapidly spreading painful rash", "fever with rash", "skin necrosis"],
        "home_care": ["gentle skin care", "avoid triggers", "keep skin moisturized"],
        "when_to_seek_doctor": ["persistent rash", "recurrent flare-ups", "secondary infection signs"],
        "emergency_signs": ["breathing difficulty with rash", "mucosal involvement", "severe skin pain"],
        "diagnostics": ["clinical exam", "allergy testing when indicated", "biopsy for atypical lesions"],
        "treatment_overview": ["topical/systemic therapy based on severity"],
        "prevention": ["trigger avoidance", "sun protection", "skin hydration"],
        "source": {"title": "Skin conditions", "url": "https://medlineplus.gov/skindiseases.html", "publisher": "MedlinePlus"},
    },
    "vectorborne": {
        "common_symptoms": ["fever", "headache", "body pain", "fatigue"],
        "risk_factors": ["mosquito exposure", "travel to endemic zones"],
        "red_flags": ["bleeding", "persistent vomiting", "severe weakness"],
        "home_care": ["hydration", "rest", "monitor warning signs closely"],
        "when_to_seek_doctor": ["high fever >2 days", "appearance of warning signs"],
        "emergency_signs": ["shock signs", "altered mental status", "severe dehydration"],
        "diagnostics": ["CBC", "rapid antigen/antibody tests", "PCR where available"],
        "treatment_overview": ["supportive care", "disease-specific treatment when available"],
        "prevention": ["mosquito bite prevention", "vector control", "safe water practices"],
        "source": {"title": "Vector-borne diseases", "url": "https://www.who.int/health-topics/vector-borne-diseases", "publisher": "WHO"},
    },
    "vaccine_preventable": {
        "common_symptoms": ["fever", "rash or gland swelling", "fatigue", "upper respiratory symptoms"],
        "risk_factors": ["incomplete vaccination", "outbreak exposure"],
        "red_flags": ["breathing difficulty", "dehydration", "neurological symptoms"],
        "home_care": ["hydration", "fever monitoring", "isolation as advised"],
        "when_to_seek_doctor": ["persistent fever", "worsening rash", "reduced oral intake"],
        "emergency_signs": ["seizure", "confusion", "severe breathing difficulty"],
        "diagnostics": ["clinical exam", "serology/PCR in selected cases"],
        "treatment_overview": ["supportive care", "complication management"],
        "prevention": ["timely vaccination", "isolation during infectious period"],
        "source": {"title": "Immunization and vaccine-preventable diseases", "url": "https://www.who.int/health-topics/vaccines-and-immunization", "publisher": "WHO"},
    },
    "sti": {
        "common_symptoms": ["genital discharge", "painful urination", "pelvic discomfort", "sores or rash"],
        "risk_factors": ["unprotected sex", "multiple partners"],
        "red_flags": ["severe pelvic pain", "fever", "pregnancy with symptoms"],
        "home_care": ["avoid sexual contact until evaluated", "hydration", "partner notification"],
        "when_to_seek_doctor": ["any persistent genital symptoms", "new sores or discharge"],
        "emergency_signs": ["high fever", "severe abdominal pain", "confusion"],
        "diagnostics": ["NAAT/serology", "clinical exam"],
        "treatment_overview": ["pathogen-specific antimicrobial therapy", "partner management"],
        "prevention": ["condom use", "routine screening", "prompt treatment"],
        "source": {"title": "Sexually transmitted infections", "url": "https://www.who.int/health-topics/sexually-transmitted-infections", "publisher": "WHO"},
    },
    "mental_health": {
        "common_symptoms": ["low mood or anxiety", "sleep disturbance", "concentration issues", "functional decline"],
        "risk_factors": ["chronic stress", "family history", "trauma"],
        "red_flags": ["self-harm thoughts", "severe agitation", "psychosis"],
        "home_care": ["sleep routine", "social support", "limit substance use"],
        "when_to_seek_doctor": ["symptoms >2 weeks", "daily function affected"],
        "emergency_signs": ["suicidal intent", "violent behavior", "severe confusion"],
        "diagnostics": ["clinical assessment", "screening scales"],
        "treatment_overview": ["psychotherapy", "medication when indicated", "regular follow-up"],
        "prevention": ["stress management", "early help-seeking", "community support"],
        "source": {"title": "Mental health", "url": "https://www.who.int/health-topics/mental-health", "publisher": "WHO"},
    },
    "hematology": {
        "common_symptoms": ["fatigue", "pallor", "dizziness", "reduced exercise tolerance"],
        "risk_factors": ["nutritional deficiency", "chronic illness", "blood loss"],
        "red_flags": ["chest pain", "fainting", "severe weakness"],
        "home_care": ["nutrient-rich diet", "medication adherence", "follow-up blood tests"],
        "when_to_seek_doctor": ["persistent fatigue", "symptoms worsening"],
        "emergency_signs": ["severe breathlessness", "collapse", "active bleeding"],
        "diagnostics": ["CBC", "iron/B12 profile", "cause-specific tests"],
        "treatment_overview": ["supplementation or targeted treatment"],
        "prevention": ["balanced diet", "screening in high-risk groups"],
        "source": {"title": "Anaemia", "url": "https://www.who.int/health-topics/anaemia", "publisher": "WHO"},
    },
    "oncology": {
        "common_symptoms": ["unintentional weight loss", "persistent fatigue", "pain", "new mass or bleeding"],
        "risk_factors": ["tobacco", "family history", "age"],
        "red_flags": ["persistent unexplained symptoms", "bleeding", "rapid decline"],
        "home_care": ["follow specialist plan", "nutrition support", "symptom diary"],
        "when_to_seek_doctor": ["new persistent alarming symptoms", "screening abnormalities"],
        "emergency_signs": ["airway compromise", "severe bleeding", "high fever in immunocompromised patient"],
        "diagnostics": ["imaging", "biopsy", "tumor-specific lab tests"],
        "treatment_overview": ["surgery, radiotherapy, chemotherapy or targeted treatment as advised"],
        "prevention": ["screening", "avoid tobacco", "vaccination where relevant"],
        "source": {"title": "Cancer", "url": "https://www.who.int/health-topics/cancer", "publisher": "WHO"},
    },
    "reproductive": {
        "common_symptoms": ["pelvic pain", "menstrual irregularity", "bloating", "fatigue"],
        "risk_factors": ["hormonal imbalance", "family history", "reproductive age factors"],
        "red_flags": ["severe pelvic pain", "heavy bleeding", "fainting"],
        "home_care": ["pain tracking", "hydration", "regular gynecological review"],
        "when_to_seek_doctor": ["persistent pelvic symptoms", "cycle changes"],
        "emergency_signs": ["sudden severe pain", "shock signs", "pregnancy with pain/bleeding"],
        "diagnostics": ["pelvic exam", "ultrasound", "hormonal tests"],
        "treatment_overview": ["medical or surgical management depending on condition"],
        "prevention": ["routine reproductive health check-ups", "early symptom reporting"],
        "source": {"title": "Women's health", "url": "https://medlineplus.gov/womenshealth.html", "publisher": "MedlinePlus"},
    },
}


DISEASES = [
    {"name": "Influenza", "aliases": ["flu"], "category": "respiratory", "severity": "medium"},
    {"name": "Common Cold", "aliases": ["viral cold"], "category": "respiratory", "severity": "low"},
    {"name": "COVID-19", "aliases": ["coronavirus disease"], "category": "respiratory", "severity": "medium"},
    {"name": "Asthma", "aliases": ["bronchial asthma"], "category": "respiratory", "severity": "medium"},
    {"name": "Chronic Obstructive Pulmonary Disease", "aliases": ["COPD"], "category": "respiratory", "severity": "high"},
    {"name": "Pneumonia", "aliases": ["lung infection"], "category": "respiratory", "severity": "high"},
    {"name": "Tuberculosis", "aliases": ["TB"], "category": "respiratory", "severity": "high"},
    {"name": "Acute Bronchitis", "aliases": ["chest cold"], "category": "respiratory", "severity": "medium"},
    {"name": "Sinusitis", "aliases": ["sinus infection"], "category": "respiratory", "severity": "low"},
    {"name": "Allergic Rhinitis", "aliases": ["hay fever"], "category": "respiratory", "severity": "low"},
    {"name": "Hypertension", "aliases": ["high blood pressure"], "category": "cardiovascular", "severity": "medium"},
    {"name": "Coronary Artery Disease", "aliases": ["ischemic heart disease"], "category": "cardiovascular", "severity": "high"},
    {"name": "Heart Failure", "aliases": ["congestive heart failure"], "category": "cardiovascular", "severity": "high"},
    {"name": "Atrial Fibrillation", "aliases": ["AF"], "category": "cardiovascular", "severity": "medium"},
    {"name": "Stroke", "aliases": ["cerebrovascular accident"], "category": "cardiovascular", "severity": "high"},
    {"name": "Deep Vein Thrombosis", "aliases": ["DVT"], "category": "cardiovascular", "severity": "high"},
    {"name": "Pulmonary Embolism", "aliases": ["PE"], "category": "cardiovascular", "severity": "high"},
    {"name": "Peripheral Artery Disease", "aliases": ["PAD"], "category": "cardiovascular", "severity": "medium"},
    {"name": "Hyperlipidemia", "aliases": ["high cholesterol"], "category": "cardiovascular", "severity": "medium"},
    {"name": "Myocardial Infarction", "aliases": ["heart attack"], "category": "cardiovascular", "severity": "high"},
    {"name": "Type 2 Diabetes Mellitus", "aliases": ["type 2 diabetes"], "category": "endocrine", "severity": "medium"},
    {"name": "Type 1 Diabetes Mellitus", "aliases": ["type 1 diabetes"], "category": "endocrine", "severity": "high"},
    {"name": "Hypothyroidism", "aliases": ["underactive thyroid"], "category": "endocrine", "severity": "medium"},
    {"name": "Hyperthyroidism", "aliases": ["overactive thyroid"], "category": "endocrine", "severity": "medium"},
    {"name": "Obesity", "aliases": ["high body fat"], "category": "endocrine", "severity": "medium"},
    {"name": "Metabolic Syndrome", "aliases": ["insulin resistance syndrome"], "category": "endocrine", "severity": "medium"},
    {"name": "Cushing Syndrome", "aliases": ["hypercortisolism"], "category": "endocrine", "severity": "medium"},
    {"name": "Addison Disease", "aliases": ["adrenal insufficiency"], "category": "endocrine", "severity": "high"},
    {"name": "Polycystic Ovary Syndrome", "aliases": ["PCOS"], "category": "endocrine", "severity": "medium"},
    {"name": "Gestational Diabetes", "aliases": ["pregnancy diabetes"], "category": "endocrine", "severity": "medium"},
    {"name": "Gastroesophageal Reflux Disease", "aliases": ["GERD", "acid reflux"], "category": "gastrointestinal", "severity": "low"},
    {"name": "Peptic Ulcer Disease", "aliases": ["stomach ulcer"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Irritable Bowel Syndrome", "aliases": ["IBS"], "category": "gastrointestinal", "severity": "low"},
    {"name": "Inflammatory Bowel Disease", "aliases": ["IBD"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Crohn Disease", "aliases": ["regional enteritis"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Ulcerative Colitis", "aliases": ["UC"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Gastroenteritis", "aliases": ["stomach flu"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Hepatitis B", "aliases": ["HBV infection"], "category": "gastrointestinal", "severity": "high"},
    {"name": "Non-Alcoholic Fatty Liver Disease", "aliases": ["NAFLD"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Gallstones", "aliases": ["cholelithiasis"], "category": "gastrointestinal", "severity": "medium"},
    {"name": "Appendicitis", "aliases": ["appendix inflammation"], "category": "gastrointestinal", "severity": "high"},
    {"name": "Pancreatitis", "aliases": ["pancreas inflammation"], "category": "gastrointestinal", "severity": "high"},
    {"name": "Chronic Kidney Disease", "aliases": ["CKD"], "category": "renal_urology", "severity": "high"},
    {"name": "Acute Kidney Injury", "aliases": ["AKI"], "category": "renal_urology", "severity": "high"},
    {"name": "Urinary Tract Infection", "aliases": ["UTI"], "category": "renal_urology", "severity": "medium"},
    {"name": "Kidney Stones", "aliases": ["renal stones"], "category": "renal_urology", "severity": "medium"},
    {"name": "Benign Prostatic Hyperplasia", "aliases": ["BPH"], "category": "renal_urology", "severity": "low"},
    {"name": "Prostatitis", "aliases": ["prostate inflammation"], "category": "renal_urology", "severity": "medium"},
    {"name": "Migraine", "aliases": ["migraine headache"], "category": "neurology", "severity": "medium"},
    {"name": "Tension-Type Headache", "aliases": ["tension headache"], "category": "neurology", "severity": "low"},
    {"name": "Epilepsy", "aliases": ["seizure disorder"], "category": "neurology", "severity": "high"},
    {"name": "Parkinson Disease", "aliases": ["parkinsonism"], "category": "neurology", "severity": "medium"},
    {"name": "Alzheimer Disease", "aliases": ["dementia"], "category": "neurology", "severity": "high"},
    {"name": "Multiple Sclerosis", "aliases": ["MS"], "category": "neurology", "severity": "high"},
    {"name": "Peripheral Neuropathy", "aliases": ["nerve damage"], "category": "neurology", "severity": "medium"},
    {"name": "Meningitis", "aliases": ["meningeal infection"], "category": "neurology", "severity": "high"},
    {"name": "Conjunctivitis", "aliases": ["pink eye"], "category": "eye_ent", "severity": "low"},
    {"name": "Glaucoma", "aliases": ["optic nerve damage"], "category": "eye_ent", "severity": "high"},
    {"name": "Cataract", "aliases": ["lens opacity"], "category": "eye_ent", "severity": "medium"},
    {"name": "Otitis Media", "aliases": ["middle ear infection"], "category": "eye_ent", "severity": "medium"},
    {"name": "Vertigo", "aliases": ["spinning sensation"], "category": "eye_ent", "severity": "medium"},
    {"name": "Osteoarthritis", "aliases": ["degenerative joint disease"], "category": "musculoskeletal", "severity": "medium"},
    {"name": "Rheumatoid Arthritis", "aliases": ["RA"], "category": "musculoskeletal", "severity": "medium"},
    {"name": "Gout", "aliases": ["gouty arthritis"], "category": "musculoskeletal", "severity": "medium"},
    {"name": "Systemic Lupus Erythematosus", "aliases": ["SLE", "lupus"], "category": "musculoskeletal", "severity": "high"},
    {"name": "Osteoporosis", "aliases": ["low bone density"], "category": "musculoskeletal", "severity": "medium"},
    {"name": "Low Back Pain", "aliases": ["lumbar pain"], "category": "musculoskeletal", "severity": "low"},
    {"name": "Cervical Spondylosis", "aliases": ["neck arthritis"], "category": "musculoskeletal", "severity": "low"},
    {"name": "Psoriasis", "aliases": ["plaque psoriasis"], "category": "dermatology", "severity": "medium"},
    {"name": "Eczema", "aliases": ["atopic dermatitis"], "category": "dermatology", "severity": "medium"},
    {"name": "Acne Vulgaris", "aliases": ["acne"], "category": "dermatology", "severity": "low"},
    {"name": "Cellulitis", "aliases": ["skin infection"], "category": "dermatology", "severity": "medium"},
    {"name": "Dengue", "aliases": ["breakbone fever"], "category": "vectorborne", "severity": "high"},
    {"name": "Malaria", "aliases": ["plasmodium infection"], "category": "vectorborne", "severity": "high"},
    {"name": "Typhoid Fever", "aliases": ["enteric fever"], "category": "vectorborne", "severity": "high"},
    {"name": "Chikungunya", "aliases": ["chikv infection"], "category": "vectorborne", "severity": "medium"},
    {"name": "Measles", "aliases": ["rubeola"], "category": "vaccine_preventable", "severity": "high"},
    {"name": "Mumps", "aliases": ["parotitis"], "category": "vaccine_preventable", "severity": "medium"},
    {"name": "Rubella", "aliases": ["german measles"], "category": "vaccine_preventable", "severity": "medium"},
    {"name": "Varicella", "aliases": ["chickenpox"], "category": "vaccine_preventable", "severity": "medium"},
    {"name": "HIV Infection", "aliases": ["human immunodeficiency virus"], "category": "sti", "severity": "high"},
    {"name": "Syphilis", "aliases": ["treponema infection"], "category": "sti", "severity": "medium"},
    {"name": "Gonorrhea", "aliases": ["gonococcal infection"], "category": "sti", "severity": "medium"},
    {"name": "Chlamydia", "aliases": ["chlamydial infection"], "category": "sti", "severity": "medium"},
    {"name": "Depression", "aliases": ["major depressive disorder"], "category": "mental_health", "severity": "high"},
    {"name": "Generalized Anxiety Disorder", "aliases": ["GAD"], "category": "mental_health", "severity": "medium"},
    {"name": "Panic Disorder", "aliases": ["panic attacks"], "category": "mental_health", "severity": "medium"},
    {"name": "Bipolar Disorder", "aliases": ["bipolar affective disorder"], "category": "mental_health", "severity": "high"},
    {"name": "Schizophrenia", "aliases": ["psychotic disorder"], "category": "mental_health", "severity": "high"},
    {"name": "Insomnia", "aliases": ["sleep initiation disorder"], "category": "mental_health", "severity": "low"},
    {"name": "Iron Deficiency Anemia", "aliases": ["IDA"], "category": "hematology", "severity": "medium"},
    {"name": "Vitamin B12 Deficiency", "aliases": ["cobalamin deficiency"], "category": "hematology", "severity": "medium"},
    {"name": "Breast Cancer", "aliases": ["mammary carcinoma"], "category": "oncology", "severity": "high"},
    {"name": "Cervical Cancer", "aliases": ["cervix carcinoma"], "category": "oncology", "severity": "high"},
    {"name": "Colorectal Cancer", "aliases": ["colon cancer"], "category": "oncology", "severity": "high"},
    {"name": "Lung Cancer", "aliases": ["pulmonary carcinoma"], "category": "oncology", "severity": "high"},
    {"name": "Prostate Cancer", "aliases": ["prostatic carcinoma"], "category": "oncology", "severity": "high"},
    {"name": "Thyroid Cancer", "aliases": ["thyroid carcinoma"], "category": "oncology", "severity": "high"},
    {"name": "Ovarian Cyst", "aliases": ["functional ovarian cyst"], "category": "reproductive", "severity": "medium"},
    {"name": "Endometriosis", "aliases": ["endometrial implants"], "category": "reproductive", "severity": "medium"},
]


def slugify(text: str) -> str:
    out = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return out[:40]


def build_record(item: dict) -> dict:
    template = CATEGORY_TEMPLATES[item["category"]]
    source = template["source"]
    return {
        "disease_id": slugify(item["name"]),
        "disease_name": item["name"],
        "aliases": item.get("aliases", []),
        "common_symptoms": template["common_symptoms"],
        "differential_clues": [
            f"Consider {item['name']} when symptom cluster and risk profile match.",
            "Rule out emergency and overlapping conditions via clinical evaluation.",
        ],
        "risk_factors": template["risk_factors"],
        "red_flags": template["red_flags"],
        "home_care": template["home_care"],
        "when_to_seek_doctor": template["when_to_seek_doctor"],
        "emergency_signs": template["emergency_signs"],
        "diagnostics": template["diagnostics"],
        "treatment_overview": template["treatment_overview"],
        "prevention": template["prevention"],
        "age_group_notes": ["Clinical severity and management vary by age, pregnancy, and comorbidities."],
        "severity_level": item.get("severity", "medium"),
        "sources": [
            {
                "title": source["title"],
                "url": source["url"],
                "publisher": source["publisher"],
                "last_updated": datetime.now(timezone.utc).date().isoformat(),
            }
        ],
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate 100-disease starter dataset and batches.")
    parser.add_argument("--output", required=True, help="Path to merged diseases.json")
    parser.add_argument("--batch-dir", required=True, help="Directory to write batch files")
    parser.add_argument("--batch-size", type=int, default=20, help="Batch size (default: 20)")
    args = parser.parse_args()

    if len(DISEASES) != 100:
        print(f"Expected 100 disease entries but found {len(DISEASES)}")
        return 1

    records = [build_record(item) for item in DISEASES]
    now_ts = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    merged = {
        "version": "v1.1",
        "updated_at": now_ts,
        "diseases": records,
    }

    output_path = Path(args.output)
    batch_dir = Path(args.batch_dir)

    write_json(output_path, merged)

    total = len(records)
    batch_count = math.ceil(total / args.batch_size)
    for i in range(batch_count):
        start = i * args.batch_size
        end = min(start + args.batch_size, total)
        batch_payload = {
            "version": "v1.1",
            "updated_at": now_ts,
            "diseases": records[start:end],
        }
        batch_path = batch_dir / f"diseases_batch_{i + 1:02d}_{start + 1:03d}_{end:03d}.json"
        write_json(batch_path, batch_payload)

    print(f"Generated merged dataset: {output_path}")
    print(f"Generated {batch_count} batch files in: {batch_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
