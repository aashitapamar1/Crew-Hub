from fastapi import APIRouter

from app.models.schemas import (
    RecommendRequest,
    RecommendationResult,
    ProjectDelayRequest,
    ProjectDelayResult,
    WorkloadRequest,
    WorkloadResult,
)
from app.services.recommend import recommend_freelancers
from app.services.delay_prediction import predict_delay
from app.services.workload import analyze_workload

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/recommend-freelancers", response_model=list[RecommendationResult])
def recommend(payload: RecommendRequest):
    return recommend_freelancers(payload)


@router.post("/project-delay", response_model=ProjectDelayResult)
def delay(payload: ProjectDelayRequest):
    return predict_delay(payload)


@router.post("/workload", response_model=list[WorkloadResult])
def workload(payload: WorkloadRequest):
    return analyze_workload(payload)
