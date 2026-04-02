from pydantic import BaseModel, Field


class DiseaseSource(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    url: str = Field(min_length=8, max_length=500)
    publisher: str = Field(min_length=2, max_length=120)
    last_updated: str | None = None


class DiseaseRecord(BaseModel):
    disease_id: str = Field(min_length=3, max_length=40)
    disease_name: str = Field(min_length=3, max_length=120)
    aliases: list[str] = Field(default_factory=list)
    common_symptoms: list[str] = Field(min_length=1)
    differential_clues: list[str] = Field(default_factory=list)
    risk_factors: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    home_care: list[str] = Field(default_factory=list)
    when_to_seek_doctor: list[str] = Field(default_factory=list)
    emergency_signs: list[str] = Field(default_factory=list)
    diagnostics: list[str] = Field(default_factory=list)
    treatment_overview: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    age_group_notes: list[str] = Field(default_factory=list)
    severity_level: str = Field(default='medium')
    sources: list[DiseaseSource] = Field(min_length=1)


class DiseaseDataset(BaseModel):
    version: str
    updated_at: str
    diseases: list[DiseaseRecord] = Field(min_length=1)
